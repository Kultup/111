const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Текст відповіді обов\'язковий'],
    trim: true
  },
  isCorrect: {
    type: Boolean,
    default: false
  }
});

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Текст питання обов\'язковий'],
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Категорія обов\'язкова']
  },
  answers: {
    type: [answerSchema],
    required: true,
    validate: {
      validator: function(answers) {
        // Має бути мінімум 2 варіанти відповідей
        if (answers.length < 2) return false;
        // Має бути рівно одна правильна відповідь
        const correctAnswers = answers.filter(a => a.isCorrect);
        return correctAnswers.length === 1;
      },
      message: 'Питання має містити мінімум 2 варіанти відповідей та рівно одну правильну відповідь'
    }
  },
  explanation: {
    type: String,
    trim: true
  },
  image: {
    type: String, // Шлях до зображення
    default: null
  },
  difficulty: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  isActive: {
    type: Boolean,
    default: true
  },
  positions: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Position',
    required: [true, 'Необхідно вибрати хоча б одну посаду'],
    validate: {
      validator: function(positions) {
        return positions && positions.length > 0;
      },
      message: 'Необхідно вибрати хоча б одну посаду'
    }
  }
}, {
  timestamps: true
});

// Індекси
questionSchema.index({ category: 1 });
questionSchema.index({ isActive: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ positions: 1 });

module.exports = mongoose.model('Question', questionSchema);

