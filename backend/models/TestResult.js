const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DailyTest',
    required: true
  },
  answers: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    selectedAnswer: {
      type: Number,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    answeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalScore: {
    type: Number,
    required: true,
    min: 0,
    max: 5
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  coinsEarned: {
    type: Number,
    default: 0
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Індекси
testResultSchema.index({ user: 1, completedAt: -1 });
testResultSchema.index({ test: 1 });

module.exports = mongoose.model('TestResult', testResultSchema);

