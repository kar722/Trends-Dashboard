from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pytrends.request import TrendReq
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import pandas as pd
import json

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