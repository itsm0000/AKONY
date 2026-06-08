# Antigravity IDE Profile Restorer
# This script restores settings, extension states, and database linkages for the old IDE.

$ErrorActionPreference = "Stop"

Write-Host "=============================================" -ForegroundColor Green
Write-Host "   Antigravity IDE Profile Restorer Tool     " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# 1. Wait for Antigravity IDE to close
Write-Host "Checking if Antigravity IDE is running..." -ForegroundColor Cyan
while ($true) {
    $processes = Get-Process -Name "Antigravity IDE", "Antigravity" -ErrorAction SilentlyContinue
    if ($processes) {
        Write-Host "Antigravity IDE is still running. Please close the editor/IDE." -ForegroundColor Yellow
        Write-Host "Waiting 3 seconds..."
        Start-Sleep -Seconds 3
    } else {
        Write-Host "Antigravity IDE is closed. Proceeding..." -ForegroundColor Green
        break
    }
}

# 2. Source and Target folders
$sourceDir = "C:\Users\MT\AppData\Roaming\Antigravity"
$targetDir = "C:\Users\MT\AppData\Roaming\Antigravity IDE"
$backupDir = "C:\Users\MT\AppData\Roaming\Antigravity IDE_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

if (-not (Test-Path $sourceDir)) {
    Write-Error "Source profile directory not found: $sourceDir. Unable to restore."
}

# 3. Create Backup
if (Test-Path $targetDir) {
    Write-Host "Backing up current profile to: $backupDir" -ForegroundColor Cyan
    Rename-Item -Path $targetDir -NewName (Split-Path $backupDir -Leaf) -Force
}

# 4. Copy old profile
Write-Host "Restoring old profile settings and database to $targetDir..." -ForegroundColor Cyan
Copy-Item -Path $sourceDir -Destination $targetDir -Recurse -Force

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "   Profile restored successfully!            " -ForegroundColor Green
Write-Host "   You can now open the Antigravity IDE.     " -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
