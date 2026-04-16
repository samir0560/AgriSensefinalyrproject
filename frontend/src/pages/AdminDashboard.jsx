import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getCarouselImages, addCarouselImage, updateCarouselImage, deleteCarouselImage } from '../services/carouselService';
import { getCrops, addCrop, updateCrop, deleteCrop } from '../services/cropService';
import { getRecentActivities, logActivity, updateAdminCredentials, adminLogin, getAdminProfile } from '../api/api';

const AdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [images, setImages] = useState([]);
  const [crops, setCrops] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: null,
    alt: ''
  });
  const [cropFormData, setCropFormData] = useState({
    name: '',
    category: '',
    season: '',
    waterRequirement: '',
    fertilizerType: ''
  });
  const [editingImage, setEditingImage] = useState(null);
  const [editingCrop, setEditingCrop] = useState(null);
  const [preview, setPreview] = useState(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [adminCreds, setAdminCreds] = useState({
    username: '',
    password: ''
  });
  const [credsForm, setCredsForm] = useState({
    newUsername: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [contactInfo, setContactInfo] = useState({
    email: localStorage.getItem('contactEmail') || 'info@agrisense.com',
    phone: localStorage.getItem('contactPhone') || '+91 00000000',
    address: localStorage.getItem('contactAddress') || 'Surampalem, Andhra Pradesh, India'
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Recent activity state
  const [recentActivities, setRecentActivities] = useState([]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Auto-logout when navigating away from admin panel
  useEffect(() => {
    // Function to perform auto-logout
    const performAutoLogout = async () => {
      const auth = sessionStorage.getItem('adminAuth');
      if (auth === 'true') {
        sessionStorage.removeItem('adminAuth');
        setIsLoggedIn(false);
        
        // Log auto logout activity
        try {
          await logActivity({
            type: '🔒 Auto Logout',
            description: `Admin session automatically terminated - navigated away from admin panel`
          });
        } catch (err) {
          console.error('Error logging auto logout:', err);
        }
      }
    };

    // Check if current route is not /admin (shouldn't happen, but safety check)
    if (location.pathname !== '/admin') {
      performAutoLogout();
      return;
    }

    // Listen for beforeunload (tab/window close or refresh)
    const handleBeforeUnload = (e) => {
      const auth = sessionStorage.getItem('adminAuth');
      if (auth === 'true') {
        // Note: We can't use async operations in beforeunload
        // Session will be cleared by RouteGuard component
        sessionStorage.removeItem('adminAuth');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function - runs when component unmounts (navigating away)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // When component unmounts, it means we're leaving /admin
      const auth = sessionStorage.getItem('adminAuth');
      if (auth === 'true') {
        sessionStorage.removeItem('adminAuth');
        // Try to log activity (may not complete if navigating away)
        logActivity({
          type: '🔒 Auto Logout',
          description: `Admin session automatically terminated - navigated away from admin panel`
        }).catch(err => console.error('Error logging auto logout:', err));
      }
    };
  }, []);

  // Load carousel images, crops and admin data on component mount
  useEffect(() => {
    // Check if user was already logged in this session
    const auth = sessionStorage.getItem('adminAuth');
    if (auth === 'true' && location.pathname === '/admin') {
      setIsLoggedIn(true);
      
      // Load admin profile and activities if logged in
      loadAdminData();
    }

    const loadedImages = getCarouselImages();
    setImages(loadedImages);
    const loadedCrops = getCrops();
    setCrops(loadedCrops);
    
    // Initialize recent activities from backend
    initializeRecentActivities();
  }, [location.pathname]);
  
  // Load admin profile and activities
  const loadAdminData = async () => {
    try {
      // Load admin profile
      const profileResponse = await getAdminProfile();
      if (profileResponse.success) {
        setAdminCreds({
          username: profileResponse.admin.username,
          password: '' // Don't store password in state for security
        });
        
        // Update form with current username
        setCredsForm(prev => ({
          ...prev,
          newUsername: profileResponse.admin.username
        }));
      }
      
      // Load recent activities
      const activitiesResponse = await getRecentActivities();
      if (activitiesResponse.success) {
        setRecentActivities(activitiesResponse.activities);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      const response = await adminLogin(loginForm);
      if (response.success) {
        setIsLoggedIn(true);
        sessionStorage.setItem('adminAuth', 'true');
        setAdminCreds({
          username: response.admin.username,
          password: ''
        });
        
        // Log login activity
        await logActivity({
          type: '🔐 Admin Login',
          description: `Admin ${response.admin.username} logged in successfully`
        });
      } else {
        alert(response.message || 'Invalid username or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Check if this is a 404 error (admin not found) and provide helpful message
      if (error.response && error.response.status === 404) {
        alert('Admin account not found. Please make sure the default admin has been created or contact your system administrator.');
      } else {
        alert('Login failed. Please check your credentials and try again. Default is admin/admin123');
      }
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggedIn(false);
      sessionStorage.removeItem('adminAuth');
      
      // Log logout activity
      await logActivity({
        type: '🔒 Admin Logout',
        description: `Admin ${adminCreds.username || 'Unknown'} logged out manually`
      });
      
      // Navigate away from admin panel
      navigate('/');
    } catch (error) {
      console.error('Error logging logout activity:', error);
      // Still navigate away even if logging fails
      navigate('/');
    }
  };

  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const handleCredsChange = (e) => {
    setCredsForm({ ...credsForm, [e.target.name]: e.target.value });
  };

  const updateCredentials = async (e) => {
    e.preventDefault();
    if (credsForm.newPassword !== credsForm.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (credsForm.newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      const response = await updateAdminCredentials({
        username: credsForm.newUsername,
        password: credsForm.newPassword
      });
      
      if (response.success) {
        setAdminCreds({
          username: credsForm.newUsername,
          password: '' // Don't store password in state
        });
        
        setCredsForm({ ...credsForm, newPassword: '', confirmPassword: '' });
        
        // Log credentials update activity
        await logActivity({
          type: '🔑 Credentials Update',
          description: `Admin credentials updated for user ${credsForm.newUsername}`
        });
        
        alert('Admin credentials updated successfully!');
      } else {
        alert(response.message || 'Failed to update credentials');
      }
    } catch (error) {
      console.error('Error updating credentials:', error);
      alert('Failed to update credentials. Please try again.');
    }
  };

  const handleContactChange = (e) => {
    setContactInfo({ ...contactInfo, [e.target.name]: e.target.value });
  };

  const updateContactSettings = async (e) => {
    e.preventDefault();
    localStorage.setItem('contactEmail', contactInfo.email);
    localStorage.setItem('contactPhone', contactInfo.phone);
    localStorage.setItem('contactAddress', contactInfo.address);
    alert('Contact information updated successfully!');
    // Trigger a storage event for other tabs/components
    window.dispatchEvent(new Event('storage'));
    
    // Log activity
    try {
      await logActivity({
        type: '📞 Contact Update',
        description: `Updated contact information: ${contactInfo.email}`
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  // Initialize recent activities from backend
  const initializeRecentActivities = async () => {
    try {
      const response = await getRecentActivities();
      if (response.success) {
        setRecentActivities(response.activities);
      } else {
        // Set default activities if API call fails
        const defaultActivities = [
          {
            _id: 1,
            type: '🌱 Crop Update',
            description: 'Database synchronized with latest crop data',
            time: 'Just now',
            timestamp: new Date().toISOString()
          },
          {
            _id: 2,
            type: '🖼️ Image Sync',
            description: 'Carousel slider cache cleared and updated',
            time: '45 mins ago',
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
          },
          {
            _id: 3,
            type: '🔑 Security',
            description: 'Admin profile settings updated',
            time: '2 hours ago',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          }
        ];
        setRecentActivities(defaultActivities);
      }
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      // Set default activities if API call fails
      const defaultActivities = [
        {
          _id: 1,
          type: '🌱 Crop Update',
          description: 'Database synchronized with latest crop data',
          time: 'Just now',
          timestamp: new Date().toISOString()
        },
        {
          _id: 2,
          type: '🖼️ Image Sync',
          description: 'Carousel slider cache cleared and updated',
          time: '45 mins ago',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
        },
        {
          _id: 3,
          type: '🔑 Security',
          description: 'Admin profile settings updated',
          time: '2 hours ago',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ];
      setRecentActivities(defaultActivities);
    }
  };
  
  // Add a new activity to backend
  const addActivity = async (type, description) => {
    try {
      const response = await logActivity({ type, description });
      if (response.success) {
        // Refresh activities after adding new one
        initializeRecentActivities();
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-login-container">
        <div className="login-card">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏛️</div>
          <h2 style={{ marginBottom: '0.5rem' }}>AgriSense Admin</h2>
          <p style={{ color: '#666', marginBottom: '2rem', fontSize: '0.9rem' }}>Secure Portal Access</p>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                value={loginForm.username}
                onChange={handleLoginChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="password-input">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  name="password"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  required
                />
                <span 
                  className="password-toggle"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                >
                  <span className={showLoginPassword ? 'eye-open' : 'eye-closed'}></span>
                </span>
              </div>
            </div>
            <button type="submit" className="btn btn-primary">Login</button>
          </form>
          {/* <p className="login-hint">Default: admin / admin123</p> */}
          <div className="back-link">
            <Link to="/">← Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  // Handle crop form change
  const handleCropChange = (e) => {
    setCropFormData({
      ...cropFormData,
      [e.target.name]: e.target.value
    });
  };

  // Handle form submission for adding/updating images
  const handleImageSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      alert('Please fill in the title and description');
      return;
    }

    if (editingImage) {
      // Update existing image
      const updatedImage = {
        ...editingImage,
        title: formData.title,
        description: formData.description,
        alt: formData.alt || formData.title,
        image: preview || editingImage.image
      };

      const updatedImages = updateCarouselImage(updatedImage);
      setImages(updatedImages);
      setEditingImage(null);
    } else {
      // Create new image
      if (!formData.image) {
        alert('Please select an image');
        return;
      }

      const newImage = {
        title: formData.title,
        description: formData.description,
        image: preview,
        alt: formData.alt || formData.title,
      };

      const updatedImages = addCarouselImage(newImage);
      setImages(updatedImages);
    }

    // Reset form
    setFormData({
      title: '',
      description: '',
      image: null,
      alt: ''
    });
    setPreview(null);

    alert(editingImage ? 'Image updated successfully!' : 'Image added successfully!');
    
    // Log activity
    try {
      await logActivity({
        type: editingImage ? '🖼️ Image Update' : '🖼️ Image Added',
        description: editingImage ? `Updated image: ${formData.title}` : `Added new image: ${formData.title}`
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  // Handle crop submission
  const handleCropSubmit = async (e) => {
    e.preventDefault();

    if (!cropFormData.name || !cropFormData.category || !cropFormData.season || !cropFormData.waterRequirement || !cropFormData.fertilizerType) {
      alert('Please fill in all crop details');
      return;
    }

    if (editingCrop) {
      // Update existing crop
      const updatedCrop = {
        ...editingCrop,
        name: cropFormData.name,
        category: cropFormData.category,
        season: cropFormData.season,
        waterRequirement: cropFormData.waterRequirement,
        fertilizerType: cropFormData.fertilizerType
      };

      const updatedCrops = updateCrop(updatedCrop);
      setCrops(updatedCrops);
      setEditingCrop(null);
    } else {
      // Create new crop
      const newCrop = {
        name: cropFormData.name,
        category: cropFormData.category,
        season: cropFormData.season,
        waterRequirement: cropFormData.waterRequirement,
        fertilizerType: cropFormData.fertilizerType
      };

      const updatedCrops = addCrop(newCrop);
      setCrops(updatedCrops);
    }

    // Reset form
    setCropFormData({
      name: '',
      category: '',
      season: '',
      waterRequirement: '',
      fertilizerType: ''
    });

    alert(editingCrop ? 'Crop updated successfully!' : 'Crop added successfully!');
    
    // Log activity
    try {
      await logActivity({
        type: editingCrop ? '🌾 Crop Update' : '🌾 Crop Added',
        description: editingCrop ? `Updated crop: ${cropFormData.name}` : `Added new crop: ${cropFormData.name}`
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  // Handle form input changes for images
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Edit an image
  const handleEditImage = (image) => {
    setEditingImage(image);
    setFormData({
      title: image.title,
      description: image.description,
      image: null,
      alt: image.alt
    });
    setPreview(image.image);
    setActiveTab('add-image');
  };

  // Edit a crop
  const handleEditCrop = (crop) => {
    setEditingCrop(crop);
    setCropFormData({
      name: crop.name,
      category: crop.category,
      season: crop.season,
      waterRequirement: crop.waterRequirement,
      fertilizerType: crop.fertilizerType
    });
    setActiveTab('add-crop');
  };

  // Delete an image
  const handleDeleteImage = (id) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      const updatedImages = deleteCarouselImage(id);
      setImages(updatedImages);
    }
  };

  // Delete a crop
  const handleDeleteCrop = (id) => {
    if (window.confirm('Are you sure you want to delete this crop?')) {
      const updatedCrops = deleteCrop(id);
      setCrops(updatedCrops);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingImage(null);
    setEditingCrop(null);
    setFormData({
      title: '',
      description: '',
      image: null,
      alt: ''
    });
    setCropFormData({
      name: '',
      category: '',
      season: '',
      waterRequirement: '',
      fertilizerType: ''
    });
    setPreview(null);
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-container">
        {/* Overlay for mobile when sidebar is open */}
        {isSidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setIsSidebarOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 99,
              backdropFilter: 'blur(3px)'
            }}
          />
        )}
        <div className={`admin-sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
          <h2>AgriSense Admin</h2>
          <div className="admin-user-profile" style={{ padding: '0 0 1.5rem 0', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🧑‍🌾</div>
            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Welcome, {adminCreds.username}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>System Administrator</div>
          </div>
          <nav className="admin-nav">
            <button
              className={`admin-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('dashboard');
                setIsSidebarOpen(false);
              }}
            >
              <span>📊</span> Dashboard
            </button>
            <div className="nav-section-label" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', margin: '0.5rem 0 0.25rem 0.5rem' }}>Content Management</div>
            <button
              className={`admin-nav-btn ${activeTab === 'images' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('images');
                setIsSidebarOpen(false);
              }}
            >
              <span>🖼️</span> Gallery
            </button>
            <button
              className={`admin-nav-btn ${activeTab === 'add-image' || activeTab === 'edit-image' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('add-image');
                setIsSidebarOpen(false);
                setEditingImage(null);
                setFormData({
                  title: '',
                  description: '',
                  image: null,
                  alt: ''
                });
                setPreview(null);
              }}
            >
              <span>➕</span> {editingImage ? 'Edit Slider' : 'Add Photos'}
            </button>
            <button
              className={`admin-nav-btn ${activeTab === 'crops' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('crops');
                setIsSidebarOpen(false);
              }}
            >
              <span>🌾</span> Crop Database
            </button>
            <button
              className={`admin-nav-btn ${activeTab === 'add-crop' || activeTab === 'edit-crop' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('add-crop');
                setIsSidebarOpen(false);
                setEditingCrop(null);
                setCropFormData({
                  name: '',
                  category: '',
                  season: '',
                  waterRequirement: '',
                  fertilizerType: ''
                });
              }}
            >
              <span>🌱</span> {editingCrop ? 'Update Crop' : 'New Crop'}
            </button>
            <div className="nav-section-label" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', margin: '0.5rem 0 0.25rem 0.5rem' }}>Configuration</div>
            <button
              className={`admin-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('settings');
                setIsSidebarOpen(false);
              }}
            >
              <span>⚙️</span> Settings
            </button>
            <button
              className="admin-nav-btn logout-btn"
              onClick={handleLogout}
              style={{ marginTop: '2rem' }}
            >
              <span>🚪</span> Logout
            </button>
          </nav>
        </div>

        <div className="admin-content">
          <header className="admin-content-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                className="admin-hamburger"
                onClick={toggleSidebar}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  display: 'none', // Hidden by default, shown via CSS on mobile
                  color: 'var(--primary-color)'
                }}
              >
                ☰
              </button>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--primary-color)' }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
                <p style={{ margin: '0.25rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>Manage your platform settings and content</p>
              </div>
            </div>
            <div className="admin-date" style={{ textAlign: 'right', fontSize: '0.85rem', color: '#888' }}>
              <div>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
          </header>

          {activeTab === 'dashboard' && (
            <div className="admin-dashboard-content">
              <div className="admin-stats">
                <div className="stat-card">
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🖼️</div>
                  <h3>Total Images</h3>
                  <p>{images.length}</p>
                </div>
                <div className="stat-card">
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌾</div>
                  <h3>Total Crops</h3>
                  <p>{crops.length}</p>
                </div>
                <div className="stat-card">
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛡️</div>
                  <h3>System Status</h3>
                  <p className="status-active" style={{ fontSize: '1.2rem', color: '#4caf50' }}>● Operational</p>
                </div>
              </div>

              <div className="recent-activity" style={{ background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.2rem' }}>
                  <span>🕒</span> Recent Platform Activity
                </h2>
                <div className="activity-list">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity) => (
                      <div key={activity._id || activity.id} className="activity-item">
                        <span className="activity-type">{activity.type}</span>
                        <span className="activity-description">{activity.description}</span>
                        <span className="activity-time">
                          {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : activity.time}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="activity-item">
                      <span className="activity-type">📋</span>
                      <span className="activity-description">No recent activity</span>
                      <span className="activity-time">-</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'images' && (
            <div className="manage-images">
              <div className="images-grid">
                {images.map((image) => (
                  <div key={image.id} className="image-card">
                    <img src={image.image} alt={image.alt} />
                    <div className="image-info">
                      <h3>{image.title}</h3>
                      <p>{image.description}</p>
                      <div className="image-actions">
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleEditImage(image)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteImage(image.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'add-image' && (
            <div className="add-image">
              <form onSubmit={handleImageSubmit} className="add-image-form">
                <div className="form-group">
                  <label htmlFor="title">Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows="4"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="image">Image {editingImage ? '(Optional - leave blank to keep current image)' : ' *'}</label>
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    required={!editingImage}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="alt">Alt Text</label>
                  <input
                    type="text"
                    id="alt"
                    name="alt"
                    value={formData.alt}
                    onChange={handleInputChange}
                  />
                </div>

                {preview && (
                  <div className="image-preview">
                    <h3>Preview:</h3>
                    <img src={preview} alt="Preview" style={{ maxWidth: '300px', maxHeight: '200px' }} />
                  </div>
                )}

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    {editingImage ? 'Update Image' : 'Add Image'}
                  </button>
                  {editingImage && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {activeTab === 'crops' && (
            <div className="manage-crops">
              <div className="crops-grid">
                {crops.map((crop) => (
                  <div key={crop.id} className="crop-card">
                    <div className="crop-info">
                      <h3>{crop.name}</h3>
                      <p><strong>Category:</strong> {crop.category}</p>
                      <p><strong>Season:</strong> {crop.season}</p>
                      <p><strong>Water Requirement:</strong> {crop.waterRequirement}</p>
                      <p><strong>Fertilizer Type:</strong> {crop.fertilizerType}</p>
                      <div className="crop-actions">
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleEditCrop(crop)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteCrop(crop.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'add-crop' && (
            <div className="add-crop">
              <form onSubmit={handleCropSubmit} className="add-crop-form">
                <div className="form-group">
                  <label htmlFor="name">Crop Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={cropFormData.name}
                    onChange={handleCropChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="category">Category *</label>
                  <select
                    id="category"
                    name="category"
                    value={cropFormData.category}
                    onChange={handleCropChange}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Cereal">Cereal</option>
                    <option value="Pulse">Pulse</option>
                    <option value="Oilseed">Oilseed</option>
                    <option value="Cash Crop">Cash Crop</option>
                    <option value="Vegetable">Vegetable</option>
                    <option value="Fruit">Fruit</option>
                    <option value="Spice">Spice</option>
                    <option value="Flower">Flower</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="season">Season *</label>
                  <select
                    id="season"
                    name="season"
                    value={cropFormData.season}
                    onChange={handleCropChange}
                    required
                  >
                    <option value="">Select Season</option>
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                    <option value="Autumn">Autumn</option>
                    <option value="Winter">Winter</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="waterRequirement">Water Requirement *</label>
                  <select
                    id="waterRequirement"
                    name="waterRequirement"
                    value={cropFormData.waterRequirement}
                    onChange={handleCropChange}
                    required
                  >
                    <option value="">Select Water Requirement</option>
                    <option value="Very Low">Very Low</option>
                    <option value="Low">Low</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                    <option value="Very High">Very High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="fertilizerType">Recommended Fertilizer Type *</label>
                  <input
                    type="text"
                    id="fertilizerType"
                    name="fertilizerType"
                    value={cropFormData.fertilizerType}
                    onChange={handleCropChange}
                    required
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    {editingCrop ? 'Update Crop' : 'Add Crop'}
                  </button>
                  {editingCrop && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCancelEdit}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="admin-settings">
              <div className="settings-section" style={{ background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🌐</span> General Platform Configuration
                </h2>
                <div className="settings-form">
                  <div className="form-group">
                    <label>Application Name</label>
                    <input type="text" defaultValue="AgriSense" style={{ background: '#f9f9f9' }} />
                  </div>
                  <div className="form-group">
                    <label>Platform Tagline</label>
                    <textarea rows="2" style={{ background: '#f9f9f9' }}>AI-powered agricultural solutions for modern farmers</textarea>
                  </div>
                  <div className="form-group">
                    <label>Contact Email (for notifications)</label>
                    <input type="email" defaultValue="admin@agrisense.com" style={{ background: '#f9f9f9' }} />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                    <label style={{ margin: 0 }}>Maintenance Mode</label>
                    <div style={{ position: 'relative', width: '40px', height: '20px', background: '#ccc', borderRadius: '10px', cursor: 'pointer' }}>
                      <div style={{ position: 'absolute', left: '2px', top: '2px', width: '16px', height: '16px', background: '#fff', borderRadius: '50%' }}></div>
                    </div>
                  </div>
                  <button className="btn btn-primary" style={{ marginTop: '1rem' }}>Apply Global Changes</button>
                </div>
              </div>

              <div className="settings-section" style={{ background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📞</span> Public Contact Details
                </h2>
                <form onSubmit={updateContactSettings} className="settings-form">
                  <div className="form-group">
                    <label>Public Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={contactInfo.email}
                      onChange={handleContactChange}
                      style={{ background: '#f9f9f9' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Public Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={contactInfo.phone}
                      onChange={handleContactChange}
                      style={{ background: '#f9f9f9' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Office Address</label>
                    <textarea
                      name="address"
                      rows="2"
                      value={contactInfo.address}
                      onChange={handleContactChange}
                      style={{ background: '#f9f9f9' }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Update Footer Info</button>
                </form>
              </div>

              <div className="settings-section" style={{ background: '#fff', padding: '2rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🔒</span> Security & Authentication
                </h2>
                <form onSubmit={updateCredentials}>
                  <div className="form-group">
                    <label>New Administrative Username</label>
                    <input
                      type="text"
                      name="newUsername"
                      value={credsForm.newUsername}
                      onChange={handleCredsChange}
                      required
                      style={{ background: '#f9f9f9' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>New Password</label>
                    <div className="password-input">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        name="newPassword"
                        value={credsForm.newPassword}
                        onChange={handleCredsChange}
                        placeholder="Leave blank to keep current"
                        required
                        style={{ background: '#f9f9f9' }}
                      />
                      <span 
                        className="password-toggle"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        <span className={showNewPassword ? 'eye-open' : 'eye-closed'}></span>
                      </span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Confirm Password</label>
                    <div className="password-input">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={credsForm.confirmPassword}
                        onChange={handleCredsChange}
                        required
                        style={{ background: '#f9f9f9' }}
                      />
                      <span 
                        className="password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <span className={showConfirmPassword ? 'eye-open' : 'eye-closed'}></span>
                      </span>
                    </div>
                  </div>
                  <button type="submit" className="btn btn-secondary" style={{ marginTop: '1rem' }}>Securely Update Credentials</button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;