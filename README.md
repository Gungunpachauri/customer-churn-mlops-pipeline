# Telco Customer Churn Prediction

End-to-end machine learning project for predicting telecom customer churn, with:
- data validation and training pipeline
- MLflow experiment tracking
- FastAPI inference API
- React UI for interactive predictions
- Dockerized deployment

## Project Goals

- Train a robust churn prediction model from the Telco dataset.
- Keep training and serving transformations consistent.
- Expose predictions through both API and UI.
- Provide reproducible local and containerized workflows.

## Tech Stack

### Backend and ML
- Python 3.10+
- FastAPI + Uvicorn
- Pandas, Scikit-learn, XGBoost
- Great Expectations (data validation)
- MLflow (tracking and model artifacts)

### Frontend
- React
- Vite

### DevOps
- Docker (multi-stage build)
- PowerShell automation scripts

## Repository Structure

```text
churn_prediction/
  artifacts/                     # exported serving artifacts (model bundle)
  data/
    raw/                         # input dataset
    processed/                   # processed outputs from pipeline
  frontend/                      # React UI
  scripts/
    run_pipeline.py              # train + evaluate + export model artifacts
    run_all.ps1                  # one-command full workflow
    start_mlflow.ps1             # SQL-backed MLflow server startup
  src/
    app/main.py                  # FastAPI app + optional static UI serving
    serving/model/inference.py   # model loading + prediction logic
    utils/validate_data.py       # Great Expectations checks
  dockerfile
  requirements.txt
```

## How It Works

1. Raw data is loaded and validated.
2. Data is preprocessed and feature-engineered.
3. Model is trained and tracked in MLflow.
4. A serving bundle is exported to `artifacts/model`.
5. FastAPI loads the serving bundle and serves predictions.
6. React UI calls `/predict` and displays results.

## Prerequisites

- Windows PowerShell
- Python 3.10 or 3.11
- Docker Desktop running

## Quick Start (Recommended)

Run full workflow with one command script.

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\venv\Scripts\Activate.ps1
powershell -ExecutionPolicy Bypass -File scripts/run_all.ps1
```

This does:
- optional dependency install
- model training and artifact export
- docker image build
- container restart
- health check

After completion:
- API: http://127.0.0.1:8001
- UI: http://127.0.0.1:8001/ui
- Docs: http://127.0.0.1:8001/docs

## Daily Fast Run (Skip install + training)

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run_all.ps1 -SkipPip -SkipTrain
```

## Manual Local Run (Without Docker)

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python scripts/run_pipeline.py --input data/raw/WA_Fn-UseC_-Telco-Customer-Churn.csv --target Churn
python -m uvicorn src.app.main:app --host 0.0.0.0 --port 8000
```

Open:
- http://127.0.0.1:8000/ui
- http://127.0.0.1:8000/docs

## Manual Docker Run

```powershell
docker build -t churn-prediction:latest -f dockerfile .
docker rm -f churn-prediction-container
docker run -d --name churn-prediction-container -p 8001:8000 churn-prediction:latest
```

Health check:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8001/health | Select-Object -ExpandProperty Content
```

## API Endpoints

- `GET /` - root status and links
- `GET /health` - health check
- `POST /predict` - churn prediction
- `GET /docs` - Swagger UI
- `GET /ui` - React frontend

### Example Prediction Request

```powershell
$body = @{
  gender = "Female"
  Partner = "No"
  Dependents = "No"
  PhoneService = "Yes"
  MultipleLines = "No"
  InternetService = "Fiber optic"
  OnlineSecurity = "No"
  OnlineBackup = "No"
  DeviceProtection = "No"
  TechSupport = "No"
  StreamingTV = "Yes"
  StreamingMovies = "Yes"
  Contract = "Month-to-month"
  PaperlessBilling = "Yes"
  PaymentMethod = "Electronic check"
  tenure = 1
  MonthlyCharges = 85.0
  TotalCharges = 85.0
} | ConvertTo-Json

Invoke-RestMethod -Uri http://127.0.0.1:8001/predict -Method Post -ContentType "application/json" -Body $body
```

## MLflow Tracking

### Start MLflow (SQL backend, recommended)

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start_mlflow.ps1 -Port 5001
```

Open: http://127.0.0.1:5001

This uses:
- SQLite backend store: `mlflow.db`
- Artifact root: `mlruns`

### Why SQL backend?

Some UI features (such as dataset search) are not supported by FileStore-only tracking. SQL backend avoids those errors.

## Script Parameters

### `scripts/run_all.ps1`

- `-SkipPip` skip `pip install`
- `-SkipTrain` skip training
- `-ImageName` Docker image name (default `churn-prediction:latest`)
- `-ContainerName` container name (default `churn-prediction-container`)
- `-HostPort` host port (default `8001`)
- `-ContainerPort` container port (default `8000`)
- `-InputCsv` training data path
- `-Target` target column name

Example:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run_all.ps1 -HostPort 8010 -SkipPip
```

## Troubleshooting

### 1) `Model artifacts not found`

Cause: model bundle missing.

Fix:

```powershell
python scripts/run_pipeline.py --input data/raw/WA_Fn-UseC_-Telco-Customer-Churn.csv --target Churn
```

Confirm these exist:
- `artifacts/model/MLmodel`
- `artifacts/model/feature_columns.txt`

### 2) UI loads but assets 404

Use `/ui` route and rebuild image:

```powershell
docker build -t churn-prediction:latest -f dockerfile .
docker rm -f churn-prediction-container
docker run -d --name churn-prediction-container -p 8001:8000 churn-prediction:latest
```

### 3) `No module named src.app`

Run commands from project root, not from `frontend/`.

### 4) `ERR_ADDRESS_INVALID` for `0.0.0.0`

Open `127.0.0.1` or `localhost` in browser instead.

## Notes

- Local Uvicorn typically runs on port `8000`.
- Docker container is mapped to host port `8001` by default in scripts.
- Existing model is loaded lazily; app can start even before model is present.
