# 1) Build React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /ui
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# 2) Build Python runtime
FROM python:3.11-slim

# 3) Set working directory
WORKDIR /app

# 4) Install system deps
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 5) Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 6) Copy backend source
COPY . .

# 7) Copy artifacts and built frontend
# Keep /app/model available for production images where model is mounted/copied.
RUN mkdir -p /app/model
COPY artifacts /app/artifacts
COPY --from=frontend-builder /ui/dist /app/frontend/dist

# 8) Runtime env vars
ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# 9) Expose API port
EXPOSE 8000

# 10) Start FastAPI
CMD ["uvicorn", "src.app.main:app", "--host", "0.0.0.0", "--port", "8000"]