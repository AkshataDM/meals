const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Comprehensive request logger
app.use((req, res, next) => {
  console.log(`\n=== REQUEST LOG ===`);
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log(`Headers:`, req.headers);
  console.log(`Body:`, req.body);
  console.log(`Query:`, req.query);
  console.log(`==================\n`);
  next();
});

// Handle CORS preflight for all API routes
app.options('/api/*', cors());

// Import serverless-style handlers
const computeIngredientsHandler = require('./api/compute-ingredients');
const healthHandler = require('./api/health');

// Mount routes mapping to handlers
app.post('/api/compute-ingredients', (req, res) => {
  console.log(`\n=== HANDLING /api/compute-ingredients ===`);
  console.log(`Request method: ${req.method}`);
  console.log(`Request body:`, req.body);
  console.log(`Claude API key exists: ${!!process.env.CLAUDE_API_KEY}`);
  console.log(`Claude API key length: ${process.env.CLAUDE_API_KEY ? process.env.CLAUDE_API_KEY.length : 0}`);
  console.log(`==========================================\n`);
  
  computeIngredientsHandler(req, res);
});

app.get('/api/health', (req, res) => healthHandler(req, res));

app.listen(PORT, () => {
  console.log(`\n=== SERVER STARTUP ===`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Claude API key set: ${!!process.env.CLAUDE_API_KEY}`);
  console.log(`Claude API key length: ${process.env.CLAUDE_API_KEY ? process.env.CLAUDE_API_KEY.length : 0}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=====================\n`);
}); 