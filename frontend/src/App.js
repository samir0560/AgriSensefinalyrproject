import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Outlet, Navigate } from 'react-router-dom';
import './App.css';
import { I18nProvider } from './i18n/i18nContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Crop from './pages/Crop';
import Fertilizer from './pages/Fertilizer';
import Disease from './pages/Disease';
import Irrigation from './pages/Irrigation';
import Weather from './pages/Weather';
import About from './pages/About';
import AdminDashboard from './pages/AdminDashboard';
import SoilAnalysis from './pages/SoilAnalysis';
import Blog from './pages/Blog';
import Documentation from './pages/Documentation';
import API from './pages/API';
import Tutorials from './pages/Tutorials';
import Support from './pages/Support';
import ChatbotToggle from './components/ChatbotToggle';
import Footer from './components/Footer';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AccountLayout from './components/AccountLayout';
import AccountSettings from './pages/AccountSettings';
import AccountFeatures from './pages/AccountFeatures';

// Component to handle admin session cleanup on route changes
const RouteGuard = () => {
  const location = useLocation();

  useEffect(() => {
    // If navigating away from /admin, clear admin session
    if (location.pathname !== '/admin') {
      const adminAuth = sessionStorage.getItem('adminAuth');
      if (adminAuth === 'true') {
        sessionStorage.removeItem('adminAuth');
        console.log('Admin session cleared - navigated away from admin panel');
      }
    }
  }, [location.pathname]);

  return null;
};

const MainLayout = () => (
  <>
    <Navbar />
    <main>
      <Outlet />
    </main>
    <Footer />
    <ChatbotToggle />
  </>
);

function App() {
  return (
    <I18nProvider>
      <Router>
        <AuthProvider>
          <RouteGuard />
          <div className="App">
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/crop" element={<Crop />} />
                <Route path="/fertilizer" element={<Fertilizer />} />
                <Route path="/disease" element={<Disease />} />
                <Route path="/irrigation" element={<Irrigation />} />
                <Route path="/weather" element={<Weather />} />
                <Route path="/about" element={<About />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/soil-analysis" element={<SoilAnalysis />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/documentation" element={<Documentation />} />
                <Route path="/api" element={<API />} />
                <Route path="/tutorials" element={<Tutorials />} />
                <Route path="/support" element={<Support />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/account" element={<AccountLayout />}>
                  <Route index element={<Navigate to="settings" replace />} />
                  <Route path="settings" element={<AccountSettings />} />
                  <Route path="features" element={<AccountFeatures />} />
                </Route>
              </Route>
            </Routes>
          </div>
        </AuthProvider>
      </Router>
    </I18nProvider>
  );
}

export default App;