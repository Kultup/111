const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { sendPushNotification } = require('../services/pushNotifications');

const router = express.Router();

// @route   POST /api/notifications/send
// @desc    Відправити сповіщення користувачам
// @access  Private/Admin
router.post('/send', protect, authorize('admin'), [
  body('title').trim().notEmpty().withMessage('Заголовок обов\'язковий'),
  body('message').trim().notEmpty().withMessage('Повідомлення обов\'язкове'),
  body('recipients').custom((value) => {
    if (!value || (value !== 'all' && value !== 'city' && value !== 'position' && value !== 'users')) {
      throw new Error('Невірний тип отримувачів');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Помилки валідації',
        errors: errors.array()
      });
    }

    const { title, message, recipients, cityId, positionId, userIds, data } = req.body;
    
    console.log('=== Send Notification Request ===');
    console.log('Title:', title);
    console.log('Message:', message);
    console.log('Recipients:', recipients);
    console.log('CityId:', cityId);
    console.log('PositionId:', positionId);
    console.log('UserIds:', userIds);
    console.log('UserIds type:', Array.isArray(userIds) ? 'array' : typeof userIds);
    console.log('UserIds length:', Array.isArray(userIds) ? userIds.length : 'not array');

    // Визначити список користувачів для відправки
    let users = [];
    
    if (recipients === 'all') {
      // Всі активні користувачі з push токенами
      users = await User.find({ 
        isActive: true,
        pushToken: { $exists: true, $ne: null }
      }).select('pushToken firstName lastName');
      console.log('Selected all users with tokens:', users.length);
    } else if (recipients === 'city' && cityId) {
      // Користувачі з конкретного міста
      users = await User.find({ 
        isActive: true,
        city: cityId,
        pushToken: { $exists: true, $ne: null }
      }).select('pushToken firstName lastName');
      console.log('Selected users from city:', cityId, 'Count:', users.length);
    } else if (recipients === 'position' && positionId) {
      // Користувачі з конкретної посади
      users = await User.find({ 
        isActive: true,
        position: positionId,
        pushToken: { $exists: true, $ne: null }
      }).select('pushToken firstName lastName');
      console.log('Selected users from position:', positionId, 'Count:', users.length);
    } else if (recipients === 'users') {
      // Конкретні користувачі
      if (!userIds) {
        return res.status(400).json({
          success: false,
          message: 'Не вказано список користувачів'
        });
      }
      
      // Переконатися що userIds є масивом
      const userIdsArray = Array.isArray(userIds) ? userIds : (userIds ? [userIds] : []);
      
      if (userIdsArray.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Не вибрано жодного користувача'
        });
      }
      
      console.log('Selected specific users:', userIdsArray.length, 'IDs:', userIdsArray);
      
      users = await User.find({ 
        _id: { $in: userIdsArray },
        isActive: true,
        pushToken: { $exists: true, $ne: null }
      }).select('pushToken firstName lastName');
      
      console.log('Found users with tokens:', users.length);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Не вказано параметри для вибору отримувачів'
      });
    }

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Не знайдено користувачів з push токенами для відправки'
      });
    }

    // Відправити сповіщення всім користувачам
    const results = {
      total: users.length,
      success: 0,
      failed: 0,
      errors: []
    };

    for (const user of users) {
      try {
        const result = await sendPushNotification(
          user.pushToken,
          title,
          message,
          data || {}
        );
        
        if (result.success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push({
            userId: user._id,
            userName: `${user.firstName} ${user.lastName}`,
            error: result.error || result.result?.message || 'Невідома помилка'
          });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          userId: user._id,
          userName: `${user.firstName} ${user.lastName}`,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Сповіщення відправлено: ${results.success} успішно, ${results.failed} помилок`,
      results
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при відправці сповіщень'
    });
  }
});

// @route   GET /api/notifications/stats
// @desc    Отримати статистику користувачів з push токенами
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ isActive: true });
    const usersWithTokens = await User.countDocuments({ 
      isActive: true,
      pushToken: { $exists: true, $ne: null }
    });
    
    // Статистика по містах
    const citiesStats = await User.aggregate([
      { $match: { isActive: true, pushToken: { $exists: true, $ne: null } } },
      { $group: { _id: '$city', count: { $sum: 1 } } }
    ]);

    // Статистика по посадах
    const positionsStats = await User.aggregate([
      { $match: { isActive: true, pushToken: { $exists: true, $ne: null } } },
      { $group: { _id: '$position', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        usersWithTokens,
        usersWithoutTokens: totalUsers - usersWithTokens,
        citiesStats,
        positionsStats
      }
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні статистики'
    });
  }
});

module.exports = router;

