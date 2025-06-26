from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pytrends.request import TrendReq
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import pandas as pd
import json
from googleapiclient.discovery import build
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import numpy as np
from langdetect import detect, DetectorFactory
import os
from dotenv import load_dotenv

app = FastAPI(title="CPG Trends API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize pytrends
pytrends = TrendReq(hl='en-US', tz=360)

# Load environment variables
load_dotenv()

# Initialize YouTube API
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
if not YOUTUBE_API_KEY:
    raise ValueError("YouTube API key not found. Please set YOUTUBE_API_KEY in .env file")
youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)

# Initialize sentiment model
model_name = "cardiffnlp/twitter-roberta-base-sentiment"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)

# Fix seed for consistent language detection
DetectorFactory.seed = 0

# Helper function for sentiment analysis
def classify_sentiment(text: str) -> tuple[str, float]:
    inputs = tokenizer(text, return_tensors="pt", truncation=True)
    outputs = model(**inputs)
    scores = outputs.logits.detach().numpy()[0]
    probs = np.exp(scores) / np.sum(np.exp(scores))  # softmax
    labels = ["Negative", "Neutral", "Positive"]
    return labels[np.argmax(probs)], float(np.max(probs))

# Valid timeframes
VALID_TIMEFRAMES = [
    "today 6-m",
    "today 12-m",
    "today 3-y",
    "today 5-y"
]

# CPG Categories with their Google Trends category IDs
CPG_CATEGORIES = {
    "Beverages": {
        "id": 71,
        "subcategories": [
            "Coffee & Tea",
            "Plant-based Milk",
            "Soft Drinks",
            "Energy Drinks",
            "Functional Beverages",
            "Sparkling Water"
        ]
    },
    "Snacks & Confectionery": {
        "id": 71,
        "subcategories": [
            "Chips & Crisps",
            "Protein Bars",
            "Nuts & Seeds",
            "Chocolate",
            "Healthy Snacks",
            "Cookies & Crackers"
        ]
    },
    "Dairy & Alternatives": {
        "id": 71,
        "subcategories": [
            "Yogurt",
            "Cheese",
            "Plant-based Dairy",
            "Ice Cream",
            "Butter & Spreads"
        ]
    },
    "Pantry Items": {
        "id": 71,
        "subcategories": [
            "Condiments & Sauces",
            "Cooking Oils",
            "Pasta & Grains",
            "Canned Goods",
            "Baking Products",
            "Seasonings"
        ]
    },
    "Personal Care": {
        "id": 44,
        "subcategories": [
            "Skincare",
            "Hair Care",
            "Oral Care",
            "Body Care",
            "Natural Beauty",
            "Deodorants"
        ]
    },
    "Household Essentials": {
        "id": 299,
        "subcategories": [
            "Cleaning Products",
            "Laundry Care",
            "Paper Products",
            "Air Care",
            "Storage & Organization"
        ]
    },
    "Health & Wellness": {
        "id": 45,
        "subcategories": [
            "Vitamins & Supplements",
            "Protein Powders",
            "Functional Foods",
            "Digestive Health",
            "Immunity Products"
        ]
    },
    "Baby & Child Care": {
        "id": 44,
        "subcategories": [
            "Baby Food",
            "Diapers & Wipes",
            "Baby Care Products",
            "Children's Health",
            "Baby Feeding"
        ]
    }
}

def serialize_dataframe(df: pd.DataFrame) -> Dict[str, Any]:
    """Helper function to serialize pandas DataFrame to JSON-compatible format."""
    if df is None or df.empty:
        return {}
    
    # For time series data
    if isinstance(df.index, pd.DatetimeIndex):
        result = {}
        for column in df.columns:
            result[column] = {
                'dates': df.index.strftime('%Y-%m-%d').tolist(),
                'values': df[column].tolist()
            }
        return result
    
    # For regional data
    else:
        # Convert state names to state codes for the map
        state_codes = {
            'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
            'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
            'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
            'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
            'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
            'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH',
            'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC',
            'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA',
            'Rhode Island': 'RI', 'South Carolina': 'SC', 'South Dakota': 'SD', 'Tennessee': 'TN',
            'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA',
            'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
        }
        
        result = {}
        for col in df.columns:
            # Convert state names to codes and create a mapping of values
            state_values = {}
            for state, value in df[col].items():
                if state in state_codes:
                    state_values[state_codes[state]] = int(value) if pd.notnull(value) else 0
            result[col] = state_values
        return result

