import React, { useState } from 'react';
import { Play, TrendingUp, BarChart2 } from 'lucide-react';
import config from '../config';

const YouTubeSection = ({ keyword, shouldFetch }) => {
  const [topVideos, setTopVideos] = useState([]);
  const [sentimentData, setSentimentData] = useState(null);
  const [trendingTags, setTrendingTags] = useState([]);
  const [loading, setLoading] = useState({
    videos: false,
    sentiment: false,
    tags: false
  });
  const [error, setError] = useState({
    videos: null,
    sentiment: null,
    tags: null
  });
  const [lastFetchedKeyword, setLastFetchedKeyword] = useState('');

  React.useEffect(() => {
    if (!keyword || !shouldFetch || keyword === lastFetchedKeyword) return;

    const fetchYouTubeData = async () => {
      // Reset errors
      setError({
        videos: null,
        sentiment: null,
        tags: null
      });

      // Get authentication headers
      const headers = await config.getHeaders();

      // Fetch top videos
      setLoading(prev => ({ ...prev, videos: true }));
      try {
        const response = await fetch(
          `${config.apiBaseUrl}/youtube/top-videos/${encodeURIComponent(keyword)}`,
          { headers }
        );
        if (!response.ok) throw new Error('Failed to fetch top videos');
        const data = await response.json();
        setTopVideos(data.videos);
      } catch (err) {
        setError(prev => ({ ...prev, videos: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, videos: false }));
      }

      // Fetch sentiment analysis
      setLoading(prev => ({ ...prev, sentiment: true }));
      try {
        const response = await fetch(
          `${config.apiBaseUrl}/youtube/sentiment/${encodeURIComponent(keyword)}`,
          { headers }
        );
        if (!response.ok) throw new Error('Failed to fetch sentiment data');
        const data = await response.json();
        setSentimentData(data);
      } catch (err) {
        setError(prev => ({ ...prev, sentiment: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, sentiment: false }));
      }

      // Fetch trending tags
      setLoading(prev => ({ ...prev, tags: true }));
      try {
        const response = await fetch(`${config.apiBaseUrl}/youtube/trending-tags/${encodeURIComponent(keyword)}`);
        if (!response.ok) throw new Error('Failed to fetch trending tags');
        const data = await response.json();
        setTrendingTags(data.tags);
      } catch (err) {
        setError(prev => ({ ...prev, tags: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, tags: false }));
      }

      setLastFetchedKeyword(keyword);
    };

    fetchYouTubeData();
  }, [shouldFetch, keyword, lastFetchedKeyword]);

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Videos Widget */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Play className="w-5 h-5 mr-2" />
          Top 5 Videos
        </h2>
        {loading.videos ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error.videos ? (
          <div className="text-red-500 text-center py-4">{error.videos}</div>
        ) : (
          <div className="space-y-4">
            {topVideos.map((video, index) => (
              <div key={video.videoId} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-shrink-0">
                  <img src={video.thumbnail} alt={video.title} className="w-24 h-18 object-cover rounded" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{video.title}</p>
                  <p className="text-sm text-gray-500">{video.channel}</p>
                  <p className="text-sm text-gray-500">{formatNumber(video.views)} views</p>
                </div>
              </div>
            ))}
            {topVideos.length === 0 && !error.videos && (
              <div className="text-gray-500 text-center py-4">No videos found</div>
            )}
          </div>
        )}
      </div>

      {/* Sentiment Analysis Widget */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Sentiment Analysis
        </h2>
        {loading.sentiment ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error.sentiment ? (
          <div className="text-red-500 text-center py-4">{error.sentiment}</div>
        ) : sentimentData ? (
          <div>
            <div className="mb-4 text-sm text-gray-600">
              Based on {sentimentData.total_analyzed} recent video titles
            </div>
            <div className="space-y-4">
              {Object.entries(sentimentData.sentiment_percentages).map(([sentiment, percentage]) => (
                <div key={sentiment} className="relative">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{sentiment}</span>
                    <span className="text-sm font-medium text-gray-700">{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        sentiment === 'Positive' ? 'bg-green-500' :
                        sentiment === 'Negative' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-center py-4">No sentiment data available</div>
        )}
      </div>

      {/* Trending Tags Widget */}
      <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <BarChart2 className="w-5 h-5 mr-2" />
          Trending Tags
        </h2>
        {loading.tags ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error.tags ? (
          <div className="text-red-500 text-center py-4">{error.tags}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {trendingTags.map(({ tag, count }) => (
              <div
                key={tag}
                className="bg-gray-50 rounded-lg p-3 text-center"
              >
                <div className="font-medium text-gray-900 truncate">{tag}</div>
                <div className="text-sm text-gray-500">{count} videos</div>
              </div>
            ))}
            {trendingTags.length === 0 && (
              <div className="text-gray-500 text-center py-4 col-span-full">No trending tags found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubeSection; 