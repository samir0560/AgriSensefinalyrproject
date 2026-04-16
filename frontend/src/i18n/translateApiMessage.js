/**
 * Map English API error/success strings from backend to i18n keys.
 */
const API_MESSAGE_TO_KEY = {
  'Email and password are required': 'apiMsgEmailPasswordRequired',
  'Name is required (at least 2 characters)': 'apiMsgNameRequiredShort',
  'Password must be at least 6 characters': 'apiMsgPasswordMin6',
  'An account with this email already exists': 'apiMsgAccountExists',
  'Server error during registration': 'apiMsgServerErrorRegister',
  'Invalid email or password': 'apiMsgInvalidCredentials',
  'Server error during login': 'apiMsgServerErrorLogin',
  'User not found': 'apiMsgUserNotFound',
  'Server error': 'apiMsgServerError',
  'Email is required': 'apiMsgEmailRequired',
  'Current password is required to set a new password': 'apiMsgCurrentPasswordRequiredForNew',
  'Current password is incorrect': 'apiMsgCurrentPasswordIncorrect',
  'New password must be at least 6 characters': 'apiMsgNewPasswordMin6',
  'That email is already in use': 'apiMsgEmailInUse',
  'Server error while updating profile': 'apiMsgServerErrorProfileUpdate',
  'Account created': 'apiMsgAccountCreated',
  'Login successful': 'apiMsgLoginSuccessful',
  'Profile updated': 'apiMsgProfileUpdated',
  'Login failed': 'apiMsgLoginFailed',
  'Registration failed': 'apiMsgRegistrationFailed',
};

export function translateApiMessage(message, t) {
  if (message == null || typeof message !== 'string') return '';
  const key = API_MESSAGE_TO_KEY[message.trim()];
  if (key) return t(key);
  return message;
}
