import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Play, MapPin, Search, Plus, Minus, Settings, Download } from 'lucide-react';
import USHeatmap from './components/USHeatmap';

// --- NEW INTERFACES FOR MOCK DATA ---
interface TrendDataItem {
  date: string;
  // This index signature allows accessing properties like obj['keyword']
  [key: string]: number | string;
}

interface InterestByKeyword {
  // This index signature allows accessing properties like obj['almond milk']
  [key: string]: number;
}

interface GeoDataItem {
  state: string;
  state_code: string;
  interestByKeyword: InterestByKeyword;
}
// --- END NEW INTERFACES ---


// Mock data for demonstration
const mockTrendData: TrendDataItem[] = [ // Apply the new type here
  { date: '2024-01-01', 'almond milk': 65, 'oat milk': 78, 'soy milk': 45 },
  { date: '2024-01-08', 'almond milk': 70, 'oat milk': 82, 'soy milk': 48 },
  { date: '2024-01-15', 'almond milk': 68, 'oat milk': 85, 'soy milk': 46 },
  { date: '2024-01-22', 'almond milk': 72, 'oat milk': 88, 'soy milk': 50 },
  { date: '2024-01-29', 'almond milk': 75, 'oat milk': 90, 'soy milk': 52 },
  { date: '2024-02-05', 'almond milk': 78, 'oat milk': 92, 'soy milk': 55 },
];

