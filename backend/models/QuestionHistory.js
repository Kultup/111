const mongoose = require('mongoose');

/**
 * Модель для історії питань, які користувач бачив
 * Зберігається навіть після скидання тестів
 */
const questionHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  // Зберігаємо коли користувач вперше побачив це питання
  firstSeenAt: {
    type: Date,
    default: Date.now
  },
  // Скільки разів користувач бачив це питання (для статистики)
  timesShown: {
    type: Number,
    default: 1
  },
  // Чи відповів користувач правильно хоча б раз
  everAnsweredCorrectly: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Індекс для швидкого пошуку питань користувача
questionHistorySchema.index({ user: 1, question: 1 }, { unique: true });

module.exports = mongoose.model('QuestionHistory', questionHistorySchema);

