const mongoose = require('mongoose');

const positionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Назва посади обов\'язкова'],
    unique: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

positionSchema.index({ name: 1 });

module.exports = mongoose.model('Position', positionSchema);

