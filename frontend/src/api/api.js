import axios from 'axios';

const API_BASE_URL = 'https://agrisensefinalyrprojectt.onrender.com';

const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {});

// Crop API
export const getCropRecommendation = async (data, token = null) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/crop/recommend`, data, {
      headers: authHeaders(token)
    });
    return response.data;
  } catch (error) {
    console.error('Error getting crop recommendation:', error);
    throw error;
  }
};

export const getAllCrops = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/crop`);
    return response.data;
  } catch (error) {
    console.error('Error getting all crops:', error);
    throw error;
  }
};

// Fertilizer API
export const getFertilizerRecommendation = async (data, token = null) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/fertilizer/recommend`, data, {
      headers: authHeaders(token)
    });
    return response.data;
  } catch (error) {
    console.error('Error getting fertilizer recommendation:', error);
    throw error;
  }
};

export const getAllFertilizers = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/fertilizer`);
    return response.data;
  } catch (error) {
    console.error('Error getting all fertilizers:', error);
    throw error;
  }
};

// Disease API
export const predictDisease = async (imageFile, token = null) => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await axios.post(`${API_BASE_URL}/disease/predict`, formData, {
      headers: authHeaders(token)
    });
    return response.data;
  } catch (error) {
    console.error('Error predicting disease:', error);
    throw error;
  }
};

export const getAllDiseases = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/disease`);
    return response.data;
  } catch (error) {
    console.error('Error getting all diseases:', error);
    throw error;
  }
};

// Irrigation API
export const getIrrigationRecommendation = async (data, token = null) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/irrigation/recommend`, data, {
      headers: authHeaders(token)
    });
    return response.data;
  } catch (error) {
    console.error('Error getting irrigation recommendation:', error);
    throw error;
  }
};

export const getAllIrrigationMethods = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/irrigation`);
    return response.data;
  } catch (error) {
    console.error('Error getting all irrigation methods:', error);
    throw error;
  }
};

// Weather API
export const getWeatherData = async (location, token = null) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/weather/current`, {
      params: location,
      headers: authHeaders(token)
    });
    return response.data;
  } catch (error) {
    console.error('Error getting weather data:', error);
    throw error;
  }
};

export const getWeatherForecast = async (location, token = null) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/weather/forecast`, {
      params: location,
      headers: authHeaders(token)
    });
    return response.data;
  } catch (error) {
    console.error('Error getting weather forecast:', error);
    throw error;
  }
};

// Soil Data API
export const createSoilData = async (data, token = null) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/soil`, data, {
      headers: authHeaders(token)
    });
    return response.data;
  } catch (error) {
    console.error('Error creating soil data:', error);
    throw error;
  }
};

// Chatbot API
export const getChatResponse = async (message, userId = null, context = {}, locale = null, token = null) => {
  try {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await axios.post(
      `${API_BASE_URL}/chatbot/message`,
      { message, userId, context, locale },
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting chat response:', error);
    throw error;
  }
};

export const getChatHistory = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/chatbot/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error loading chat history:', error);
    throw error;
  }
};

export const getNearbySoilData = async (lat, lon, radius = 10) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/soil/nearby?lat=${lat}&lon=${lon}&radius=${radius}`);
    return response.data;
  } catch (error) {
    console.error('Error getting nearby soil data:', error);
    throw error;
  }
};

export const getSoilDataById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/soil/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error getting soil data by ID:', error);
    throw error;
  }
};

export const updateSoilData = async (id, data) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/soil/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating soil data:', error);
    throw error;
  }
};

export const deleteSoilData = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/soil/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting soil data:', error);
    throw error;
  }
};

export const getSoilAnalysis = async (data, token = null) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/soil/analysis`, data, {
      headers: authHeaders(token)
    });
    return response.data;
  } catch (error) {
    console.error('Error getting soil analysis:', error);
    throw error;
  }
};

// Admin API
export const getRecentActivities = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/activities`);
    return response.data;
  } catch (error) {
    console.error('Error getting recent activities:', error);
    throw error;
  }
};

export const logActivity = async (activityData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/admin/activity`, activityData);
    return response.data;
  } catch (error) {
    console.error('Error logging activity:', error);
    throw error;
  }
};

export const updateAdminCredentials = async (credentials) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/admin/credentials`, credentials);
    return response.data;
  } catch (error) {
    console.error('Error updating admin credentials:', error);
    throw error;
  }
};

export const adminLogin = async (loginData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/admin/login`, loginData);
    return response.data;
  } catch (error) {
    console.error('Error during admin login:', error);
    throw error;
  }
};

export const getAdminProfile = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/profile`);
    return response.data;
  } catch (error) {
    console.error('Error getting admin profile:', error);
    throw error;
  }
};

// User auth API
export const registerUser = async (email, password, name) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      email,
      password,
      name: name || undefined
    });
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.message;
    return { success: false, message: msg || error.message };
  }
};

export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.message;
    return { success: false, message: msg || error.message };
  }
};

export const getCurrentUser = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
};

export const updateUserProfile = async (token, data) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/auth/profile`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    const msg = error.response?.data?.message;
    return { success: false, message: msg || error.message };
  }
};

/** Log a feature result computed on the client (e.g. simulated disease detection) for signed-in users. */
export const logClientFeatureResult = async (token, { featureType, request, response }) => {
  if (!token) return;
  try {
    await axios.post(
      `${API_BASE_URL}/auth/feature-log`,
      { featureType, request, response },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch (error) {
    console.error('Error logging client feature result:', error);
  }
};

/** List saved feature API results for the logged-in user (newest first). */
export const getMyFeatureResponses = async (token, { limit = 50, skip = 0 } = {}) => {
  if (!token) {
    return { success: false, data: [], total: 0 };
  }
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/feature-responses`, {
      headers: authHeaders(token),
      params: { limit, skip }
    });
    return response.data;
  } catch (error) {
    console.error('Error loading feature responses:', error);
    return {
      success: false,
      data: [],
      total: 0,
      message: error.response?.data?.message
    };
  }
};

