'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface TrendsData {
  interest_over_time: {
    [key: string]: {
      dates: string[];
      values: number[];
    };
  };
  interest_by_region: {
    [key: string]: {
      [state: string]: number;
    };
  };
}

interface Category {
  id: number;
  subcategories: string[];
}

interface Categories {
  [key: string]: Category;
}

export default function Home() {
  const [categories, setCategories] = useState<Categories>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedKeyword, setSelectedKeyword] = useState<string>('');
  const [timeframe, setTimeframe] = useState<string>('today 12-m');
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showSubcategories, setShowSubcategories] = useState<boolean>(false);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:8000/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        setError('Error fetching categories. Please try again later.');
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const fetchTrendsData = async () => {
    if (!selectedCategory || !selectedKeyword) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await fetch(
        `http://localhost:8000/trends/${encodeURIComponent(selectedCategory)}/${encodeURIComponent(selectedKeyword)}?timeframe=${timeframe}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch trends data');
      }
      
      const data = await response.json();
      setTrendsData(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred while fetching data');
      console.error('Error fetching trends data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTimeSeriesChart = () => {
    if (!trendsData?.interest_over_time || !selectedKeyword) return null;

    const timeData = trendsData.interest_over_time[selectedKeyword];
    if (!timeData || !timeData.dates || !timeData.values) return null;

    return (
      <Plot
        data={[
          {
            x: timeData.dates,
            y: timeData.values,
            type: 'scatter',
            mode: 'lines+markers',
            name: selectedKeyword,
            line: { color: '#4F46E5' }
          }
        ]}
        layout={{
          title: {
            text: `Interest Over Time: ${selectedKeyword}`,
            font: { size: 20 }
          },
          xaxis: { 
            title: { text: 'Date' },
            gridcolor: '#E5E7EB'
          },
          yaxis: { 
            title: { text: 'Interest' },
            gridcolor: '#E5E7EB'
          },
          paper_bgcolor: 'white',
          plot_bgcolor: 'white',
          margin: { t: 50, r: 20, b: 50, l: 50 }
        }}
        style={{ width: '100%', height: '400px' }}
        config={{ responsive: true }}
      />
    );
  };

  const renderRegionalMap = () => {
    if (!trendsData?.interest_by_region || !selectedKeyword) return null;

    const regionData = trendsData.interest_by_region[selectedKeyword];
    if (!regionData || Object.keys(regionData).length === 0) {
      return (
        <div className="text-gray-500 text-center py-8">
          No regional data available for this keyword
        </div>
      );
    }

    // Prepare data for the map
    const locations = Object.keys(regionData);
    const values = Object.values(regionData);
    const maxValue = Math.max(...values);

    return (
      <Plot
        data={[
          {
            type: 'choropleth',
            locationmode: 'USA-states',
            locations: locations,
            z: values,
            text: locations.map(state => `${state}: ${regionData[state]}`),
            colorscale: [
              [0, '#f7fbff'],
              [0.2, '#deebf7'],
              [0.4, '#c6dbef'],
              [0.6, '#9ecae1'],
              [0.8, '#6baed6'],
              [1, '#2171b5']
            ],
            colorbar: { 
              title: { text: 'Interest' },
              thickness: 20,
              len: 0.9,
              tickformat: 'd'
            },
            hoverinfo: 'text',
            showscale: true,
            zmin: 0,
            zmax: maxValue
          }
        ]}
        layout={{
          title: {
            text: `Regional Interest: ${selectedKeyword}`,
            font: { size: 20 }
          },
          geo: {
            scope: 'usa',
            showlakes: true,
            lakecolor: 'rgb(255, 255, 255)',
            showland: true,
            landcolor: 'rgb(250, 250, 250)',
            showframe: false,
            projection: { type: 'albers usa' }
          },
          paper_bgcolor: 'white',
          plot_bgcolor: 'white',
          margin: { t: 50, r: 20, b: 20, l: 20 },
          width: 800,
          height: 500
        }}
        config={{ 
          responsive: true,
          displayModeBar: true,
          modeBarButtonsToRemove: ['lasso2d', 'select2d']
        }}
      />
    );
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCategory(e.target.value);
    setSelectedKeyword('');
    setShowSubcategories(true);
  };

  const handleSubcategoryClick = (subcategory: string) => {
    setSelectedKeyword(subcategory);
    setShowSubcategories(false);
  };

  const renderCategorySelect = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700">Category</label>
      <select
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        value={selectedCategory}
        onChange={handleCategoryChange}
      >
        <option value="">Select a category</option>
        {Object.keys(categories).map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  );

  const renderSubcategorySuggestions = () => {
    if (!selectedCategory || !showSubcategories) return null;

    const subcategories = categories[selectedCategory]?.subcategories || [];
    if (subcategories.length === 0) return null;

    return (
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Suggested Keywords
        </label>
        <div className="flex flex-wrap gap-2">
          {subcategories.map((subcategory) => (
            <button
              key={subcategory}
              onClick={() => handleSubcategoryClick(subcategory)}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {subcategory}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderKeywordInput = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700">Keyword</label>
      <div className="mt-1 relative rounded-md shadow-sm">
        <input
          type="text"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          value={selectedKeyword}
          onChange={(e) => setSelectedKeyword(e.target.value)}
          placeholder={selectedCategory ? `Enter a ${selectedCategory.toLowerCase()} keyword` : 'Select a category first'}
          disabled={!selectedCategory}
        />
        {selectedKeyword && (
          <button
            onClick={() => setSelectedKeyword('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">CPG Trends Dashboard</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
            {renderCategorySelect()}
            {renderSubcategorySuggestions()}
            {renderKeywordInput()}

            <div>
              <label className="block text-sm font-medium text-gray-700">Time Range</label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <option value="today 6-m">Last 6 months</option>
                <option value="today 12-m">Last 12 months</option>
                <option value="today 3-y">Last 3 years</option>
                <option value="today 5-y">Last 5 years</option>
              </select>
            </div>

            <button
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              onClick={fetchTrendsData}
              disabled={!selectedCategory || !selectedKeyword || loading}
            >
              {loading ? 'Loading...' : 'Fetch Trends'}
            </button>
          </div>

          {trendsData && (
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Interest Over Time</h2>
                {renderTimeSeriesChart()}
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Regional Interest</h2>
                {renderRegionalMap()}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}