// API configuration
const config = {
  // Backend URL for the deployed service
  apiBaseUrl: process.env.REACT_APP_API_URL || 'https://trends-dashboard-backend-766707302238.europe-west1.run.app',
  
  // Function to get headers for API calls
  getHeaders: async () => {
    return {
      'Content-Type': 'application/json'
    };
  }
};

export default config; 