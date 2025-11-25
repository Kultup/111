const express = require('express');
const Feedback = require('../models/Feedback');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// @route   POST /api/feedback
// @desc    Створити зворотний зв'язок
// @access  Public (може бути анонімним)
router.post('/', upload.array('attachments', 5), async (req, res) => {
  try {
    const { type, subject, message, userId } = req.body;

    if (!type || !message) {
      return res.status(400).json({
        success: false,
        message: 'Тип та повідомлення обов\'язкові'
      });
    }

    // Обробка завантажених файлів
    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        attachments.push(`/uploads/images/${file.filename}`);
      });
    }

    const feedback = await Feedback.create({
      user: userId || null, // Може бути анонімним
      type,
      subject,
      message,
      attachments
    });

    res.status(201).json({
      success: true,
      message: 'Зворотний зв\'язок успішно відправлено',
      data: feedback
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при відправці зворотного зв\'язку'
    });
  }
});

// @route   GET /api/feedback
// @desc    Отримати список зворотного зв'язку
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { type, status, priority, page = 1, limit = 20, search } = req.query;
    const query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    
    // Пошук по темі або повідомленню
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const feedbacks = await Feedback.find(query)
      .populate('user', 'firstName lastName login')
      .populate('response.respondedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments(query);

    res.json({
      success: true,
      count: feedbacks.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: feedbacks
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні зворотного зв\'язку'
    });
  }
});

// @route   GET /api/feedback/user
// @desc    Отримати зворотний зв'язок користувача
// @access  Private
router.get('/user', protect, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ user: req.user._id })
      .populate('response.respondedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: feedbacks.length,
      data: feedbacks
    });
  } catch (error) {
    console.error('Get user feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні зворотного зв\'язку'
    });
  }
});

// @route   GET /api/feedback/stats
// @desc    Отримати статистику звернень
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
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

    // Кількість звернень по типах
    const byType = await Feedback.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Кількість звернень по статусах
    const byStatus = await Feedback.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Середній час відповіді (для звернень з відповіддю)
    const avgResponseTime = await Feedback.aggregate([
      {
        $match: {
          ...query,
          'response.respondedAt': { $exists: true, $ne: null }
        }
      },
      {
        $project: {
          responseTime: {
            $subtract: ['$response.respondedAt', '$createdAt']
          }
        }
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: '$responseTime' }
        }
      }
    ]);

    const avgResponseTimeMs = avgResponseTime.length > 0 ? avgResponseTime[0].avgTime : 0;
    const avgResponseTimeHours = avgResponseTimeMs / (1000 * 60 * 60);
    const avgResponseTimeDays = avgResponseTimeHours / 24;

    // Найчастіші проблеми (по темах/subject)
    const commonIssues = await Feedback.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 },
          types: { $addToSet: '$type' },
          statuses: { $addToSet: '$status' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $project: {
          subject: '$_id',
          count: 1,
          types: 1,
          statuses: 1,
          _id: 0
        }
      }
    ]);

    // Статистика по періодах (по днях)
    const startDateObj = startDate ? new Date(startDate) : new Date();
    startDateObj.setDate(startDateObj.getDate() - 30); // Останні 30 днів за замовчуванням
    startDateObj.setHours(0, 0, 0, 0);
    
    const endDateObj = endDate ? new Date(endDate) : new Date();
    endDateObj.setHours(23, 59, 59, 999);

    const dailyStats = await Feedback.aggregate([
      {
        $match: {
          createdAt: { $gte: startDateObj, $lte: endDateObj }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          byType: {
            $push: '$type'
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Підрахунок по типах для кожного дня
    const dailyStatsWithTypes = dailyStats.map(day => {
      const typeCounts = {};
      day.byType.forEach(type => {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      return {
        date: day._id,
        total: day.count,
        byType: typeCounts
      };
    });

    res.json({
      success: true,
      data: {
        byType: byType.map(item => ({
          type: item._id,
          count: item.count
        })),
        byStatus: byStatus.map(item => ({
          status: item._id,
          count: item.count
        })),
        avgResponseTime: {
          hours: avgResponseTimeHours.toFixed(2),
          days: avgResponseTimeDays.toFixed(2)
        },
        commonIssues: commonIssues.map(issue => ({
          subject: issue.subject || 'Без теми',
          count: issue.count,
          types: issue.types,
          statuses: issue.statuses
        })),
        dailyStats: dailyStatsWithTypes
      }
    });
  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні статистики звернень'
    });
  }
});

// @route   GET /api/feedback/:id
// @desc    Отримати зворотний зв'язок по ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('user', 'firstName lastName login')
      .populate('response.respondedBy', 'firstName lastName');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Зворотний зв\'язок не знайдено'
      });
    }

    // Користувач може переглядати тільки свій зворотний зв'язок, адмін - будь-який
    if (req.user.role !== 'admin' && feedback.user && feedback.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Немає доступу до цього ресурсу'
      });
    }

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні зворотного зв\'язку'
    });
  }
});

// @route   PUT /api/feedback/:id
// @desc    Оновити зворотний зв'язок (статус, пріоритет, відповідь)
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, priority, response } = req.body;

    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Зворотний зв\'язок не знайдено'
      });
    }

    if (status) feedback.status = status;
    if (priority) feedback.priority = priority;
    if (response) {
      feedback.response = {
        text: response.text,
        respondedBy: req.user._id,
        respondedAt: new Date()
      };
    }

    await feedback.save();

    await feedback.populate('user', 'firstName lastName login');
    await feedback.populate('response.respondedBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Зворотний зв\'язок успішно оновлено',
      data: feedback
    });
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при оновленні зворотного зв\'язку'
    });
  }
});

// @route   DELETE /api/feedback/:id
// @desc    Видалити зворотний зв'язок
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Зворотний зв\'язок не знайдено'
      });
    }

    await feedback.deleteOne();

    res.json({
      success: true,
      message: 'Зворотний зв\'язок успішно видалено'
    });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при видаленні зворотного зв\'язку'
    });
  }
});

module.exports = router;

