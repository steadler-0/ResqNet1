# Refresh PATH so Node.js (D:\Node) is available in this terminal session
$nodeDir = "D:\Node"
if (Test-Path "$nodeDir\node.exe") {
    $env:Path = "$nodeDir;" + [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
    Write-Host "Node.js ready:" -ForegroundColor Cyan
    node -v
    npm -v
} else {
    Write-Host "Node.js not found at D:\Node. Install from https://nodejs.org or run:" -ForegroundColor Red
    Write-Host "  winget install OpenJS.NodeJS.LTS" -ForegroundColor Yellow
    exit 1
}
