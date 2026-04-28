param(
    [int]$Port = 5001,
    [string]$DbPath = "mlflow.db",
    [string]$ArtifactRoot = "mlruns"
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $repoRoot

$dbUri = "sqlite:///" + (Join-Path $repoRoot $DbPath).Replace("\", "/")
$artifactUri = "file:///" + (Join-Path $repoRoot $ArtifactRoot).Replace("\", "/")

Write-Host "Starting MLflow tracking server" -ForegroundColor Cyan
Write-Host "Backend store: $dbUri"
Write-Host "Artifact root: $artifactUri"
Write-Host "UI URL: http://127.0.0.1:$Port"

$pythonExe = Join-Path $repoRoot "venv\Scripts\python.exe"
if (Test-Path $pythonExe) {
    & $pythonExe -m mlflow server --host 127.0.0.1 --port $Port --backend-store-uri $dbUri --default-artifact-root $artifactUri
} else {
    python -m mlflow server --host 127.0.0.1 --port $Port --backend-store-uri $dbUri --default-artifact-root $artifactUri
}
