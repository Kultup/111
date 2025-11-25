const mongoose = require('mongoose');

const knowledgeBaseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Заголовок статті обов\'язковий'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Контент статті обов\'язковий'],
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Категорія обов\'язкова']
  },
  image: {
    type: String, // URL або шлях до зображення
    default: null
  },
  tags: [{
    type: String,
    trim: true
  }],
  views: {
    type: Number,
    default: 0
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

knowledgeBaseSchema.index({ category: 1 });
knowledgeBaseSchema.index({ title: 'text', content: 'text' }); // Text search
knowledgeBaseSchema.index({ isActive: 1 });
knowledgeBaseSchema.index({ tags: 1 });
knowledgeBaseSchema.index({ positions: 1 });

module.exports = mongoose.model('KnowledgeBase', knowledgeBaseSchema);

