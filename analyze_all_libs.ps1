# Analyze all .so files using Python script
param(
    [string]$ExtractedPath = "aab_16kb_analysis\extracted"
)

Write-Host "=== Analyzing All Native Libraries ===" -ForegroundColor Cyan
Write-Host ""

# Check if Python is available
$pythonCmd = $null
$pythonPaths = @("python", "python3", "py")
foreach ($cmd in $pythonPaths) {
    try {
        $result = Get-Command $cmd -ErrorAction SilentlyContinue
        if ($result) {
            $pythonCmd = $cmd
            break
        }
    } catch {}
}

if (-not $pythonCmd) {
    Write-Host "❌ Python not found!" -ForegroundColor Red
    Write-Host "Please install Python 3 to use this script" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Using Python: $pythonCmd" -ForegroundColor Green
Write-Host ""

# Find all .so files
$soFiles = Get-ChildItem -Path $ExtractedPath -Filter "*.so" -Recurse

if ($soFiles.Count -eq 0) {
    Write-Host "⚠️  No .so files found" -ForegroundColor Yellow
    exit 0
}

Write-Host "Found $($soFiles.Count) libraries to analyze" -ForegroundColor Cyan
Write-Host ""

$results = @()
$compliantCount = 0
$nonCompliantCount = 0

foreach ($soFile in $soFiles) {
    $abi = "unknown"
    if ($soFile.DirectoryName -match "arm64-v8a") { $abi = "arm64-v8a" }
    elseif ($soFile.DirectoryName -match "armeabi-v7a") { $abi = "armeabi-v7a" }
    elseif ($soFile.DirectoryName -match "x86") { $abi = "x86" }
    elseif ($soFile.DirectoryName -match "x86_64") { $abi = "x86_64" }
    
    Write-Host "Analyzing: $($soFile.Name) ($abi)..." -ForegroundColor Gray -NoNewline
    
    try {
        $output = & $pythonCmd analyze_elf_16kb.py $soFile.FullName 2>&1 | Out-String
        $exitCode = $LASTEXITCODE
        
        # Parse output even if exit code is non-zero (non-compliant libraries exit with code 1)
        if ($output -match "Alignment:\s+(\d+)") {
            $alignment = [int]$matches[1]
            $statusMatch = if ($output -match "Status:\s+(.+)") { $matches[1] } else { "Unknown" }
            
            $isCompliant = $alignment -ge 16384
            $statusColor = if ($isCompliant) { "Green" } else { "Red" }
            $statusText = if ($isCompliant) { "COMPLIANT" } else { "NON-COMPLIANT" }
            $statusIcon = if ($isCompliant) { "✅" } else { "❌" }
            
            Write-Host " $statusIcon $statusText ($alignment bytes)" -ForegroundColor $statusColor
            
            if ($isCompliant) {
                $compliantCount++
            } else {
                $nonCompliantCount++
            }
            
            $results += [PSCustomObject]@{
                Library = $soFile.Name
                ABI = $abi
                Alignment = "$alignment bytes"
                Status = $statusText
                Compliant = $isCompliant
            }
        } else {
            Write-Host " ERROR" -ForegroundColor Red
            Write-Host "   Output: $($output.Trim())" -ForegroundColor Gray
            $results += [PSCustomObject]@{
                Library = $soFile.Name
                ABI = $abi
                Alignment = "ERROR"
                Status = "Could not analyze"
                Compliant = $false
            }
        }
    } catch {
        Write-Host " ERROR: $_" -ForegroundColor Red
        $results += [PSCustomObject]@{
            Library = $soFile.Name
            ABI = $abi
            Alignment = "ERROR"
            Status = "Exception: $_"
            Compliant = $false
        }
    }
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "  Total: $($soFiles.Count)" -ForegroundColor White
Write-Host "  ✅ Compliant: $compliantCount" -ForegroundColor Green
Write-Host "  ❌ Non-compliant: $nonCompliantCount" -ForegroundColor Red
Write-Host ""

# Export results
$csvPath = "aab_16kb_analysis\detailed_analysis.csv"
$results | Export-Csv -Path $csvPath -NoTypeInformation
Write-Host "📄 Results saved to: $csvPath" -ForegroundColor Cyan

# List non-compliant
$nonCompliant = $results | Where-Object { -not $_.Compliant }
if ($nonCompliant.Count -gt 0) {
    Write-Host ""
    Write-Host "=== ❌ Non-Compliant Libraries ===" -ForegroundColor Red
    foreach ($lib in $nonCompliant) {
        Write-Host "  [$($lib.ABI)] $($lib.Library) - $($lib.Alignment)" -ForegroundColor White
    }
}

