# Comprehensive AAB 16 KB Page Size Compliance Analyzer
# Extracts all .so files and checks LOAD segment alignment

param(
    [string]$AabPath = "android\app\build\outputs\bundle\release\MarketBrand.aab",
    [string]$OutputDir = "aab_16kb_analysis"
)

Write-Host "=== AAB 16 KB Page Size Compliance Analyzer ===" -ForegroundColor Cyan
Write-Host ""

# Check if AAB exists
if (-not (Test-Path $AabPath)) {
    Write-Host "❌ AAB file not found: $AabPath" -ForegroundColor Red
    Write-Host "Please build the AAB first: cd android && .\gradlew bundleRelease" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found AAB: $AabPath" -ForegroundColor Green
Write-Host ""

# Create output directory
if (Test-Path $OutputDir) {
    Remove-Item -Path $OutputDir -Recurse -Force
}
New-Item -ItemType Directory -Path $OutputDir | Out-Null

# Extract AAB
Write-Host "=== Step 1: Extracting AAB ===" -ForegroundColor Yellow
$extractedPath = Join-Path $OutputDir "extracted"
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($AabPath, $extractedPath)
Write-Host "✅ AAB extracted" -ForegroundColor Green
Write-Host ""

# Find all .so files
Write-Host "=== Step 2: Finding Native Libraries ===" -ForegroundColor Yellow
$soFiles = Get-ChildItem -Path $extractedPath -Filter "*.so" -Recurse

if ($soFiles.Count -eq 0) {
    Write-Host "⚠️  No .so files found" -ForegroundColor Yellow
    exit 0
}

Write-Host "✅ Found $($soFiles.Count) native libraries" -ForegroundColor Green

# Group by ABI
$libsByAbi = $soFiles | Group-Object {
    $dir = $_.DirectoryName
    if ($dir -match "arm64-v8a") { "arm64-v8a" }
    elseif ($dir -match "armeabi-v7a") { "armeabi-v7a" }
    elseif ($dir -match "x86") { "x86" }
    elseif ($dir -match "x86_64") { "x86_64" }
    else { "unknown" }
}

Write-Host ""
Write-Host "Libraries by ABI:" -ForegroundColor Cyan
foreach ($abi in $libsByAbi) {
    Write-Host "  $($abi.Name): $($abi.Count) libraries" -ForegroundColor White
}
Write-Host ""

# Check for readelf or llvm-objdump
$readelfPath = $null
$objdumpPath = $null
$tool = $null

# Check for readelf
$readelfPaths = @("readelf", "C:\Program Files\Git\usr\bin\readelf.exe")
foreach ($path in $readelfPaths) {
    try {
        $result = Get-Command $path -ErrorAction SilentlyContinue
        if ($result) {
            $readelfPath = $path
            $tool = "readelf"
            break
        }
    } catch {}
}

# Check WSL readelf
if (-not $readelfPath) {
    try {
        $wslCheck = wsl which readelf 2>$null
        if ($wslCheck) {
            $readelfPath = "wsl readelf"
            $tool = "readelf"
        }
    } catch {}
}

# Check for llvm-objdump
if (-not $readelfPath) {
    $objdumpPaths = @("llvm-objdump", "objdump")
    foreach ($path in $objdumpPaths) {
        try {
            $result = Get-Command $path -ErrorAction SilentlyContinue
            if ($result) {
                $objdumpPath = $path
                $tool = "objdump"
                break
            }
        } catch {}
    }
}

if (-not $readelfPath -and -not $objdumpPath) {
    Write-Host "⚠️  Neither readelf nor llvm-objdump found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install one of:" -ForegroundColor Yellow
    Write-Host "  - Git Bash (includes readelf)" -ForegroundColor Gray
    Write-Host "  - WSL with binutils" -ForegroundColor Gray
    Write-Host "  - LLVM tools (llvm-objdump)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Listing all libraries found:" -ForegroundColor Cyan
    foreach ($soFile in $soFiles) {
        $abi = "unknown"
        if ($soFile.DirectoryName -match "arm64-v8a") { $abi = "arm64-v8a" }
        elseif ($soFile.DirectoryName -match "armeabi-v7a") { $abi = "armeabi-v7a" }
        Write-Host "  [$abi] $($soFile.Name)" -ForegroundColor White
    }
    exit 1
}

Write-Host "✅ Using tool: $tool" -ForegroundColor Green
Write-Host ""

# Analyze each library
Write-Host "=== Step 3: Analyzing LOAD Segment Alignment ===" -ForegroundColor Yellow
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
    
    $libName = $soFile.Name
    $libPath = $soFile.FullName
    
    Write-Host "Analyzing: $libName ($abi)..." -ForegroundColor Gray -NoNewline
    
    $alignment = $null
    $maxPageSize = $null
    $errorMsg = $null
    
    try {
        if ($tool -eq "readelf") {
            if ($readelfPath -like "wsl *") {
                $wslPath = $libPath -replace "\\", "/" -replace "C:", "/mnt/c"
                $output = wsl readelf -l $wslPath 2>&1
            } else {
                $output = & $readelfPath -l $libPath 2>&1
            }
            
            # Look for LOAD segment alignment
            # Example: "  LOAD           0x000000 0x0000000000000000 0x0000000000000000 0x123456 0x123456 R E 0x10000"
            # The last hex number before R/E is the alignment
            if ($output -match "LOAD\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+[RWX]+\s+0x([0-9a-fA-F]+)") {
                $alignment = [Convert]::ToInt64($matches[1], 16)
            }
            
            # Also check for max-page-size in notes
            $noteOutput = if ($readelfPath -like "wsl *") {
                wsl readelf -n $wslPath 2>&1
            } else {
                & $readelfPath -n $libPath 2>&1
            }
            
            if ($noteOutput -match "max-page-size.*0x([0-9a-fA-F]+)") {
                $maxPageSize = [Convert]::ToInt64($matches[1], 16)
            }
        }
        elseif ($tool -eq "objdump") {
            $output = & $objdumpPath -p $libPath 2>&1
            
            # Look for LOAD segment in program headers
            if ($output -match "LOAD\s+off\s+\S+\s+vaddr\s+\S+\s+paddr\s+\S+\s+align\s+0x([0-9a-fA-F]+)") {
                $alignment = [Convert]::ToInt64($matches[1], 16)
            }
            
            # Check for max-page-size
            if ($output -match "max-page-size\s+0x([0-9a-fA-F]+)") {
                $maxPageSize = [Convert]::ToInt64($matches[1], 16)
            }
        }
    }
    catch {
        $errorMsg = $_.Exception.Message
    }
    
    # Determine compliance
    $isCompliant = $false
    $status = "UNKNOWN"
    $statusColor = "Yellow"
    
    if ($errorMsg) {
        $status = "ERROR"
        $statusColor = "Red"
    }
    elseif ($alignment) {
        if ($alignment -ge 16384) {
            $isCompliant = $true
            $status = "✅ COMPLIANT"
            $statusColor = "Green"
            $compliantCount++
        }
        elseif ($alignment -eq 4096) {
            $isCompliant = $false
            $status = "❌ NON-COMPLIANT (4 KB only)"
            $statusColor = "Red"
            $nonCompliantCount++
        }
        else {
            $status = "⚠️  UNKNOWN ($alignment bytes)"
            $statusColor = "Yellow"
        }
    }
    elseif ($maxPageSize) {
        if ($maxPageSize -ge 16384) {
            $isCompliant = $true
            $status = "✅ COMPLIANT"
            $statusColor = "Green"
            $compliantCount++
        }
        else {
            $isCompliant = $false
            $status = "❌ NON-COMPLIANT"
            $statusColor = "Red"
            $nonCompliantCount++
        }
    }
    else {
        $status = "⚠️  COULD NOT DETERMINE"
        $statusColor = "Yellow"
    }
    
    Write-Host " $status" -ForegroundColor $statusColor
    if ($alignment) {
        Write-Host "   Alignment: $alignment bytes ($([math]::Round($alignment/1024, 2)) KB)" -ForegroundColor Gray
    }
    if ($maxPageSize) {
        Write-Host "   Max page size: $maxPageSize bytes" -ForegroundColor Gray
    }
    if ($errorMsg) {
        Write-Host "   Error: $errorMsg" -ForegroundColor Red
    }
    
    $result = [PSCustomObject]@{
        Library = $libName
        ABI = $abi
        Alignment = if ($alignment) { "$alignment bytes" } else { "N/A" }
        MaxPageSize = if ($maxPageSize) { "$maxPageSize bytes" } else { "N/A" }
        Status = $status
        Compliant = $isCompliant
        Error = $errorMsg
        Path = $libPath
    }
    
    $results += $result
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "  Total libraries: $($soFiles.Count)" -ForegroundColor White
Write-Host "  ✅ Compliant (16 KB+): $compliantCount" -ForegroundColor Green
Write-Host "  ❌ Non-compliant (4 KB only): $nonCompliantCount" -ForegroundColor Red
Write-Host "  ⚠️  Unknown/Error: $($soFiles.Count - $compliantCount - $nonCompliantCount)" -ForegroundColor Yellow
Write-Host ""

# Export detailed results
$csvPath = Join-Path $OutputDir "16kb_compliance_report.csv"
$results | Export-Csv -Path $csvPath -NoTypeInformation
Write-Host "📄 Detailed report: $csvPath" -ForegroundColor Cyan

# List non-compliant libraries
$nonCompliant = $results | Where-Object { -not $_.Compliant -and $_.Status -like "*NON-COMPLIANT*" }
if ($nonCompliant.Count -gt 0) {
    Write-Host ""
    Write-Host "=== ❌ Non-Compliant Libraries ===" -ForegroundColor Red
    foreach ($lib in $nonCompliant) {
        Write-Host "  [$($lib.ABI)] $($lib.Library)" -ForegroundColor White
        Write-Host "    Alignment: $($lib.Alignment)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Analysis complete! Check $OutputDir for detailed results." -ForegroundColor Cyan
Write-Host ""

