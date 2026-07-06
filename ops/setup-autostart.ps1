# RamblerRegistrar — one-time setup for the ops Scheduled Tasks (B1 + backup).
#
# Registers two tasks, both launched HIDDEN via run-hidden.vbs (wscript) so no
# console window ever flashes on screen:
#
#   RamblerBackend-HealthMonitor  — at logon + every 5 min: pings /api/health and
#                                   runs `pm2 resurrect` if the API is down.
#   RamblerBackend-Backup         — daily 4 PM: local rotating zip backup of locus.db.
#
# Run ONCE (re-running is safe; -Force replaces the tasks):
#   powershell -NoProfile -ExecutionPolicy Bypass -File ops\setup-autostart.ps1
#
# Inspect / remove:
#   Get-ScheduledTaskInfo -TaskName RamblerBackend-HealthMonitor
#   Unregister-ScheduledTask -TaskName RamblerBackend-HealthMonitor -Confirm:$false
#   Unregister-ScheduledTask -TaskName RamblerBackend-Backup -Confirm:$false

$ErrorActionPreference = 'Stop'

$opsDir = $PSScriptRoot
$vbs = Join-Path $opsDir 'run-hidden.vbs'
$hm  = Join-Path $opsDir 'health-monitor.ps1'
$bk  = Join-Path $opsDir 'backup-db-local.ps1'
$pm2 = Join-Path $env:APPDATA 'npm\pm2.cmd'

foreach ($f in @($vbs, $hm, $bk)) { if (-not (Test-Path $f)) { throw "missing: $f" } }

# Persist the current PM2 process list so `pm2 resurrect` has something to restore.
& $pm2 save | Out-Null
Write-Host 'pm2 process list saved.'

$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" `
  -LogonType Interactive -RunLevel Limited

# --- Health monitor (at logon + every 5 min), launched hidden ---
$hmAction = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument ('"{0}" "{1}"' -f $vbs, $hm)
$hmTriggers = @(
  (New-ScheduledTaskTrigger -AtLogOn -User "$env:USERNAME"),
  (New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5))
)
$hmSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 4)
Register-ScheduledTask -TaskName 'RamblerBackend-HealthMonitor' -Action $hmAction `
  -Trigger $hmTriggers -Principal $principal -Settings $hmSettings `
  -Description 'Pings /api/health every 5 min + at logon; self-heals via pm2 resurrect. Launched hidden.' `
  -Force | Out-Null
Write-Host "Registered 'RamblerBackend-HealthMonitor' (logon + every 5 min, hidden)."

# --- Daily local backup (4 PM), launched hidden ---
$bkAction = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument ('"{0}" "{1}"' -f $vbs, $bk)
$bkTrigger = New-ScheduledTaskTrigger -Daily -At ([datetime]'16:00')
$bkSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
  -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 10)
Register-ScheduledTask -TaskName 'RamblerBackend-Backup' -Action $bkAction `
  -Trigger $bkTrigger -Principal $principal -Settings $bkSettings `
  -Description 'Daily local rotating zip backup of locus.db. Launched hidden.' `
  -Force | Out-Null
Write-Host "Registered 'RamblerBackend-Backup' (daily 4 PM, hidden)."
