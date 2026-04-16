// AgriSense Backend Server
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const connectDB = require('./config/db');
const { initializeDefaultAdmin } = require('./controllers/adminController');

connectDB().then(() => {
  // Initialize default admin if none exists
  initializeDefaultAdmin();
});

// Route imports
app.use('/api/crop', require('./routes/crop'));
app.use('/api/fertilizer', require('./routes/fertilizer'));
app.use('/api/disease', require('./routes/disease'));
app.use('/api/irrigation', require('./routes/irrigation'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/soil', require('./routes/soil'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));


// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'AgriSense API is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});