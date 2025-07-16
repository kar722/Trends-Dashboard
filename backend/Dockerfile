FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Download and cache the model during build
RUN python -c "from transformers import AutoTokenizer, AutoModelForSequenceClassification; \
    model_name='cardiffnlp/twitter-roberta-base-sentiment'; \
    AutoTokenizer.from_pretrained(model_name); \
    AutoModelForSequenceClassification.from_pretrained(model_name)"

# The container will use the PORT environment variable provided by Cloud Run
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --timeout-keep-alive 75 --workers 1 