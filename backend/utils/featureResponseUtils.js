const MAX_JSON_LENGTH = 120000;

function cloneLimited(value) {
  try {
    const s = JSON.stringify(value);
    if (s.length <= MAX_JSON_LENGTH) {
      return JSON.parse(s);
    }
    return {
      _truncated: true,
      _originalLength: s.length,
      preview: JSON.parse(s.slice(0, MAX_JSON_LENGTH))
    };
  } catch {
    return { _error: 'unserializable' };
  }
}

function buildRequestSnapshot(req) {
  if (req.file) {
    return {
      body: req.body && typeof req.body === 'object' ? req.body : {},
      file: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    };
  }
  if (req.method === 'GET' || req.method === 'HEAD') {
    return { query: { ...req.query } };
  }
  const body = req.body;
  if (body && typeof body === 'object') {
    return { body: cloneLimited(body) };
  }
  return {};
}

function shouldPersistResponse(statusCode, body) {
  if (statusCode >= 400) return false;
  if (body && body.success === false) return false;
  return true;
}

module.exports = {
  cloneLimited,
  buildRequestSnapshot,
  shouldPersistResponse,
  MAX_JSON_LENGTH
};
