# RamblerRegistrar - backend health monitor + self-heal
# Runs from Task Scheduler (at logon + every 5 min). Pings the API health
# endpoint; if it's down, runs `pm2 resurrect` to restore the process, then
# re-checks and logs the outcome. Silent on success to keep the log to incidents.
#
# Registered task: "RamblerBackend-HealthMonitor" (see ops/setup-autostart.ps1)

$ErrorActionPreference = 'Stop'

$healthUrl = 'http://localhost:3001/api/health'
$logFile   = 'C:\Users\LeoArkos\RamblerRegistrar\ops\health-monitor.log'
$pm2       = 'C:\Users\LeoArkos\AppData\Roaming\npm\pm2.cmd'
$stamp     = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

function Log($msg) { Add-Content -Path $logFile -Value "$stamp  $msg" }

function Test-Health {
    try {
        $r = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 10 -UseBasicParsing
        return ($r.StatusCode -eq 200)
    } catch {
        return $false
    }
}

if (Test-Health) {
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

# Down - attempt self-heal
Log 'DOWN - /api/health not responding. Running pm2 resurrect...'
try {
    & $pm2 resurrect 2>&1 | Out-Null
} catch {
    Log "resurrect threw: $($_.Exception.Message)"
}
Start-Sleep -Seconds 6

if (Test-Health) {
    Log 'RECOVERED - API responding after pm2 resurrect.'
} else {
    Log 'STILL DOWN after resurrect - manual intervention needed (check `pm2 logs`).'
}
