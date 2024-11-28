const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const routes = require('./src/routes');
// const notification = require('./src/controllers/toAllNotifiction');

// Load environment variables
dotenv.config();

const app = express();

// CORS Configuration
const corsOptions = {  
  origin: 'http://localhost:3000', // Allow requests only from this origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed HTTP methods
  credentials: true, // Allow cookies and authorization headers
};

// Middleware
app.use(cors(corsOptions)); // Enable CORS with specified options
app.use(express.json({ limit: '1mb' })); // Parse JSON requests with size limit
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// API Routes
app.use('/api', routes);

// Global Error Handler (Optional but Recommended)
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

// Server Initialization
const PORT = process.env.PORT || 4000;
app.listen(PORT, (err) => {
  if (err) {
    console.error('Error starting the server:', err);
  } else {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  }
});
