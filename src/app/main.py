"""
FASTAPI SERVING APPLICATION - API + REACT FRONTEND SUPPORT
===========================================================

This application exposes the churn prediction REST API and can optionally serve a
built React frontend from /ui when frontend build artifacts are present.
"""

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from src.serving.model.inference import predict

# Initialize FastAPI application
app = FastAPI(
    title="Telco Customer Churn Prediction API",
    description="ML API for predicting customer churn in telecom industry",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === HEALTH CHECK ENDPOINT ===
# CRITICAL: Required for AWS Application Load Balancer health checks
@app.get("/")
def root():
    """
    Health check endpoint for monitoring and load balancer health checks.
    """
    return {"status": "ok", "docs": "/docs", "ui": "/ui"}


@app.get("/health")
def health():
    """Dedicated health endpoint for infra checks."""
    return {"status": "ok"}

# === REQUEST DATA SCHEMA ===
# Pydantic model for automatic validation and API documentation
class CustomerData(BaseModel):
    """
    Customer data schema for churn prediction.
    
    This schema defines the exact 18 features required for churn prediction.
    All features match the original dataset structure for consistency.
    """
    # Demographics
    gender: str                # "Male" or "Female"
    Partner: str               # "Yes" or "No" - has partner
    Dependents: str            # "Yes" or "No" - has dependents
    
    # Phone services
    PhoneService: str          # "Yes" or "No"
    MultipleLines: str         # "Yes", "No", or "No phone service"
    
    # Internet services  
    InternetService: str       # "DSL", "Fiber optic", or "No"
    OnlineSecurity: str        # "Yes", "No", or "No internet service"
    OnlineBackup: str          # "Yes", "No", or "No internet service"
    DeviceProtection: str      # "Yes", "No", or "No internet service"
    TechSupport: str           # "Yes", "No", or "No internet service"
    StreamingTV: str           # "Yes", "No", or "No internet service"
    StreamingMovies: str       # "Yes", "No", or "No internet service"
    
    # Account information
    Contract: str              # "Month-to-month", "One year", "Two year"
    PaperlessBilling: str      # "Yes" or "No"
    PaymentMethod: str         # "Electronic check", "Mailed check", etc.
    
    # Numeric features
    tenure: int                # Number of months with company
    MonthlyCharges: float      # Monthly charges in dollars
    TotalCharges: float        # Total charges to date

# === MAIN PREDICTION API ENDPOINT ===
@app.post("/predict")
def get_prediction(data: CustomerData):
    """
    Main prediction endpoint for customer churn prediction.
    
    This endpoint:
    1. Receives validated customer data via Pydantic model
    2. Calls the inference pipeline to transform features and predict
    3. Returns churn prediction in JSON format
    
    Expected Response:
    - {"prediction": "Likely to churn"} or {"prediction": "Not likely to churn"}
    - {"error": "error_message"} if prediction fails
    """
    try:
        # Convert Pydantic model to dict and call inference pipeline
        result = predict(data.dict())
        return {"prediction": result}
    except Exception as e:
        # Return error details for debugging (consider logging in production)
        return {"error": str(e)}


# === OPTIONAL REACT STATIC SERVING ===
BASE_DIR = Path(__file__).resolve().parents[2]
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"

if FRONTEND_DIST.exists():
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/ui/assets", StaticFiles(directory=str(assets_dir)), name="ui-assets")
        # Backward-compatible path for builds generated with base='/'
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")


@app.get("/ui")
def serve_ui():
    """Serve React app index if available."""
    index_path = FRONTEND_DIST / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="React UI build not found. Build frontend first.")
    return FileResponse(index_path)


@app.get("/ui/{path:path}")
def serve_ui_routes(path: str):
    """Serve static React routes and files from built frontend."""
    if not FRONTEND_DIST.exists():
        raise HTTPException(status_code=404, detail="React UI build not found. Build frontend first.")

    requested_file = FRONTEND_DIST / path
    if requested_file.is_file():
        return FileResponse(requested_file)

    index_path = FRONTEND_DIST / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=404, detail="React UI build not found. Build frontend first.")
    return FileResponse(index_path)