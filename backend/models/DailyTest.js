const mongoose = require('mongoose');

const questionAnswerSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  userAnswer: {
    type: Number, // Індекс вибраної відповіді
    default: null
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  answeredAt: {
    type: Date,
    default: null
  }
});

const dailyTestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  questions: {
    type: [questionAnswerSchema],
    required: true,
    validate: {
      validator: function(questions) {
        // Тест має містити рівно 5 питань
        return questions.length === 5;
      },
      message: 'Щоденний тест має містити рівно 5 питань'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'expired'],
    default: 'pending'
  },
  deadline: {
    type: Date,
    required: true
  },
  completedAt: {
    type: Date,
    default: null
  },
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  coinsEarned: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Індекси
dailyTestSchema.index({ user: 1, date: 1 });
dailyTestSchema.index({ status: 1 });
dailyTestSchema.index({ deadline: 1 });

// Метод для перевірки чи тест не прострочений
dailyTestSchema.methods.isExpired = function() {
  return new Date() > this.deadline;
};

// Метод для підрахунку балів
dailyTestSchema.methods.calculateScore = function() {
  const correctAnswers = this.questions.filter(q => q.isCorrect).length;
  this.score = correctAnswers;
  return correctAnswers;
};

module.exports = mongoose.model('DailyTest', dailyTestSchema);

