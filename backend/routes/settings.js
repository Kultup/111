const express = require('express');
const SystemSettings = require('../models/SystemSettings');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/settings
// @desc    Отримати налаштування системи
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const settings = await SystemSettings.getSettings();
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Помилка при отриманні налаштувань',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   PUT /api/settings
// @desc    Оновити налаштування системи
// @access  Private/Admin
router.put('/', protect, authorize('admin'), async (req, res) => {
  try {
    const {
      dailyTestTime,
      testDeadline,
      coinsPerCorrectAnswer,
      coinsPerTestCompletion,
      loginMinLength,
      loginMaxLength,
      loginPattern,
      maxFileSize,
      reminderTime1,
      reminderTime2,
      systemName,
      systemDescription
    } = req.body;

    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings({});
    }

    // Оновити тільки передані поля
    if (dailyTestTime !== undefined) settings.dailyTestTime = dailyTestTime;
    if (testDeadline !== undefined) settings.testDeadline = testDeadline;
    if (coinsPerCorrectAnswer !== undefined) settings.coinsPerCorrectAnswer = coinsPerCorrectAnswer;
    if (coinsPerTestCompletion !== undefined) settings.coinsPerTestCompletion = coinsPerTestCompletion;
    if (loginMinLength !== undefined) settings.loginMinLength = loginMinLength;
    if (loginMaxLength !== undefined) settings.loginMaxLength = loginMaxLength;
    if (loginPattern !== undefined) settings.loginPattern = loginPattern;
    if (maxFileSize !== undefined) settings.maxFileSize = maxFileSize;
    if (reminderTime1 !== undefined) settings.reminderTime1 = reminderTime1;
    if (reminderTime2 !== undefined) settings.reminderTime2 = reminderTime2;
    if (systemName !== undefined) settings.systemName = systemName;
    if (systemDescription !== undefined) settings.systemDescription = systemDescription;

    await settings.save();

    res.json({
      success: true,
      message: 'Налаштування успішно оновлено',
      data: settings
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Помилка при оновленні налаштувань'
    });
  }
});

module.exports = router;

