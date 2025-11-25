const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { generateDailyTestsForAllUsers } = require('../services/cronJobs');

const router = express.Router();

// @route   POST /api/cron/generate-tests
// @desc    Ручна генерація тестів для всіх користувачів (для тестування)
// @access  Private/Admin
router.post('/generate-tests', protect, authorize('admin'), async (req, res) => {
  try {
    await generateDailyTestsForAllUsers();
    
    res.json({
      success: true,
      message: 'Генерація тестів запущена'
    });
  } catch (error) {
    console.error('Manual test generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при генерації тестів'
    });
  }
});

module.exports = router;

