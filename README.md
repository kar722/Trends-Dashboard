# Trends Dashboard

A dashboard that visualizes trending data from Google Trends and YouTube APIs.

## Prerequisites

- Python 3.8+
- Node.js 14+
- pip (Python package manager)
- npm (Node.js package manager)

## Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file in the backend directory:
```bash
touch .env
```

4. Add your API keys to `.env`:
```
YOUTUBE_API_KEY=your_youtube_api_key_here
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node.js dependencies:
```bash
npm install
```

## Running the Application

1. Start the backend server (from the backend directory):
```bash
uvicorn main:app --reload
```
The backend will run on `http://localhost:8000`

2. Start the frontend development server (from the frontend directory):
```bash
npm start
```
The frontend will run on `http://localhost:3000`

## Required API Keys

- **YouTube Data API v3**: Required for YouTube trending data
  - Get it from [Google Cloud Console](https://console.cloud.google.com)
  - Enable "YouTube Data API v3" in your Google Cloud Project

## Features

- Google Trends data visualization
- YouTube trending video analysis
- Sentiment analysis of video titles
- Regional interest mapping
- Time-series trend analysis