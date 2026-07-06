# RamblerRegistrar — LOCAL rotating backup of the full SQLite DB (incl. the
# complete enrollment_history time-series). Zips locus.db into a sibling folder
# and keeps the newest $keep copies.
#
# NOTE: this is a same-machine backup — it protects against accidental deletion,
# a bad write, or DB corruption, but NOT a drive failure. For true off-site
# durability, revisit the cloud/private-repo option later (see HANDOFF).
#
# Scheduled daily by the RamblerBackend-Backup task (launched hidden via run-hidden.vbs).

$ErrorActionPreference = 'Stop'

$src  = 'C:\Users\LeoArkos\RamblerRegistrar\backend\locus.db'
$dir  = 'C:\Users\LeoArkos\RamblerRegistrar-backups'   # sibling of the repo, outside git
$keep = 10
$log  = Join-Path $dir 'backup.log'
$stamp = Get-Date -Format 'yyyy-MM-dd_HHmm'

if (-not (Test-Path $src)) { Write-Output "source DB missing: $src"; exit 1 }
New-Item -ItemType Directory -Force -Path $dir | Out-Null

Compress-Archive -Path $src -DestinationPath (Join-Path $dir "locus-$stamp.db.zip") -Force

# Rotate: keep only the newest $keep zips.
Get-ChildItem $dir -Filter 'locus-*.db.zip' |
  Sort-Object LastWriteTime -Descending |
  Select-Object -Skip $keep |
  Remove-Item -Force -ErrorAction SilentlyContinue

$mb = [math]::Round((Get-Item $src).Length / 1MB, 1)
try { Add-Content $log "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')  backed up locus.db ($mb MB) -> locus-$stamp.db.zip" } catch {}
