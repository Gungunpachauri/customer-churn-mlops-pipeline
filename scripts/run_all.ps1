param(
    [switch]$SkipPip,
    [switch]$SkipTrain,
    [string]$ImageName = "churn-prediction:latest",
    [string]$ContainerName = "churn-prediction-container",
    [int]$HostPort = 8001,
    [int]$ContainerPort = 8000,
    [string]$InputCsv = "data/raw/WA_Fn-UseC_-Telco-Customer-Churn.csv",
    [string]$Target = "Churn",
    [string]$MlflowDbPath = "mlflow.db"
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot

$pythonExe = Join-Path $repoRoot "venv\Scripts\python.exe"
if (-not (Test-Path $pythonExe)) {
    throw "Python venv not found at $pythonExe"
}

Write-Step "Using repo root: $repoRoot"
Write-Step "Using Python: $pythonExe"

if (-not $SkipPip) {
    Write-Step "Installing Python dependencies"
    & $pythonExe -m pip install -r requirements.txt
}

if (-not $SkipTrain) {
    $mlflowUri = "sqlite:///" + (Join-Path $repoRoot $MlflowDbPath).Replace("\", "/")
    Write-Step "Training model and exporting artifacts/model"
    & $pythonExe scripts/run_pipeline.py --input $InputCsv --target $Target --mlflow_uri $mlflowUri
}

Write-Step "Building Docker image: $ImageName"
docker build -t $ImageName -f dockerfile .

Write-Step "Replacing container: $ContainerName"
docker rm -f $ContainerName 2>$null | Out-Null
$containerId = docker run -d --name $ContainerName -p "${HostPort}:${ContainerPort}" $ImageName
Write-Host "Started container: $containerId"

Write-Step "Waiting for API health"
$healthUrl = "http://127.0.0.1:$HostPort/health"
$maxRetries = 20
$ready = $false
for ($i = 1; $i -le $maxRetries; $i++) {
    try {
        $response = Invoke-RestMethod -Uri $healthUrl -Method Get -TimeoutSec 5
        if ($response.status -eq "ok") {
            $ready = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if (-not $ready) {
    Write-Host "Container did not become healthy in time. Showing logs:" -ForegroundColor Yellow
    docker logs $ContainerName --tail 100
    throw "Health check failed: $healthUrl"
}

Write-Step "Done"
Write-Host "API:  http://127.0.0.1:$HostPort"
Write-Host "UI:   http://127.0.0.1:$HostPort/ui"
Write-Host "Docs: http://127.0.0.1:$HostPort/docs"
