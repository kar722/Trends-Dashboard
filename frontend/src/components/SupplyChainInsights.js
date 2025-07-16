import React, { useState } from 'react';
import { CloudArrowUpIcon, DocumentTextIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const SupplyChainInsights = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [csvContent, setCsvContent] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setError('');
      
      // Read and store CSV content
      const reader = new FileReader();
      reader.onload = (e) => {
        setCsvContent(e.target.result);
      };
      reader.readAsText(file);
    } else {
      setError('Please select a valid CSV file.');
      setSelectedFile(null);
      setCsvContent('');
    }
  };

  const generateInsights = async () => {
    if (!selectedFile || !csvContent) {
      setError('Please select a CSV file first.');
      return;
    }

    // Check for API key
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (!apiKey) {
      setError('Gemini API key not found. Please check your environment configuration.');
      return;
    }

    setLoading(true);
    setError('');
    setInsights(null);

    try {
      const prompt = `Analyze the following supply chain forecast CSV data and provide insights:

CSV Data:
${csvContent}

Please analyze this data and return:
1. Top trends/insights from the forecast data
2. Cluster similar SKUs together
3. For each insight, include short "because" notes explaining the reason for the trend

Focus on:
- Demand patterns and trends
- SKU performance comparisons
- Forecasting model accuracy indicators
- Supply chain optimization opportunities

Return the analysis as a structured JSON response.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  skuGroup: {
                    type: "string",
                    description: "A clustered group name for similar SKUs"
                  },
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        trend: {
                          type: "string",
                          description: "A concise description of the trend"
                        },
                        explanation: {
                          type: "string",
                          description: "A short 'because' note explaining the trend"
                        }
                      },
                      required: ["trend", "explanation"]
                    }
                  }
                },
                required: ["skuGroup", "insights"]
              }
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const content = data.candidates[0].content.parts[0].text;
        
        // Try to parse the JSON response
        try {
          const parsedInsights = JSON.parse(content);
          setInsights(parsedInsights);
        } catch (parseError) {
          console.error('Failed to parse JSON response:', parseError);
          setError('Received invalid response format from AI service.');
        }
      } else {
        setError('No valid response received from AI service.');
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      setError('Failed to generate insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setCsvContent('');
    setInsights(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Supply Chain Insights
          </h1>
          <p className="text-gray-600">
            Upload your supply chain forecast data and get AI-powered insights
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          {/* File Upload Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV Forecast File:
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {selectedFile && (
                <div className="flex items-center text-sm text-gray-600">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                  {selectedFile.name}
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={generateInsights}
            disabled={!selectedFile || loading}
            className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
              !selectedFile || loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Generating AI Insights...
              </div>
            ) : (
              'Generate AI Insights'
            )}
          </button>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Reset Button */}
          {selectedFile && (
            <button
              onClick={resetForm}
              className="mt-4 w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Reset Form
            </button>
          )}
        </div>

        {/* Insights Display */}
        {insights && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">AI-Generated Insights</h2>
            
            <div className="space-y-6">
              {insights.map((group, groupIndex) => (
                <div key={groupIndex} className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-2" />
                    {group.skuGroup}
                  </h3>
                  
                  <div className="space-y-4">
                    {group.insights.map((insight, insightIndex) => (
                      <div key={insightIndex} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              {insight.trend}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Because:</span> {insight.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
                <p className="text-sm text-yellow-700">
                  <strong>Disclaimer:</strong> This text is AI-generated. Analysts should verify the information before acting upon it.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplyChainInsights; 