const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Може бути анонімним
  },
  type: {
    type: String,
    enum: ['bug', 'feature', 'improvement', 'complaint', 'praise', 'other'],
    required: true
  },
  subject: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Повідомлення обов\'язкове'],
    trim: true
  },
  status: {
    type: String,
    enum: ['new', 'in_progress', 'resolved', 'closed'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  response: {
    text: {
      type: String,
      default: null
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    respondedAt: {
      type: Date,
      default: null
    }
  },
  attachments: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

feedbackSchema.index({ user: 1, createdAt: -1 });
feedbackSchema.index({ type: 1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ priority: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);

