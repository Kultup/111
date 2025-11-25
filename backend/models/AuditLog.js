const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'create', 'update', 'delete', 'approve', 'reject',
      'login', 'logout', 'export', 'import', 'bulk_operation',
      'settings_change', 'manual_coins', 'block_user', 'unblock_user'
    ]
  },
  entity: {
    type: String,
    required: true,
    enum: [
      'user', 'question', 'category', 'city', 'position',
      'achievement', 'shop_item', 'purchase', 'coin_transaction',
      'knowledge_base', 'feedback', 'daily_test', 'settings'
    ]
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  description: {
    type: String,
    required: true
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: null // Зберігаємо зміни (old -> new)
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Індекси для швидкого пошуку
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

