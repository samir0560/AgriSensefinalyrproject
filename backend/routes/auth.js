const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  logClientFeatureResult,
  getMyFeatureResponses
} = require('../controllers/authController');
const { protectUser } = require('../middleware/authUser');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protectUser, getMe);
router.put('/profile', protectUser, updateProfile);
router.post('/feature-log', protectUser, logClientFeatureResult);
router.get('/feature-responses', protectUser, getMyFeatureResponses);

module.exports = router;