const mockGeoData: GeoDataItem[] = [ // Apply the new type here
  { state: 'California', state_code: 'CA', interestByKeyword: { 'almond milk': 100, 'oat milk': 80, 'soy milk': 60 } },
  { state: 'Washington', state_code: 'WA', interestByKeyword: { 'almond milk': 85, 'oat milk': 95, 'soy milk': 50 } },
  { state: 'Oregon', state_code: 'OR', interestByKeyword: { 'almond milk': 82, 'oat milk': 90, 'soy milk': 45 } },
  { state: 'New York', state_code: 'NY', interestByKeyword: { 'almond milk': 78, 'oat milk': 70, 'soy milk': 85 } },
  { state: 'Massachusetts', state_code: 'MA', interestByKeyword: { 'almond milk': 75, 'oat milk': 65, 'soy milk': 70 } },
  { state: 'Colorado', state_code: 'CO', interestByKeyword: { 'almond milk': 72, 'oat milk': 88, 'soy milk': 55 } },
  { state: 'Vermont', state_code: 'VT', interestByKeyword: { 'almond milk': 70, 'oat milk': 60, 'soy milk': 75 } },
  { state: 'Connecticut', state_code: 'CT', interestByKeyword: { 'almond milk': 68, 'oat milk': 55, 'soy milk': 68 } },
  { state: 'Hawaii', state_code: 'HI', interestByKeyword: { 'almond milk': 65, 'oat milk': 72, 'soy milk': 40 } },
  { state: 'Florida', state_code: 'FL', interestByKeyword: { 'almond milk': 62, 'oat milk': 50, 'soy milk': 62 } },
  { state: 'Illinois', state_code: 'IL', interestByKeyword: { 'almond milk': 60, 'oat milk': 80, 'soy milk': 58 } },
  { state: 'Minnesota', state_code: 'MN', interestByKeyword: { 'almond milk': 58, 'oat milk': 85, 'soy milk': 48 } },
  { state: 'Georgia', state_code: 'GA', interestByKeyword: { 'almond milk': 55, 'oat milk': 70, 'soy milk': 65 } },
  { state: 'Texas', state_code: 'TX', interestByKeyword: { 'almond milk': 52, 'oat milk': 75, 'soy milk': 52 } },
  { state: 'North Carolina', state_code: 'NC', interestByKeyword: { 'almond milk': 50, 'oat milk': 60, 'soy milk': 50 } },
  { state: 'Virginia', state_code: 'VA', interestByKeyword: { 'almond milk': 48, 'oat milk': 55, 'soy milk': 48 } },
  { state: 'Pennsylvania', state_code: 'PA', interestByKeyword: { 'almond milk': 45, 'oat milk': 50, 'soy milk': 45 } },
  { state: 'Ohio', state_code: 'OH', interestByKeyword: { 'almond milk': 42, 'oat milk': 48, 'soy milk': 42 } },
  { state: 'Michigan', state_code: 'MI', interestByKeyword: { 'almond milk': 40, 'oat milk': 45, 'soy milk': 40 } },
  { state: 'Arizona', state_code: 'AZ', interestByKeyword: { 'almond milk': 38, 'oat milk': 40, 'soy milk': 38 } },
  { state: 'Alabama', state_code: 'AL', interestByKeyword: { 'almond milk': 30, 'oat milk': 35, 'soy milk': 30 } },
  { state: 'Arkansas', state_code: 'AR', interestByKeyword: { 'almond milk': 32, 'oat milk': 38, 'soy milk': 32 } },
  { state: 'Delaware', state_code: 'DE', interestByKeyword: { 'almond milk': 65, 'oat milk': 70, 'soy milk': 60 } },
  { state: 'Idaho', state_code: 'ID', interestByKeyword: { 'almond milk': 50, 'oat milk': 55, 'soy milk': 45 } },
  { state: 'Indiana', state_code: 'IN', interestByKeyword: { 'almond milk': 48, 'oat milk': 52, 'soy milk': 40 } },
  { state: 'Kansas', state_code: 'KS', interestByKeyword: { 'almond milk': 35, 'oat milk': 40, 'soy milk': 30 } },
  { state: 'Kentucky', state_code: 'KY', interestByKeyword: { 'almond milk': 40, 'oat milk': 45, 'soy milk': 35 } },
  { state: 'Louisiana', state_code: 'LA', interestByKeyword: { 'almond milk': 42, 'oat milk': 48, 'soy milk': 38 } },
  { state: 'Maine', state_code: 'ME', interestByKeyword: { 'almond milk': 70, 'oat milk': 75, 'soy milk': 65 } },
  { state: 'Maryland', state_code: 'MD', interestByKeyword: { 'almond milk': 72, 'oat milk': 78, 'soy milk': 68 } },
  { state: 'Mississippi', state_code: 'MS', interestByKeyword: { 'almond milk': 30, 'oat milk': 35, 'soy milk': 28 } },
  { state: 'Missouri', state_code: 'MO', interestByKeyword: { 'almond milk': 45, 'oat milk': 50, 'soy milk': 40 } },
  { state: 'Montana', state_code: 'MT', interestByKeyword: { 'almond milk': 55, 'oat milk': 60, 'soy milk': 50 } },
  { state: 'Nebraska', state_code: 'NE', interestByKeyword: { 'almond milk': 38, 'oat milk': 42, 'soy milk': 32 } },
  { state: 'Nevada', state_code: 'NV', interestByKeyword: { 'almond milk': 60, 'oat milk': 65, 'soy milk': 55 } },
  { state: 'New Hampshire', state_code: 'NH', interestByKeyword: { 'almond milk': 75, 'oat milk': 80, 'soy milk': 70 } },
  { state: 'New Jersey', state_code: 'NJ', interestByKeyword: { 'almond milk': 80, 'oat milk': 85, 'soy milk': 75 } },
  { state: 'New Mexico', state_code: 'NM', interestByKeyword: { 'almond milk': 40, 'oat milk': 45, 'soy milk': 35 } },
  { state: 'North Dakota', state_code: 'ND', interestByKeyword: { 'almond milk': 30, 'oat milk': 35, 'soy milk': 25 } },
  { state: 'Oklahoma', state_code: 'OK', interestByKeyword: { 'almond milk': 40, 'oat milk': 45, 'soy milk': 35 } },
  { state: 'Rhode Island', state_code: 'RI', interestByKeyword: { 'almond milk': 70, 'oat milk': 75, 'soy milk': 68 } },
  { state: 'South Carolina', state_code: 'SC', interestByKeyword: { 'almond milk': 50, 'oat milk': 55, 'soy milk': 45 } },
  { state: 'South Dakota', state_code: 'SD', interestByKeyword: { 'almond milk': 32, 'oat milk': 38, 'soy milk': 28 } },
  { state: 'Tennessee', state_code: 'TN', interestByKeyword: { 'almond milk': 45, 'oat milk': 50, 'soy milk': 40 } },
  { state: 'Utah', state_code: 'UT', interestByKeyword: { 'almond milk': 60, 'oat milk': 65, 'soy milk': 55 } },
  { state: 'West Virginia', state_code: 'WV', interestByKeyword: { 'almond milk': 35, 'oat milk': 40, 'soy milk': 30 } },
  { state: 'Wisconsin', state_code: 'WI', interestByKeyword: { 'almond milk': 50, 'oat milk': 55, 'soy milk': 45 } },
  { state: 'Wyoming', state_code: 'WY', interestByKeyword: { 'almond milk': 30, 'oat milk': 35, 'soy milk': 25 } }
];

const mockRelatedQueries = {
  top: ['almond milk brands', 'best almond milk', 'unsweetened almond milk', 'organic almond milk'],
  rising: ['oat milk vs almond milk', 'homemade almond milk', 'almond milk nutrition', 'vanilla almond milk']
};

