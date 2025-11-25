const express = require('express');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/audit-logs
// @desc    Отримати логі дій адміністраторів
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      userId,
      action,
      entity,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const query = {};

    if (userId) query.user = userId;
    if (action) query.action = action;
    if (entity) query.entity = entity;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const skip = (page - 1) * limit;

    const logs = await AuditLog.find(query)
      .populate('user', 'firstName lastName login')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: logs
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні логів'
    });
  }
});

// @route   GET /api/audit-logs/suspicious
// @desc    Отримати підозрілі дії
// @access  Private/Admin
router.get('/suspicious', protect, authorize('admin'), async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const suspiciousActivities = [];

    // 1. Масові операції за короткий час (більше 10 операцій за 5 хвилин)
    const bulkOperations = await AuditLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          action: { $in: ['delete', 'bulk_operation', 'bulk_delete', 'bulk_update'] }
        }
      },
      {
        $group: {
          _id: {
            user: '$user',
            hour: { $hour: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 },
          actions: { $push: '$$ROOT' }
        }
      },
      {
        $match: { count: { $gte: 10 } }
      }
    ]);

    for (const op of bulkOperations) {
      const User = require('../models/User');
      const user = await User.findById(op._id.user).select('firstName lastName login');
      suspiciousActivities.push({
        type: 'mass_operations',
        severity: 'high',
        description: `Масові операції: ${op.count} операцій за короткий період`,
        user: user ? { id: user._id, name: `${user.firstName} ${user.lastName}`, login: user.login } : null,
        count: op.count,
        timestamp: op.actions[0].createdAt,
        details: op.actions.map(a => ({ action: a.action, entity: a.entity, description: a.description }))
      });
    }

    // 2. Видалення великої кількості даних
    const deletions = await AuditLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          action: 'delete'
        }
      },
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 },
          entities: { $addToSet: '$entity' }
        }
      },
      {
        $match: { count: { $gte: 5 } }
      }
    ]);

    for (const del of deletions) {
      const User = require('../models/User');
      const user = await User.findById(del._id).select('firstName lastName login');
      suspiciousActivities.push({
        type: 'mass_deletions',
        severity: 'high',
        description: `Масове видалення: ${del.count} записів`,
        user: user ? { id: user._id, name: `${user.firstName} ${user.lastName}`, login: user.login } : null,
        count: del.count,
        entities: del.entities,
        timestamp: startDate
      });
    }

    // 3. Зміни критичних налаштувань
    const criticalSettings = await AuditLog.find({
      createdAt: { $gte: startDate },
      entity: 'settings',
      action: 'update'
    }).populate('user', 'firstName lastName login').sort({ createdAt: -1 }).limit(20);

    for (const setting of criticalSettings) {
      suspiciousActivities.push({
        type: 'settings_change',
        severity: 'medium',
        description: `Зміна налаштувань системи: ${setting.description}`,
        user: setting.user ? { id: setting.user._id, name: `${setting.user.firstName} ${setting.user.lastName}`, login: setting.user.login } : null,
        timestamp: setting.createdAt,
        changes: setting.changes
      });
    }

    // 4. Дії в незвичний час (після 22:00 або до 6:00)
    // Спочатку отримуємо всі логи за період, потім фільтруємо по часу
    const allRecentActions = await AuditLog.find({
      createdAt: { $gte: startDate },
      action: { $in: ['delete', 'update', 'settings_change', 'manual_coins'] }
    }).populate('user', 'firstName lastName login').sort({ createdAt: -1 }).limit(200);

    const unusualTimeActions = allRecentActions.filter(log => {
      const hour = new Date(log.createdAt).getHours();
      return hour >= 22 || hour < 6;
    }).slice(0, 50); // Обмежуємо до 50 найновіших

    for (const action of unusualTimeActions) {
      const hour = new Date(action.createdAt).getHours();
      suspiciousActivities.push({
        type: 'unusual_time',
        severity: 'low',
        description: `Дія в незвичний час (${hour}:00): ${action.action}`,
        user: action.user ? { id: action.user._id, name: `${action.user.firstName} ${action.user.lastName}`, login: action.user.login } : null,
        timestamp: action.createdAt,
        action: action.action,
        entity: action.entity
      });
    }

    // 5. Ручні операції з монетами (великі суми)
    const coinTransactions = await AuditLog.find({
      createdAt: { $gte: startDate },
      action: 'manual_coins'
    }).populate('user', 'firstName lastName login').sort({ createdAt: -1 });

    for (const transaction of coinTransactions) {
      if (transaction.changes && transaction.changes.amount) {
        const amount = Math.abs(transaction.changes.amount);
        if (amount >= 1000) {
          suspiciousActivities.push({
            type: 'large_coin_operation',
            severity: 'medium',
            description: `Велика операція з монетами: ${amount} монет`,
            user: transaction.user ? { id: transaction.user._id, name: `${transaction.user.firstName} ${transaction.user.lastName}`, login: transaction.user.login } : null,
            timestamp: transaction.createdAt,
            amount: amount,
            changes: transaction.changes
          });
        }
      }
    }

    // Сортування за важливістю та датою
    const severityOrder = { high: 3, medium: 2, low: 1 };
    suspiciousActivities.sort((a, b) => {
      if (severityOrder[b.severity] !== severityOrder[a.severity]) {
        return severityOrder[b.severity] - severityOrder[a.severity];
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    res.json({
      success: true,
      count: suspiciousActivities.length,
      data: suspiciousActivities
    });
  } catch (error) {
    console.error('Get suspicious activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні підозрілих дій'
    });
  }
});

// @route   GET /api/audit-logs/stats
// @desc    Отримати статистику по логах
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchQuery = {};

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchQuery.createdAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchQuery.createdAt.$lte = end;
      }
    }

    // Статистика по типах дій
    const actionsStats = await AuditLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Статистика по типах сутностей
    const entitiesStats = await AuditLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$entity',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Статистика по адмінах
    const adminsStats = await AuditLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$user',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Заповнити інформацію про адмінів
    const User = require('../models/User');
    const adminsWithInfo = await Promise.all(
      adminsStats.map(async (stat) => {
        const user = await User.findById(stat._id).select('firstName lastName login');
        return {
          user: user ? {
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            login: user.login
          } : null,
          count: stat.count
        };
      })
    );

    // Статистика по днях
    const dailyStats = await AuditLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        actions: actionsStats,
        entities: entitiesStats,
        admins: adminsWithInfo,
        daily: dailyStats
      }
    });
  } catch (error) {
    console.error('Get audit logs stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні статистики логів'
    });
  }
});

module.exports = router;

