const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Назва ачівки обов\'язкова'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Опис ачівки обов\'язковий'],
    trim: true
  },
  icon: {
    type: String, // URL або шлях до іконки
    default: null
  },
  type: {
    type: String,
    enum: ['correct_answers', 'test_streak', 'total_tests', 'perfect_score', 'category_master', 'custom'],
    required: true
  },
  condition: {
    type: mongoose.Schema.Types.Mixed, // Гнучкі умови
    required: true
    // Приклади:
    // { correctAnswers: 100 } - 100 правильних відповідей
    // { streak: 7 } - 7 днів підряд
    // { totalTests: 30 } - 30 тестів
    // { perfectScore: 5 } - 5 тестів з ідеальним результатом
    // { category: 'categoryId', correctAnswers: 50 } - 50 правильних в категорії
  },
  reward: {
    coins: {
      type: Number,
      default: 0
    },
    title: {
      type: String,
      default: null
    }
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

achievementSchema.index({ type: 1 });
achievementSchema.index({ isActive: 1 });

module.exports = mongoose.model('Achievement', achievementSchema);

