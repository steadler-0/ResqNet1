# Copy SentinelX into RescueNet (run from PowerShell)
$ErrorActionPreference = 'Stop'
$CU = 'd:\cu'
$RN = 'C:\Users\Yuvaraj B\Desktop\RescueNet'

Set-Location $CU
node scripts/merge-to-rescuenet.mjs
node scripts/patch-rescuenet-dashboard.mjs

Write-Host ''
Write-Host 'Merge complete. Start RescueNet:' -ForegroundColor Green
Write-Host "  cd `"$RN`""
Write-Host '  npm run dev:client'
Write-Host 'Open Dashboard — geo-tag section is below the stats.'