@app.get("/")
def read_root():
    return {"message": "Welcome to CPG Trends API"}

@app.get("/categories")
def get_categories():
    return CPG_CATEGORIES

@app.get("/trends/{category}/{keyword}")
def get_trends(
    category: str,
    keyword: str,
    timeframe: str = "today 12-m",
    geo: str = "US"
):
    try:
        # Validate timeframe
        if timeframe not in VALID_TIMEFRAMES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid timeframe. Must be one of: {', '.join(VALID_TIMEFRAMES)}"
            )
        
        # Validate category
        if category not in CPG_CATEGORIES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid category. Must be one of: {', '.join(CPG_CATEGORIES.keys())}"
            )
        
        # Get category ID
        cat_id = CPG_CATEGORIES[category]["id"]
        
        # Build payload
        try:
            pytrends.build_payload(
                [keyword],
                cat=cat_id,
                timeframe=timeframe,
                geo=geo
            )
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Error building trends payload: {str(e)}"
            )
        
        # Get interest over time
        try:
            interest_over_time = pytrends.interest_over_time()
            if interest_over_time.empty:
                print("No interest over time data found")
                interest_over_time = pd.DataFrame()
            else:
                print(f"Interest over time data shape: {interest_over_time.shape}")
        except Exception as e:
            print(f"Error fetching interest over time: {str(e)}")
            interest_over_time = pd.DataFrame()
        
        # Get interest by region
        try:
            interest_by_region = pytrends.interest_by_region(resolution='REGION', inc_low_vol=True)
            if interest_by_region.empty:
                print("No regional data found")
                interest_by_region = pd.DataFrame()
            else:
                print(f"Regional data shape: {interest_by_region.shape}")
                print(f"Regional data columns: {interest_by_region.columns}")
                print(f"First few rows: {interest_by_region.head()}")
        except Exception as e:
            print(f"Error fetching regional data: {str(e)}")
            interest_by_region = pd.DataFrame()
        
        # Process the data
        result = {
            "interest_over_time": serialize_dataframe(interest_over_time),
            "interest_by_region": serialize_dataframe(interest_by_region)
        }
        
        print(f"Final result structure: {result.keys()}")
        print(f"Regional data in result: {bool(result['interest_by_region'])}")
        
        return result
    
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/trends/compare/{category}")
def compare_trends(
    category: str,
    keywords: List[str],
    timeframe: str = "today 12-m",
    geo: str = "US"
):
    try:
        # Validate timeframe
        if timeframe not in VALID_TIMEFRAMES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid timeframe. Must be one of: {', '.join(VALID_TIMEFRAMES)}"
            )
        
        # Validate category
        if category not in CPG_CATEGORIES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid category. Must be one of: {', '.join(CPG_CATEGORIES.keys())}"
            )
        
        # Get category ID
        cat_id = CPG_CATEGORIES[category]["id"]
        
        # Validate keywords
        if not keywords or len(keywords) > 5:
            raise HTTPException(
                status_code=400,
                detail="Must provide between 1 and 5 keywords"
            )
        
        # Build payload
        try:
            pytrends.build_payload(
                keywords,
                cat=cat_id,
                timeframe=timeframe,
                geo=geo
            )
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Error building trends payload: {str(e)}"
            )
        
        # Get interest over time
        try:
            interest_over_time = pytrends.interest_over_time()
        except Exception as e:
            interest_over_time = pd.DataFrame()
        
        # Get interest by region
        try:
            interest_by_region = pytrends.interest_by_region(resolution='STATE', inc_low_vol=True)
        except Exception as e:
            interest_by_region = pd.DataFrame()
        
        return {
            "interest_over_time": serialize_dataframe(interest_over_time),
            "interest_by_region": serialize_dataframe(interest_by_region)
        }
    
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/youtube/top-videos/{keyword}")
async def get_top_videos(keyword: str):
    try:
        # Search for videos
        search_response = youtube.search().list(
            q=f'"{keyword}"',
            part='snippet',
            type='video',
            order='viewCount',
            maxResults=25,
            safeSearch='strict'
        ).execute()

        # Filter for exact phrase match
        filtered_items = []
        for item in search_response['items']:
            title = item['snippet']['title'].lower()
            description = item['snippet'].get('description', '').lower()
            if keyword.lower() in title or keyword.lower() in description:
                filtered_items.append(item)

        # Get video statistics
        video_ids = [item['id']['videoId'] for item in filtered_items]
        if not video_ids:
            return {"videos": []}

        video_response = youtube.videos().list(
            part='snippet,statistics',
            id=','.join(video_ids)
        ).execute()

        # Process and sort videos
        videos = []
        for item in video_response['items']:
            videos.append({
                "title": item['snippet']['title'],
                "views": int(item['statistics'].get('viewCount', 0)),
                "thumbnail": item['snippet']['thumbnails']['default']['url'],
                "channel": item['snippet']['channelTitle'],
                "videoId": item['id']
            })

        # Sort by views and get top 5
        top_videos = sorted(videos, key=lambda x: x['views'], reverse=True)[:5]
        return {"videos": top_videos}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/youtube/sentiment/{keyword}")
