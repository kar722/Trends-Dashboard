module.exports = {
  webpack: {
    configure: {
      ignoreWarnings: [
        {
          module: /plotly\.js/,
        },
      ],
    },
  },
}; 