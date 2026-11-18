# RamblerRegistrar - backend health monitor + self-heal
# Runs from Task Scheduler (at logon + every 5 min). Pings the API health
# endpoint and treats the backend as unhealthy when it does not answer OR when
# it answers but reports a wedged scrape/poll lock (a hung Chrome keeps the lock
# held forever while the HTTP server still says OK).
#
# Escalation:
#   not answering -> pm2 resurrect -> (still failing) pm2 restart rambler-backend
#   wedged        -> pm2 restart rambler-backend (resurrect does nothing for a
#                    process that is running but hung)
# Every unhealthy episode writes a greppable "HEALTH-ALERT" log line and, when
# the environment variable RAMBLER_ALERT_WEBHOOK is set, POSTs {"text": "..."} to
# it (Slack/Discord-style incoming webhook). Unset = no webhook. Repeat alerts
# are throttled to one per hour. Silent on success to keep the log to incidents.
#
# Registered task: "RamblerBackend-HealthMonitor" (see ops/setup-autostart.ps1)

$ErrorActionPreference = 'Stop'

# 127.0.0.1, not localhost: the backend listens on IPv4 loopback only, and
# localhost can resolve to ::1 first.
$healthUrl = 'http://127.0.0.1:3001/api/health'
$logFile   = 'C:\Users\LeoArkos\RamblerRegistrar\ops\health-monitor.log'
$pm2       = 'C:\Users\LeoArkos\AppData\Roaming\npm\pm2.cmd'
$appName   = 'rambler-backend'   # name in backend/ecosystem.config.js
$stamp     = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

function Log($msg) { Add-Content -Path $logFile -Value "$stamp  $msg" }

# Returns @{ Up = bool; Wedged = bool; Reason = string }.
# An older server build answers 200 without the lock fields: that counts as up.
function Get-Health {
    try {
        $r = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 10 -UseBasicParsing
        if ($r.StatusCode -ne 200) { return @{ Up = $false; Wedged = $false; Reason = "HTTP $($r.StatusCode)" } }
        $wedged = $false
        $reason = ''
        try {
            $j = $r.Content | ConvertFrom-Json
            if ($j.wedged -eq $true) {
                $wedged = $true
                $reason = ($j.wedgedReasons -join '; ')
            }
        } catch {
            # unparseable body: the server answered, treat as up
        }
        return @{ Up = $true; Wedged = $wedged; Reason = $reason }
    } catch {
        return @{ Up = $false; Wedged = $false; Reason = 'no response' }
    }
}

function Test-Healthy {
    $h = Get-Health
    return ($h.Up -and -not $h.Wedged)
}

# Greppable alert line + optional webhook (no-op when RAMBLER_ALERT_WEBHOOK is
# unset). Throttled to one webhook per hour so a long outage does not spam.
function Send-Alert($msg) {
    Log "HEALTH-ALERT $msg"
    $hook = $env:RAMBLER_ALERT_WEBHOOK
    if (-not $hook) { return }
    $flag = "$env:TEMP\rambler-health-alert.flag"
    if ((Test-Path $flag) -and ((Get-Date) - (Get-Item $flag).LastWriteTime).TotalMinutes -lt 60) { return }
    try {
        $body = @{ text = "RamblerRegistrar backend: $msg" } | ConvertTo-Json
        Invoke-RestMethod -Uri $hook -Method Post -ContentType 'application/json' -Body $body -TimeoutSec 15 | Out-Null
        New-Item -ItemType File -Path $flag -Force | Out-Null
        (Get-Item $flag).LastWriteTime = Get-Date
    } catch {
        Log "alert webhook failed: $($_.Exception.Message)"
    }
}

$health = Get-Health
if ($health.Up -and -not $health.Wedged) {
    # Healthy - write a lightweight daily heartbeat (once per calendar day) so
    # the log proves the monitor itself is running, without flooding it.
    $today = (Get-Date -Format 'yyyy-MM-dd')
    $marker = "$env:TEMP\rambler-health-ok-$today.flag"
    if (-not (Test-Path $marker)) {
        New-Item -ItemType File -Path $marker -Force | Out-Null
        Log 'OK (daily heartbeat)'
    }
    exit 0
}

if ($health.Up -and $health.Wedged) {
    # Running but hung: resurrect would be a no-op, go straight to a restart.
    Send-Alert "WEDGED - $($health.Reason). Restarting $appName..."
    try {
        & $pm2 restart $appName 2>&1 | Out-Null
    } catch {
        Log "restart threw: $($_.Exception.Message)"
    }
    Start-Sleep -Seconds 10
    if (Test-Healthy) {
        Log 'RECOVERED - healthy after pm2 restart (was wedged).'
    } else {
        Send-Alert "STILL UNHEALTHY after restart of wedged $appName - manual intervention needed (check pm2 logs)."
    }
    exit 0
}

# Down - attempt self-heal, escalating
Send-Alert "DOWN - /api/health $($health.Reason). Running pm2 resurrect..."
try {
    & $pm2 resurrect 2>&1 | Out-Null
} catch {
    Log "resurrect threw: $($_.Exception.Message)"
}
Start-Sleep -Seconds 6

if (Test-Healthy) {
    Log 'RECOVERED - API responding after pm2 resurrect.'
    exit 0
}

# Resurrect only restores a missing process. If something is still listed but
# not answering, restart it by name.
Log "Still failing after resurrect. Running pm2 restart $appName..."
try {
    & $pm2 restart $appName 2>&1 | Out-Null
} catch {
    Log "restart threw: $($_.Exception.Message)"
}
Start-Sleep -Seconds 10

if (Test-Healthy) {
    Log 'RECOVERED - API responding after pm2 restart.'
} else {
    Send-Alert 'STILL DOWN after resurrect and restart - manual intervention needed (check `pm2 logs`).'
}