async def get_sentiment_analysis(keyword: str):
    try:
        # Fetch videos
        search_response = youtube.search().list(
            q=f'"{keyword}"',
            part='snippet',
            type='video',
            order='date',
            maxResults=50,
            safeSearch='strict'
        ).execute()

        # Process English titles
        titles = []
        for item in search_response['items']:
            title = item['snippet']['title']
            if keyword.lower() in title.lower():
                try:
                    if detect(title) == 'en' and title not in titles:
                        titles.append(title)
                    if len(titles) >= 25:
                        break
                except:
                    continue

        # Analyze sentiment
        sentiment_counts = {"Negative": 0, "Neutral": 0, "Positive": 0}
        for title in titles:
            label, _ = classify_sentiment(title)
            sentiment_counts[label] += 1

        total = sum(sentiment_counts.values())
        sentiment_percentages = {
            k: round((v / total * 100 if total > 0 else 0), 1)
            for k, v in sentiment_counts.items()
        }

        return {
            "sentiment_counts": sentiment_counts,
            "sentiment_percentages": sentiment_percentages,
            "total_analyzed": total
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/youtube/trending-tags/{keyword}")
async def get_trending_tags(keyword: str):
    try:
        # Fetch videos
        search_response = youtube.search().list(
            q=f'"{keyword}"',
            part='snippet',
            type='video',
            maxResults=50,
            safeSearch='strict'
        ).execute()

        # Get video IDs
        video_ids = []
        for item in search_response['items']:
            title = item['snippet']['title']
            try:
                if detect(title) == 'en' and keyword.lower() in title.lower():
                    video_ids.append(item['id']['videoId'])
                if len(video_ids) >= 25:
                    break
            except:
                continue

        if not video_ids:
            return {"tags": []}

        # Fetch video details to get tags
        video_response = youtube.videos().list(
            part='snippet',
            id=','.join(video_ids)
        ).execute()

        # Process tags
        all_tags = []
        for video in video_response['items']:
            tags = video['snippet'].get('tags', [])
            all_tags.extend(tags)

        # Count and filter tags
        tag_counts = {}
        for tag in all_tags:
            if keyword.lower() not in tag.lower() and len(tag) > 2:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1

        # Get top 15 tags
        top_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:15]
        return {
            "tags": [{"tag": tag, "count": count} for tag, count in top_tags]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 