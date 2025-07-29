// SupplyChainInsights.js
import React, { useState } from 'react';
import Papa from 'papaparse';
import { DocumentTextIcon, ExclamationTriangleIcon, CheckCircleIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, EyeIcon } from '@heroicons/react/24/outline';

const TOKENS_PER_ROW = 55;
const MAX_TOKENS = 800000;
const CHUNK_SIZE = Math.floor(MAX_TOKENS / TOKENS_PER_ROW);
const OVERLAP_ROWS = Math.floor(CHUNK_SIZE * 0.1);

const SupplyChainInsights = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [csvContent, setCsvContent] = useState('');
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setError('');
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

  // Helper: Estimate token count for prompt (for debugging)
  const countTokensForPrompt = async (prompt) => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (!apiKey) return;
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:countTokens?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );
      if (!response.ok) return;
      const data = await response.json();
      if (data.totalTokens !== undefined) {
        console.log(`Token count for current prompt: ${data.totalTokens}`);
      }
    } catch (error) {
      // Silent fail
    }
  };

  // Optimized chunking: split rows into as few chunks as possible, with 10% overlap
  const chunkRowsByFixedSize = (rows) => {
    const chunks = [];
    let start = 0;
    while (start < rows.length) {
      let end = start + CHUNK_SIZE;
      if (end > rows.length) end = rows.length;
      const chunk = rows.slice(start, end);
      chunks.push(chunk);
      if (end === rows.length) break;
      // Overlap: next chunk starts 10% before end
      start = end - OVERLAP_ROWS;
      if (start < 0) start = 0;
    }
    return chunks;
  };

  const processAndChunkCSV = async (csvText) => {
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (!results.data || !results.data.length) {
            reject('CSV parsing failed or file is empty.');
            return;
          }
          const rows = results.data;
          const chunks = chunkRowsByFixedSize(rows);
          resolve(chunks);
        },
        error: (err) => reject(err.message)
      });
    });
  };

  const generateInsights = async () => {
    if (!selectedFile || !csvContent) {
      setError('Please select a CSV file first.');
      return;
    }
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (!apiKey) {
      setError('Gemini API key not found. Please check your environment configuration.');
      return;
    }
    setLoading(true);
    setError('');
    setInsights(null);
    setProgress(0);
    setProgressText('Parsing and chunking CSV...');
    
    try {
      const allChunks = await processAndChunkCSV(csvContent);
      const totalChunks = allChunks.length;
      const allChunkReports = [];
      
      // Process each chunk with chunk_prompt
      for (let i = 0; i < totalChunks; i++) {
        const chunk = allChunks[i];
        setProgress(Math.round(((i + 1) / (totalChunks + 1)) * 100));
        setProgressText(`Processing chunk ${i + 1} of ${totalChunks}...`);
        
        const chunkCsv = Papa.unparse(chunk);
        const chunk_prompt = `### ROLE You are a meticulous **Supply‑Chain Data Analyst** embedded in our forecasting platform. You have full command of descriptive statistics, time‑series diagnostics, and business‑oriented storytelling. Write for demand planners and business managers who want quick, actionable takeaways.

### GOAL From the **new forecast data** you (the model) just received—*note: this is a **chunked portion** of the full dataset*—surface the **top insights** that help users:
1. Understand material demand swings (biggest MoM jumps & drops) and their likely drivers.
2. Spot SKU × Channel combinations with consistent growth or decline trends.
3. Detect unusual patterns in history (e.g., long zero-demand periods followed by spikes).
4. Explain **why** these trends or patterns likely happened, using statistical or business evidence (e.g., promo_flag, seasonality, historical context).
5. Decide what to act on now (e.g., "stock up", "watch inventory", "investigate promo impact") without forcing them to debug the model.

### INFORMATION ACCESS You are provided with a **chunked slice** of the overall dataset:
${chunkCsv}

Here is a breakdown of each column in the dataset:
- sheet: The company that sells the product.
- item: A unique identifier for the product.
- model: The model used to generate the forecast values.
- ds: The date associated with the forecast.
- forecast: The predicted number of sales for the product on the given date.
- Columns starting with "hist_": These represent the actual number of sales for the product in previous months. For example, "hist_june_2025" contains the actual sales for June 2025.

Use the "hist_" columns as a general historical baseline for your insights.
To calculate percent_change_mom, compare the forecast to the most recent "hist_" column.

*You will see other chunks separately. Treat your response as self-contained, but precise and consistent in format with earlier chunks so we can later combine them.*

### INSTRUCTIONS
* Work at **SKU–Channel granularity** (e.g., "SKU 12345 – Amazon.com") when citing results.
* Compute month-over-month % change on the *forecast* for each SKU-Channel.
* Identify the **top N (default = 10) largest increases** and **top N largest decreases**.
* Flag SKU-Channels with a **steady CAGR** (≥ tolerance) over the last *k* periods (default = 6).
* Scan historical_data to find patterns:
  - ≥ 3 straight periods of ~0 demand followed by a spike ≥ 5× historical median.
  - Abrupt structural breaks (mean shift, variance jump).
* Link each insight to plausible drivers (promo_flag, seasonality, external_signals) when evidence exists; otherwise say "driver unknown".
* For each insight, include a concise **explanation or root cause** of why the trend or anomaly likely occurred.
* End with **"Planner Actions"**—concise bullets of recommended next steps.

### STYLE Use plain English phrases—avoid jargon. Keep numeric values to one decimal unless integers. Limit each insight to ≤ 40 words.`;

await countTokensForPrompt(chunk_prompt);
        
        let retries = 0;
        let success = false;
        let lastError = null;
        
        while (!success && retries < 3) {
          try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contents: [{
                  parts: [{ text: chunk_prompt }]
                }],
                generationConfig: {
                  responseMimeType: "application/json",
                  responseSchema: {
                    type: "object",
                    properties: {
                      biggest_moves: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            sku_channel: { type: "string" },
                            percent_change_mom: { type: "number" },
                            direction: { type: "string" },
                            likely_drivers: {
                              type: "array",
                              items: { type: "string" }
                            },
                            explanation: { type: "string" },
                            planner_action: { type: "string" }
                          },
                          required: [
                            "sku_channel",
                            "percent_change_mom",
                            "direction",
                            "likely_drivers",
                            "explanation",
                            "planner_action"
                          ]
                        }
                      },
                      steady_trends: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            sku_channel: { type: "string" },
                            cagr_6p: { type: "number" },
                            trend: { type: "string" },
                            likely_drivers: {
                              type: "array",
                              items: { type: "string" }
                            },
                            explanation: { type: "string" },
                            planner_action: { type: "string" }
                          },
                          required: [
                            "sku_channel",
                            "cagr_6p",
                            "trend",
                            "likely_drivers",
                            "explanation",
                            "planner_action"
                          ]
                        }
                      },
                      historical_anomalies: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            sku_channel: { type: "string" },
                            pattern: { type: "string" },
                            possible_cause: { type: "string" },
                            explanation: { type: "string" },
                            planner_action: { type: "string" }
                          },
                          required: [
                            "sku_channel",
                            "pattern",
                            "possible_cause",
                            "explanation",
                            "planner_action"
                          ]
                        }
                      },

                    },
                    required: [
                      "biggest_moves",
                      "steady_trends",
                      "historical_anomalies"
                    ]
                  }
                }
              })
            });
            
            if (response.status === 429) {
              retries++;
              setProgressText(`Rate limited (429). Waiting 90s before retrying... (Attempt ${retries}/3)`);
              await new Promise(res => setTimeout(res, 90000));
              continue;
            }
            
            if (!response.ok) {
              throw new Error(`API request failed: ${response.status}`);
            }
            
            const data = await response.json();
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
              const content = data.candidates[0].content.parts[0].text;
              try {
                const parsedInsights = JSON.parse(content);
                allChunkReports.push(JSON.stringify(parsedInsights));
                console.log(`✅ Success: Chunk ${i + 1} of ${totalChunks} processed. Insights received:`, parsedInsights);
              } catch (parseError) {
                console.error('Failed to parse JSON response:', parseError);
                setError('Received invalid response format from AI service.');
              }
            } else {
              setError('No valid response received from AI service.');
            }
            success = true;
          } catch (err) {
            lastError = err;
            if (retries >= 2) {
              setError(`Failed to generate insights after 3 attempts. Last error: ${err.message}`);
            }
            retries++;
            await new Promise(res => setTimeout(res, 90000));
          }
        }
        
        // Always wait 90 seconds between chunk requests
        if (i < totalChunks - 1) {
          setProgressText(`Waiting 90s before next chunk...`);
          await new Promise(res => setTimeout(res, 90000));
        }
      }
      
      // Now merge all chunk reports using merge_prompt
      setProgressText('Merging all chunk insights...');
      setProgress(95);
      
      const joinedReports = allChunkReports.join('\n\n---\n\n');
      const merge_prompt = `You are a **Supply‑Chain Data Analyst**. Your job now is to **combine and summarize** the following insight reports into a single, coherent document. Preserve structure, conciseness, and actionable insights.

Here are the reports:
${joinedReports}

### TASK
Summarize the most important trends and anomalies across all reports, removing duplicates, clustering similar insights, and keeping explanations clear and useful.

End with a final **Planner Actions** list.`;

      let mergeRetries = 0;
      let mergeSuccess = false;
      
      while (!mergeSuccess && mergeRetries < 3) {
        try {
          const mergeResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: merge_prompt }]
              }],
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: "object",
                  properties: {
                    biggest_moves: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          sku_channel: { type: "string" },
                          percent_change_mom: { type: "number" },
                          direction: { type: "string" },
                          likely_drivers: {
                            type: "array",
                            items: { type: "string" }
                          },
                          explanation: { type: "string" },
                          planner_action: { type: "string" }
                        },
                        required: [
                          "sku_channel",
                          "percent_change_mom",
                          "direction",
                          "likely_drivers",
                          "explanation",
                          "planner_action"
                        ]
                      }
                    },
                    steady_trends: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          sku_channel: { type: "string" },
                          cagr_6p: { type: "number" },
                          trend: { type: "string" },
                          likely_drivers: {
                            type: "array",
                            items: { type: "string" }
                          },
                          explanation: { type: "string" },
                          planner_action: { type: "string" }
                        },
                        required: [
                          "sku_channel",
                          "cagr_6p",
                          "trend",
                          "likely_drivers",
                          "explanation",
                          "planner_action"
                        ]
                      }
                    },
                    historical_anomalies: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          sku_channel: { type: "string" },
                          pattern: { type: "string" },
                          possible_cause: { type: "string" },
                          explanation: { type: "string" },
                          planner_action: { type: "string" }
                        },
                        required: [
                          "sku_channel",
                          "pattern",
                          "possible_cause",
                          "explanation",
                          "planner_action"
                        ]
                      }
                    },

                  },
                  required: [
                    "biggest_moves",
                    "steady_trends",
                    "historical_anomalies"
                  ]
                }
              }
            })
          });
          
          if (mergeResponse.status === 429) {
            mergeRetries++;
            setProgressText(`Rate limited during merge (429). Waiting 90s before retrying... (Attempt ${mergeRetries}/3)`);
            await new Promise(res => setTimeout(res, 90000));
            continue;
          }
          
          if (!mergeResponse.ok) {
            throw new Error(`Merge API request failed: ${mergeResponse.status}`);
          }
          
          const mergeData = await mergeResponse.json();
          if (mergeData.candidates && mergeData.candidates[0] && mergeData.candidates[0].content) {
            const mergeContent = mergeData.candidates[0].content.parts[0].text;
            try {
              const finalInsights = JSON.parse(mergeContent);
              setInsights(finalInsights);
              console.log('✅ Success: All chunks merged successfully:', finalInsights);
            } catch (parseError) {
              console.error('Failed to parse merged JSON response:', parseError);
              setError('Received invalid merge response format from AI service.');
            }
          } else {
            setError('No valid merge response received from AI service.');
          }
          mergeSuccess = true;
        } catch (err) {
          if (mergeRetries >= 2) {
            setError(`Failed to merge insights after 3 attempts. Error: ${err.message}`);
          }
          mergeRetries++;
          await new Promise(res => setTimeout(res, 90000));
        }
      }
      
      setProgress(100);
      setProgressText('All chunks processed and merged.');
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

  const renderInsightSection = (title, items, icon, colorClass) => {
    if (!items || items.length === 0) return null;
    
    return (
      <div className="border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className={`text-lg font-semibold mb-4 flex items-center ${colorClass}`}>
          {icon}
          {title}
        </h3>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full mt-2 ${colorClass.includes('blue') ? 'bg-blue-500' : 
                    colorClass.includes('green') ? 'bg-green-500' : 
                    colorClass.includes('yellow') ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    {item.sku_channel}
                  </p>
                  {item.percent_change_mom !== undefined && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Change:</span> {item.percent_change_mom.toFixed(1)}% {item.direction}
                    </p>
                  )}
                  {item.cagr_6p !== undefined && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">6-Period CAGR:</span> {item.cagr_6p.toFixed(1)}% ({item.trend})
                    </p>
                  )}
                  {item.pattern && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Pattern:</span> {item.pattern}
                    </p>
                  )}
                  {item.possible_cause && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Possible Cause:</span> {item.possible_cause}
                    </p>
                  )}
                  {item.likely_drivers && item.likely_drivers.length > 0 && !item.likely_drivers.some(driver => driver.toLowerCase().includes('driver unknown')) && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Drivers:</span> {item.likely_drivers.filter(driver => !driver.toLowerCase().includes('driver unknown')).join(', ')}
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Explanation:</span> {item.explanation}
                  </p>
                  <p className="text-sm text-blue-700 bg-blue-50 px-2 py-1 rounded">
                    <span className="font-medium">Action:</span> {item.planner_action}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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

          {/* Progress Bar */}
          {loading && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div
                  className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-700 text-center">{progressText}</div>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">AI-Generated Supply Chain Insights</h2>
            
            {renderInsightSection(
              "Biggest Demand Movements", 
              insights.biggest_moves, 
              <ArrowTrendingUpIcon className="h-5 w-5 text-blue-500 mr-2" />,
              "text-blue-700"
            )}
            
            {renderInsightSection(
              "Steady Growth/Decline Trends", 
              insights.steady_trends, 
              <ArrowTrendingDownIcon className="h-5 w-5 text-green-500 mr-2" />,
              "text-green-700"
            )}
            
            {renderInsightSection(
              "Historical Anomalies", 
              insights.historical_anomalies, 
              <EyeIcon className="h-5 w-5 text-yellow-500 mr-2" />,
              "text-yellow-700"
            )}

            {/* Disclaimer */}
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
                <p className="text-sm text-yellow-700">
                  <strong>Disclaimer:</strong> This analysis is AI-generated. Supply chain analysts should verify all insights and recommendations before taking action.
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