const mockYouTubeVideos = [
  { title: 'How to Make Almond Milk at Home', views: '2.3M', channel: 'Healthy Living', duration: '5:23' },
  { title: 'Oat Milk vs Almond Milk: Which is Better?', views: '1.8M', channel: 'Nutrition Facts', duration: '8:15' },
  { title: 'Best Plant-Based Milk Taste Test', views: '950K', channel: 'Food Review', duration: '12:30' },
  { title: 'The Rise of Alternative Milk Products', views: '720K', channel: 'Market Trends', duration: '6:45' },
  { title: 'Almond Milk Recipe - Creamy & Delicious', views: '680K', channel: 'Vegan Kitchen', duration: '4:20' },
];

const Dashboard = () => {
  const [keywordGroups, setKeywordGroups] = useState([
    {
      id: 1,
      name: 'My Brands',
      keywords: ['almond milk', 'oat milk'],
      sources: ['google', 'youtube']
    },
    {
      id: 2,
      name: 'Competitors',
      keywords: ['soy milk'],
      sources: ['google', 'youtube']
    }
  ]);

  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [selectedSource, setSelectedSource] = useState('google');
  const [newKeyword, setNewKeyword] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(1);

  // Get all unique keywords from all groups
  const getAllKeywords = () => {
    const all = keywordGroups.flatMap(group => group.keywords);
    return Array.from(new Set(all)); // Ensure unique keywords
  };

  const allKeywords = getAllKeywords(); // Call it once and store

  // State for the selected keyword for the heatmap
  const [selectedHeatmapKeyword, setSelectedHeatmapKeyword] = useState<string>(allKeywords[0] || '');

  // Effect to update selectedHeatmapKeyword if keywords change or initial load
  useEffect(() => {
    if (allKeywords.length > 0 && !allKeywords.includes(selectedHeatmapKeyword)) {
      setSelectedHeatmapKeyword(allKeywords[0]);
    } else if (allKeywords.length === 0) {
      setSelectedHeatmapKeyword('');
    }
  }, [allKeywords, selectedHeatmapKeyword]);


  const addKeyword = () => {
    if (newKeyword.trim()) {
      setKeywordGroups(prev => prev.map(group => 
        group.id === selectedGroup 
          ? { ...group, keywords: [...group.keywords, newKeyword.trim()] }
          : group
      ));
      setNewKeyword('');
    }
  };

  const removeKeyword = (groupId: number, keyword: string) => {
    setKeywordGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, keywords: group.keywords.filter(k => k !== keyword) }
        : group
    ));
  };


  const getChangePercentage = (keyword: string) => {
    // Check if we have enough data points
    if (mockTrendData.length < 2) return '0';
    
    // Now TypeScript knows 'currentData' is TrendDataItem and can be indexed by 'keyword'
    const currentData = mockTrendData[mockTrendData.length - 1]; 
    const previousData = mockTrendData[mockTrendData.length - 2];
    
    // Type assertion or check might still be needed if you want to be super strict,
    // but the index signature handles the implicit 'any' error.
    // We are sure `currentData[keyword]` and `previousData[keyword]` will be numbers
    // because `mockTrendData` has number values for its string keys.
    const current = currentData[keyword] as number; 
    const previous = previousData[keyword] as number;
    
    // Check if both values exist and are numbers
    if (current === undefined || previous === undefined || previous === 0) {
      return '0';
    }
    
    return ((current - previous) / previous * 100).toFixed(1);
  };

  // Function to filter geo data based on selected keyword
  const getFilteredGeoData = () => {
    if (!selectedHeatmapKeyword) {
      return []; // Return empty if no keyword is selected
    }
    return mockGeoData.map(stateData => ({
      state_code: stateData.state_code,
      interest: stateData.interestByKeyword[selectedHeatmapKeyword] ?? 0 // Changed from 40 to 0
    })).filter(item => item.interest > 0); // Only include states with actual data
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">FeatureBox AI</h1>
              <p className="text-sm text-gray-600">CPG Trend Intelligence Dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <select 
                value={selectedTimeframe} 
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="12m">Last 12 months</option>
              </select>
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Keyword Management */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Keyword Groups</h2>
          <div className="flex flex-wrap gap-4 mb-4">
            {keywordGroups.map(group => (
              <div key={group.id} className="border rounded-lg p-4 min-w-64">
                <h3 className="font-medium mb-2">{group.name}</h3>
                <div className="space-y-2">
                  {group.keywords.map(keyword => (
                    <div key={keyword} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                      <span className="text-sm">{keyword}</span>
                      <button 
                        onClick={() => removeKeyword(group.id, keyword)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex items-center space-x-2">
            <select 
              value={selectedGroup} 
              onChange={(e) => setSelectedGroup(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              {keywordGroups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Add new keyword..."
              className="px-3 py-2 border border-gray-300 rounded-md flex-1"
              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
            />
            <button 
              onClick={addKeyword}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Data Source Toggle */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-4">
            <span className="font-medium">Data Source:</span>
            <button
              onClick={() => setSelectedSource('google')}
              className={`px-4 py-2 rounded-md ${selectedSource === 'google' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Google Trends
            </button>
            <button
              onClick={() => setSelectedSource('youtube')}
              className={`px-4 py-2 rounded-md ${selectedSource === 'youtube' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              YouTube
            </button>
          </div>
        </div>

        {/* Scorecard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {allKeywords.map(keyword => { // Use allKeywords here
            const change = parseFloat(getChangePercentage(keyword));
            const isPositive = change > 0;
            // Now TypeScript correctly understands that 'keyword' can be used as an index
            const currentValue = (mockTrendData[mockTrendData.length - 1][keyword] || 0) as number;
            
            return (
              <div key={keyword} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 capitalize">{keyword}</h3>
                  <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span className="ml-1 text-sm font-medium">{Math.abs(change)}%</span>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold text-gray-900">
                    {currentValue}
                  </div>
                  <p className="text-xs text-gray-500">Interest Score</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Trend Comparison</h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={mockTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {allKeywords.map((keyword, index) => ( // Use allKeywords here
                <Line 
                  key={keyword}
                  type="monotone" 
                  dataKey={keyword} 
                  stroke={['#3B82F6', '#EF4444', '#10B981', '#F59E0B'][index % 4]}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Conditional Widgets based on Source */}
        {selectedSource === 'google' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Geographic Heat Map */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Geographic Interest - US States
              </h2>

              {/* Keyword Selection Bar for Heatmap */}
              <div className="mb-4">
                <label htmlFor="heatmap-keyword-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Keyword:
                </label>
                <select
                  id="heatmap-keyword-select"
                  value={selectedHeatmapKeyword}
                  onChange={(e) => setSelectedHeatmapKeyword(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  {allKeywords.length > 0 ? ( // Only render options if keywords exist
                    allKeywords.map(keyword => (
                      <option key={keyword} value={keyword}>{keyword}</option>
                    ))
                  ) : (
                    <option value="">No keywords available</option> // Fallback if no keywords
                  )}
                </select>
              </div>

              {/* Display current range for selected keyword */}
              {selectedHeatmapKeyword && getFilteredGeoData().length > 0 && (
                <div className="mb-4 text-sm text-gray-600">
                  Interest range for "{selectedHeatmapKeyword}": {Math.min(...getFilteredGeoData().map(d => d.interest))} - {Math.max(...getFilteredGeoData().map(d => d.interest))}
                </div>
              )}

              <USHeatmap data={getFilteredGeoData()} />

              {/* Legend - Updated for continuous gradient */}
              <div className="mt-4 flex flex-col items-center justify-center">
                <span className="text-sm text-gray-600 mb-2">Interest Level:</span>
                <div className="w-full max-w-xs h-6 rounded-md"
                    style={{ background: 'linear-gradient(to right, #cfe3f3, #08306b)' }}>
                </div>
                <div className="flex justify-between w-full max-w-xs mt-1">
                  <span className="text-xs text-gray-500">Low</span>
                  <span className="text-xs text-gray-500">High</span>
                </div>
              </div>

              {/* Top States List - UPDATED */}
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Top 5 States for "{selectedHeatmapKeyword}"</h3>
                <div className="space-y-1">
                  {getFilteredGeoData()
                    .sort((a, b) => b.interest - a.interest) // Sort by interest descending
                    .slice(0, 5) // Take top 5
                    .map((item, index) => (
                      <div key={item.state_code} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">
                          {index + 1}. {mockGeoData.find(d => d.state_code === item.state_code)?.state || item.state_code}
                        </span>
                        <span className="font-medium text-blue-600">{item.interest}</span>
                      </div>
                    ))
                  }
                  {getFilteredGeoData().length === 0 && (
                    <div className="text-sm text-gray-500 italic">No data available for selected keyword</div>
                  )}
                </div>
              </div>
            </div>

            {/* Related Queries */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Related Queries
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm text-gray-700 mb-2">Top Queries</h3>
                  <div className="space-y-1">
                    {mockRelatedQueries.top.map((query, index) => (
                      <div key={index} className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                        {query}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-gray-700 mb-2">Rising Queries</h3>
                  <div className="space-y-1">
                    {mockRelatedQueries.rising.map((query, index) => (
                      <div key={index} className="text-sm text-gray-600 bg-green-50 px-3 py-2 rounded">
                        {query}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedSource === 'youtube' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Play className="w-5 h-5 mr-2" />
              Top YouTube Videos
            </h2>
            <div className="space-y-4">
              {mockYouTubeVideos.map((video, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <Play className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{video.title}</h3>
                      <p className="text-sm text-gray-600">{video.channel}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{video.views} views</div>
                    <div className="text-sm text-gray-600">{video.duration}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
