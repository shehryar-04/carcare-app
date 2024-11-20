const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const routes = require('./src/routes');

// Load environment variables
dotenv.config();

const app = express();

// Middleware to parse JSON requests
app.use(express.json({ limit: '1mb' }));

// Enable CORS for all routes
app.use(cors());

// static website
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api', routes);

// Start the server
const PORT = process.env.PORT || 4000;

app.listen(PORT, (err) => {
  if (err) {
    console.error('Error starting the server:', err);
  } else {
    console.log(`Server running on port ${PORT}`);
  }
});
