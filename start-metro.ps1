# PowerShell script to start Metro with increased memory
$env:NODE_OPTIONS = "--max-old-space-size=8192"
Write-Host "Starting Metro with increased memory limits (8GB)..." -ForegroundColor Green
Write-Host "NODE_OPTIONS: $env:NODE_OPTIONS" -ForegroundColor Yellow
npx react-native start --reset-cache
