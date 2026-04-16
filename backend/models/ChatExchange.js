const mongoose = require('mongoose');

const chatExchangeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userMessage: {
    type: String,
    required: true
  },
  botResponse: {
    type: String,
    required: true
  },
  locale: {
    type: String,
    default: 'en'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

chatExchangeSchema.index({ user: 1, createdAt: 1 });

module.exports = mongoose.model('ChatExchange', chatExchangeSchema);
