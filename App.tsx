import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Play, MapPin, Search, Plus, Minus, Settings, Download } from 'lucide-react';

// Mock data for demonstration
const mockTrendData = [
  { date: '2024-01-01', 'almond milk': 65, 'oat milk': 78, 'soy milk': 45 },
  { date: '2024-01-08', 'almond milk': 70, 'oat milk': 82, 'soy milk': 48 },
  { date: '2024-01-15', 'almond milk': 68, 'oat milk': 85, 'soy milk': 46 },
  { date: '2024-01-22', 'almond milk': 72, 'oat milk': 88, 'soy milk': 50 },
  { date: '2024-01-29', 'almond milk': 75, 'oat milk': 90, 'soy milk': 52 },
  { date: '2024-02-05', 'almond milk': 78, 'oat milk': 92, 'soy milk': 55 },
];

const mockGeoData = [
  { state: 'California', state_code: 'CA', interest: 100 },
  { state: 'Washington', state_code: 'WA', interest: 85 },
  { state: 'Oregon', state_code: 'OR', interest: 82 },
  { state: 'New York', state_code: 'NY', interest: 78 },
  { state: 'Massachusetts', state_code: 'MA', interest: 75 },
  { state: 'Colorado', state_code: 'CO', interest: 72 },
  { state: 'Vermont', state_code: 'VT', interest: 70 },
  { state: 'Connecticut', state_code: 'CT', interest: 68 },
  { state: 'Hawaii', state_code: 'HI', interest: 65 },
  { state: 'Florida', state_code: 'FL', interest: 62 },
  { state: 'Illinois', state_code: 'IL', interest: 60 },
  { state: 'Minnesota', state_code: 'MN', interest: 58 },
  { state: 'Georgia', state_code: 'GA', interest: 55 },
  { state: 'Texas', state_code: 'TX', interest: 52 },
  { state: 'North Carolina', state_code: 'NC', interest: 50 },
  { state: 'Virginia', state_code: 'VA', interest: 48 },
  { state: 'Pennsylvania', state_code: 'PA', interest: 45 },
  { state: 'Ohio', state_code: 'OH', interest: 42 },
  { state: 'Michigan', state_code: 'MI', interest: 40 },
  { state: 'Arizona', state_code: 'AZ', interest: 38 },
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

  const getAllKeywords = () => {
    return keywordGroups.flatMap(group => group.keywords);
  };

  const getChangePercentage = (keyword: string) => {
    // Check if we have enough data points
    if (mockTrendData.length < 2) return '0';
    
    const currentData = mockTrendData[mockTrendData.length - 1] as any;
    const previousData = mockTrendData[mockTrendData.length - 2] as any;
    
    const current = currentData[keyword];
    const previous = previousData[keyword];
    
    // Check if both values exist and are numbers
    if (current === undefined || previous === undefined || previous === 0) {
      return '0';
    }
    
    return ((current - previous) / previous * 100).toFixed(1);
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
          {getAllKeywords().map(keyword => {
            const change = parseFloat(getChangePercentage(keyword));
            const isPositive = change > 0;
            const currentValue = (mockTrendData[mockTrendData.length - 1] as any)[keyword] || 0;
            
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
              {getAllKeywords().map((keyword, index) => (
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
              <div className="relative">
                {/* Heatmap Grid representing US states */}
                <div className="grid grid-cols-10 gap-1 max-w-md mx-auto">
                  {mockGeoData.map((item) => {
                    const intensity = item.interest / 100;
                    const backgroundColor = `rgba(59, 130, 246, ${intensity})`;
                    return (
                      <div
                        key={item.state_code}
                        className="relative group cursor-pointer"
                        style={{
                          backgroundColor,
                          border: '1px solid #e5e7eb',
                          minHeight: '20px',
                          borderRadius: '2px'
                        }}
                        title={`${item.state}: ${item.interest}%`}
                      >
                        <span className="text-xs font-medium text-center block py-1 text-white mix-blend-difference">
                          {item.state_code}
                        </span>
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                          {item.state}: {item.interest}%
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Legend */}
                <div className="mt-4 flex items-center justify-center space-x-4">
                  <span className="text-sm text-gray-600">Interest Level:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-100 border border-gray-300"></div>
                    <span className="text-xs text-gray-500">Low</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-300 border border-gray-300"></div>
                    <span className="text-xs text-gray-500">Medium</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-600 border border-gray-300"></div>
                    <span className="text-xs text-gray-500">High</span>
                  </div>
                </div>

                {/* Top States List */}
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Top 5 States</h3>
                  <div className="space-y-1">
                    {mockGeoData.slice(0, 5).map((item, index) => (
                      <div key={item.state_code} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">{index + 1}. {item.state}</span>
                        <span className="font-medium text-blue-600">{item.interest}%</span>
                      </div>
                    ))}
                  </div>
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
