const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  // Налаштування тестів
  dailyTestTime: {
    type: String,
    default: '12:00',
    validate: {
      validator: function(v) {
        if (!v) return true; // Дозволити порожнє значення
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Невірний формат часу (HH:MM)'
    }
  },
  testDeadline: {
    type: String,
    default: '00:00',
    validate: {
      validator: function(v) {
        if (!v) return true; // Дозволити порожнє значення
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Невірний формат часу (HH:MM)'
    }
  },
  
  // Налаштування монет
  coinsPerCorrectAnswer: {
    type: Number,
    default: 10,
    min: 0
  },
  coinsPerTestCompletion: {
    type: Number,
    default: 50,
    min: 0
  },
  
  // Налаштування валідації логіну
  loginMinLength: {
    type: Number,
    default: 3,
    min: 3,
    max: 30
  },
  loginMaxLength: {
    type: Number,
    default: 30,
    min: 3,
    max: 30
  },
  loginPattern: {
    type: String,
    default: '^[a-zA-Z0-9_]+$',
    // Паттерн для валідації логіну
  },
  
  // Інші налаштування
  maxFileSize: {
    type: Number,
    default: 5242880, // 5MB в байтах
    min: 0
  },
  
  // Нагадування
  reminderTime1: {
    type: String,
    default: '16:00',
    validate: {
      validator: function(v) {
        if (!v) return true; // Дозволити порожнє значення
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Невірний формат часу (HH:MM)'
    }
  },
  reminderTime2: {
    type: String,
    default: '19:00',
    validate: {
      validator: function(v) {
        if (!v) return true; // Дозволити порожнє значення
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Невірний формат часу (HH:MM)'
    }
  },
  
  // Системні налаштування
  systemName: {
    type: String,
    default: 'Навчальна система "Країна Мрій"'
  },
  systemDescription: {
    type: String,
    default: 'Система навчання та тестування персоналу'
  },
  
  // Налаштування бази знань
  knowledgeBaseAccess: {
    type: String,
    enum: ['open', 'closed', 'position-based'],
    default: 'open'
  }
}, {
  timestamps: true
});

// Завжди буде тільки один документ налаштувань
systemSettingsSchema.statics.getSettings = async function() {
  try {
    let settings = await this.findOne();
    if (!settings) {
      settings = await this.create({});
    }
    return settings;
  } catch (error) {
    console.error('Error in getSettings:', error);
    // Якщо помилка при створенні, спробувати знайти існуючий
    const existing = await this.findOne();
    if (existing) {
      return existing;
    }
    // Якщо нічого не знайдено, повернути дефолтні значення
    return new this({});
  }
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);

