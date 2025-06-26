import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import './App.css';
import YouTubeSection from './components/YouTubeSection';

function App() {
  const [categories, setCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedKeyword, setSelectedKeyword] = useState('');
  const [timeframe, setTimeframe] = useState('today 12-m');
  const [trendsData, setTrendsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSource, setSelectedSource] = useState('google');
  const [shouldFetchYouTube, setShouldFetchYouTube] = useState(false);

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

  const handleKeywordSubmit = async () => {
    if (!selectedKeyword.trim()) return;
    
    setLoading(true);
    setError('');
    setShouldFetchYouTube(selectedSource === 'youtube');
    
    if (selectedSource === 'google') {
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
      }
    }
    setLoading(false);
  };

  // Reset YouTube fetch flag when changing sources
  useEffect(() => {
    setShouldFetchYouTube(false);
  }, [selectedSource]);

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
        config={{
          displayModeBar: true,
          modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
          displaylogo: false,
          responsive: true
        }}
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
          displayModeBar: true,
          modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
          displaylogo: false,
          responsive: true
        }}
      />
    );
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setSelectedKeyword('');
  };

  const handleSubcategoryClick = (subcategory) => {
    setSelectedKeyword(subcategory);
  };

  const handleKeywordChange = (e) => {
    setSelectedKeyword(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-6">
              <img
                src="/FeatureBox_Logo.png"
                alt="FeatureBox AI Logo"
                className="h-12 w-auto"
              />
              <div className="h-8 w-px bg-gray-200"></div>
              <h1 className="text-2xl font-bold text-gray-900">
                FeatureBox AI
              </h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">CPG Trends Dashboard</h1>
            
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 mb-8">
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

              {selectedCategory && categories[selectedCategory]?.subcategories && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Example Keywords
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories[selectedCategory].subcategories.map((subcategory) => (
                      <button
                        key={subcategory}
                        onClick={() => handleSubcategoryClick(subcategory)}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedKeyword === subcategory
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {subcategory}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Keyword
                </label>
                <input
                  type="text"
                  value={selectedKeyword}
                  onChange={handleKeywordChange}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleKeywordSubmit();
                    }
                  }}
                  placeholder="Enter a keyword and press Enter"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Data Source</label>
                <div className="mt-2 flex space-x-4">
                  <button
                    onClick={() => setSelectedSource('google')}
                    className={`px-4 py-2 rounded-md ${
                      selectedSource === 'google'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Google Trends
                  </button>
                  <button
                    onClick={() => setSelectedSource('youtube')}
                    className={`px-4 py-2 rounded-md ${
                      selectedSource === 'youtube'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    YouTube
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Timeframe</label>
                <select
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  value={timeframe}
                  onChange={(e) => {
                    setTimeframe(e.target.value);
                  }}
                >
                  <option value="today 6-m">Past 6 months</option>
                  <option value="today 12-m">Past year</option>
                  <option value="today 3-y">Past 3 years</option>
                  <option value="today 5-y">Past 5 years</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleKeywordSubmit}
                  disabled={!selectedKeyword.trim()}
                  className={`px-4 py-2 rounded-md text-white font-medium ${
                    !selectedKeyword.trim()
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </div>
                  ) : (
                    'Analyze Trends'
                  )}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <>
                {selectedKeyword && (
                  <>
                    {selectedSource === 'google' && trendsData && (
                      <div className="space-y-8">
                        <div className="bg-white rounded-lg shadow">
                          {renderTimeSeriesChart()}
                        </div>
                        <div className="bg-white rounded-lg shadow">
                          {renderRegionalMap()}
                        </div>
                      </div>
                    )}
                    {selectedSource === 'youtube' && (
                      <YouTubeSection 
                        keyword={selectedKeyword} 
                        shouldFetch={shouldFetchYouTube} 
                      />
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
