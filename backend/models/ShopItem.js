const mongoose = require('mongoose');

const shopItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Назва товару обов\'язкова'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Ціна обов\'язкова'],
    min: [0, 'Ціна не може бути від\'ємною']
  },
  type: {
    type: String,
    enum: ['physical', 'digital', 'service', 'badge', 'other'],
    default: 'other'
  },
  image: {
    type: String, // URL або шлях до зображення
    default: null
  },
  stock: {
    type: Number,
    default: -1 // -1 означає необмежена кількість
  },
  isActive: {
    type: Boolean,
    default: true
  },
  requiresApproval: {
    type: Boolean,
    default: true // Чи потрібне підтвердження адміна
  }
}, {
  timestamps: true
});

shopItemSchema.index({ type: 1 });
shopItemSchema.index({ isActive: 1 });
shopItemSchema.index({ price: 1 });

module.exports = mongoose.model('ShopItem', shopItemSchema);

