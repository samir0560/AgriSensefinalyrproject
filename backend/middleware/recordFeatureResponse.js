const { FeatureResponse } = require('../models/FeatureResponse');
const {
  cloneLimited,
  buildRequestSnapshot,
  shouldPersistResponse
} = require('../utils/featureResponseUtils');

function recordFeatureResponse(featureType) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      const statusCode = res.statusCode;
      if (req.userId && shouldPersistResponse(statusCode, body)) {
        const request = buildRequestSnapshot(req);
        const responsePayload = typeof body === 'object' && body !== null ? body : { value: body };
        FeatureResponse.create({
          user: req.userId,
          featureType,
          request,
          response: cloneLimited(responsePayload)
        }).catch((err) => console.error('FeatureResponse persist failed:', err));
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = { recordFeatureResponse };
