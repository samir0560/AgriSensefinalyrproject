# AgriSense

AgriSense is an AI-powered agriculture assistant that helps farmers make informed decisions through machine learning algorithms. The application provides crop recommendations, fertilizer suggestions, disease detection, irrigation advice, and weather information.

## Features

- **Crop Prediction**: Get recommendations on the best crops to grow based on soil and weather conditions
- **Fertilizer Recommendation**: Find the best fertilizer for your crops based on soil type and crop requirements
- **Disease Detection**: Upload images of your crops to detect diseases and get treatment advice
- **Irrigation Advice**: Optimize your irrigation based on crop type, soil, and weather conditions
- **Weather Information**: Access current weather data and forecasts for your farming decisions
- **Admin Dashboard**: Manage content, crops, and system settings
- **AI Chatbot**: Get instant agricultural advice and recommendations

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB
- Python (for ML models)
- TensorFlow/Scikit-learn (for ML models)

### Frontend
- React.js
- React Router
- Axios
- CSS3

### AI/ML
- TensorFlow
- Scikit-learn
- OpenCV

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- **Python** (v3.7 or higher)
- **MongoDB** (local installation or cloud service like MongoDB Atlas)
- **Git**

## Project Structure

```
AgriSense/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── ml-models/
│   ├── models/
│   ├── python/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── i18n/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   └── package-lock.json
├── ML-Training/
└── crop_recomendation/
```
## Installation and Setup Instructions

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Agrisense
```

### Step 2: Install Backend Dependencies

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Install Python dependencies (if not already installed):
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the backend directory with the following content:
```
# Server Configuration
PORT=5000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/agrisense

# API Keys
OWM_API_KEY=your_openweathermap_api_key_here
GEMINI_API_KEY=your_google_gemini_api_key_here

# Security
JWT_SECRET=your_jwt_secret_key

NODE_ENV=development
```

> **Note:** You will need to obtain API keys for:
> - [OpenWeatherMap API](https://openweathermap.org/api) for weather data
> - [Google Gemini API](https://ai.google.dev/) for the AI chatbot

### Step 3: Install Frontend Dependencies

1. Navigate to the frontend directory:
```bash
cd ../frontend
```

2. Install React dependencies:
```bash
npm install
```

### Step 4: Setup Database

1. Make sure MongoDB is running on your system:
   - For Windows: Start MongoDB service from Services
   - For macOS/Linux: Run `mongod` in a terminal

2. The application will automatically create the required collections when you start it

### Step 5: Running the Application

#### Option 1: Run Backend and Frontend Separately

1. Start the backend server (from the backend directory):
```bash
npm run dev
```
This will start the server on `http://localhost:5000`

2. In a new terminal, navigate to the frontend directory and start the frontend:
```bash
cd ../frontend
npm start
```
This will start the React development server on `http://localhost:3000`

#### Option 2: Run with Concurrently (if configured)

1. From the project root directory:
```bash
# Install concurrently globally if not already installed
npm install -g concurrently

# Run both servers
concurrently "npm run dev" --cwd=backend "npm start" --cwd=frontend
```

### Step 6: Access the Application

1. Frontend: Open `http://localhost:3000` in your browser
2. Backend API: Available at `http://localhost:5000/api`
3. Admin Dashboard: Accessible at `http://localhost:3000/admin` with default credentials:
   - Username: `admin`
   - Password: `admin123`

### Additional Setup for ML Models

The application uses pre-trained machine learning models for crop recommendation, disease detection, fertilizer recommendation, and irrigation advice. These models are located in the `backend/ml-models/` directory. If you need to retrain these models, refer to the Jupyter notebooks in the `ML-Training/` directory.

## API Endpoints

### Crop
- `POST /api/crop/recommend` - Get crop recommendation
- `GET /api/crop` - Get all crops
- `GET /api/crop/:id` - Get crop by ID

### Fertilizer
- `POST /api/fertilizer/recommend` - Get fertilizer recommendation
- `GET /api/fertilizer` - Get all fertilizers
- `GET /api/fertilizer/:id` - Get fertilizer by ID

### Disease
- `POST /api/disease/predict` - Predict disease from image
- `GET /api/disease` - Get all diseases
- `GET /api/disease/:id` - Get disease by ID

### Irrigation
- `POST /api/irrigation/recommend` - Get irrigation recommendation
- `GET /api/irrigation` - Get all irrigation methods
- `GET /api/irrigation/:id` - Get irrigation method by ID

### Weather
- `GET /api/weather/current` - Get current weather data
- `GET /api/weather/forecast` - Get weather forecast
- `GET /api/weather/historical` - Get historical weather data

### Chatbot
- `POST /api/chatbot/message` - Get AI response to user message

### Admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/profile` - Get admin profile
- `PUT /api/admin/credentials` - Update admin credentials
- `GET /api/admin/activities` - Get recent activities
- `POST /api/admin/activity` - Log an activity

## Machine Learning Models

The application uses several trained ML models:

- Crop prediction model (trained on soil and weather parameters)
- Fertilizer recommendation model (trained on crop and soil data)
- Irrigation recommendation model (trained on crop, soil, and weather data)
- Disease detection model (CNN trained on plant leaf images)

## Environment Variables

The application requires the following environment variables in the `.env` file:

- `PORT` - Port for the backend server (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `OWM_API_KEY` - OpenWeatherMap API key for weather data
- `GEMINI_API_KEY` - Google Gemini API key for AI chatbot
- `JWT_SECRET` - Secret key for JWT token generation
- `NODE_ENV` - Environment mode (development/production)

## Troubleshooting

### Common Issues

1. **Backend server not starting**:
   - Ensure MongoDB is running
   - Check that all environment variables are set correctly
   - Verify that the port 5000 is not in use by another application

2. **Frontend not connecting to backend**:
   - Make sure the backend server is running
   - Check that the API base URL in `frontend/src/api/api.js` matches your backend URL

3. **Python dependencies missing**:
   - Run `pip install -r backend/requirements.txt` to install Python dependencies
   - Make sure you have Python 3.7+ installed

4. **ML models not loading**:
   - Ensure all model files exist in `backend/ml-models/` directory
   - Check that Python dependencies are properly installed

5. **Chatbot not responding**:
   - Verify that the GEMINI_API_KEY is set correctly in the .env file
   - Check that the API key has proper permissions

### Default Credentials

- Admin Panel: `admin` / `admin123`
- These can be changed after the first login

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.