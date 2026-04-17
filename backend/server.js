// AgriSense Backend Server (Production Ready)

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// ✅ Use Render PORT
const PORT = process.env.PORT || 5000;

// ✅ Allowed frontend origin
const allowedOrigin = "https://agrisensefinalyrprojects.onrender.com";

// ================= MIDDLEWARE =================

// ✅ Secure CORS (only allow your frontend)
app.use(cors({
  origin: allowedOrigin,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= DATABASE =================
const connectDB = require('./config/db');
const { initializeDefaultAdmin } = require('./controllers/adminController');

connectDB()
  .then(() => {
    console.log("MongoDB Connected ✅");
    initializeDefaultAdmin();
  })
  .catch(err => {
    console.error("DB Connection Failed ❌", err);
    process.exit(1); // stop server if DB fails
  });

// ================= ROUTES =================
app.use('/api/crop', require('./routes/crop'));
app.use('/api/fertilizer', require('./routes/fertilizer'));
app.use('/api/disease', require('./routes/disease'));
app.use('/api/irrigation', require('./routes/irrigation'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/soil', require('./routes/soil'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));

// ================= HEALTH CHECK =================
app.get('/', (req, res) => {
  res.json({ status: "OK", message: "AgriSense API is running 🚀" });
});

// ================= ERROR HANDLING =================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "production" ? undefined : err.message
  });
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
