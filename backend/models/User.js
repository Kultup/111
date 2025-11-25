const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Ім\'я обов\'язкове'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Прізвище обов\'язкове'],
    trim: true
  },
  login: {
    type: String,
    required: [true, 'Логін обов\'язковий'],
    unique: true,
    trim: true,
    minlength: [3, 'Логін має містити мінімум 3 символи'],
    maxlength: [30, 'Логін має містити максимум 30 символів'],
    match: [/^[a-zA-Z0-9_]+$/, 'Логін може містити тільки латинські літери, цифри та підкреслення']
  },
  password: {
    type: String,
    required: [true, 'Пароль обов\'язковий'],
    minlength: [6, 'Пароль має містити мінімум 6 символів'],
    select: false // Не повертати пароль при запитах
  },
  city: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: [true, 'Місто обов\'язкове']
  },
  position: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Position',
    required: [true, 'Посада обов\'язкова']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  coins: {
    type: Number,
    default: 0,
    min: 0
  },
  statistics: {
    totalTests: { type: Number, default: 0 },
    completedTests: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    totalAnswers: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  pushToken: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes
userSchema.index({ login: 1 });
userSchema.index({ city: 1 });
userSchema.index({ position: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);

