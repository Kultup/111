const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const DailyTest = require('../models/DailyTest');
const CoinTransaction = require('../models/CoinTransaction');
const Question = require('../models/Question');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Отримати список користувачів
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { search, city, position, role, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { login: { $regex: search, $options: 'i' } }
      ];
    }

    if (city) query.city = city;
    if (position) query.position = position;
    if (role) query.role = role;

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .populate('city position')
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    // Додати інформацію про непройдені питання для кожного користувача
    const usersWithQuestionStats = await Promise.all(users.map(async (user) => {
      const userObj = user.toObject();
      
      // Якщо немає посади, пропустити підрахунок
      if (!user.position) {
        userObj.remainingQuestions = null;
        return userObj;
      }

      // Підрахувати всі питання для посади користувача
      const totalQuestionsForPosition = await Question.countDocuments({
        isActive: true,
        positions: user.position._id
      });

      // Підрахувати скільки питань користувач вже пройшов
      const completedTests = await DailyTest.find({
        user: user._id,
        status: 'completed'
      }).select('questions.question');

      const answeredQuestionIds = new Set();
      completedTests.forEach(test => {
        test.questions.forEach(q => {
          if (q.question) {
            answeredQuestionIds.add(q.question.toString());
          }
        });
      });

      const answeredCount = answeredQuestionIds.size;
      const remainingCount = Math.max(0, totalQuestionsForPosition - answeredCount);

      userObj.remainingQuestions = {
        total: totalQuestionsForPosition,
        answered: answeredCount,
        remaining: remainingCount
      };

      return userObj;
    }));

    res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: usersWithQuestionStats
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні користувачів'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Отримати користувача по ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    // Користувач може переглядати тільки свій профіль, адмін - будь-який
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Немає доступу до цього ресурсу'
      });
    }

    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('city position');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Користувача не знайдено'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні користувача'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Оновити користувача
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    // Користувач може оновлювати тільки свій профіль, адмін - будь-який
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Немає доступу до цього ресурсу'
      });
    }

    const { firstName, lastName, city, position } = req.body;
    const updateData = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (city) updateData.city = city;
    if (position) updateData.position = position;

    // Тільки адмін може змінювати роль та активність
    if (req.user.role === 'admin') {
      if (req.body.role) updateData.role = req.body.role;
      if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password').populate('city position');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Користувача не знайдено'
      });
    }

    res.json({
      success: true,
      message: 'Користувача успішно оновлено',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при оновленні користувача'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Видалити користувача (адмін або сам користувач)
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    // Користувач може видалити тільки свій акаунт, адмін - будь-який
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Немає доступу до цього ресурсу'
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Користувача не знайдено'
      });
    }

    // Логування запиту на видалення (для аудиту)
    console.log(`User deletion request: ${user._id} by ${req.user._id} at ${new Date()}`);

    await user.deleteOne();

    res.json({
      success: true,
      message: 'Користувача успішно видалено'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при видаленні користувача'
    });
  }
});

// @route   POST /api/users/bulk-delete
// @desc    Масове видалення користувачів
// @access  Private/Admin
router.post('/bulk-delete', protect, authorize('admin'), async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Необхідно вказати масив ID користувачів'
      });
    }

    const result = await User.deleteMany({ _id: { $in: userIds } });

    res.json({
      success: true,
      message: `Успішно видалено ${result.deletedCount} користувачів`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete users error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при масовому видаленні користувачів'
    });
  }
});

// @route   POST /api/users/bulk-update
// @desc    Масове оновлення користувачів (блокування/розблокування)
// @access  Private/Admin
router.post('/bulk-update', protect, authorize('admin'), async (req, res) => {
  try {
    const { userIds, isActive } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Необхідно вказати масив ID користувачів'
      });
    }

    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Необхідно вказати значення isActive'
      });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: { isActive } }
    );

    res.json({
      success: true,
      message: `Успішно оновлено ${result.modifiedCount} користувачів`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update users error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при масовому оновленні користувачів'
    });
  }
});

// @route   GET /api/users/:id/detailed-stats
// @desc    Отримати детальну статистику користувача (графіки, категорії, активність)
// @access  Private/Admin
router.get('/:id/detailed-stats', protect, authorize('admin'), async (req, res) => {
  try {
    const userId = req.params.id;

    // Графік результатів тестів по днях (останні 30 днів)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);

    const dailyTestResults = await DailyTest.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          status: 'completed',
          completedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          count: { $sum: 1 },
          avgScore: { $avg: '$score' },
          totalCoins: { $sum: '$coinsEarned' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Статистика по категоріях питань
    const categoryStats = await DailyTest.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          status: 'completed'
        }
      },
      { $unwind: '$questions' },
      {
        $lookup: {
          from: 'questions',
          localField: 'questions.question',
          foreignField: '_id',
          as: 'questionData'
        }
      },
      { $unwind: '$questionData' },
      {
        $lookup: {
          from: 'categories',
          localField: 'questionData.category',
          foreignField: '_id',
          as: 'categoryData'
        }
      },
      { $unwind: '$categoryData' },
      {
        $group: {
          _id: '$categoryData._id',
          categoryName: { $first: '$categoryData.name' },
          totalQuestions: { $sum: 1 },
          correctAnswers: {
            $sum: { $cond: ['$questions.isCorrect', 1, 0] }
          }
        }
      },
      {
        $project: {
          category: { _id: '$_id', name: '$categoryName' },
          totalQuestions: 1,
          correctAnswers: 1,
          accuracy: {
            $cond: [
              { $eq: ['$totalQuestions', 0] },
              0,
              { $multiply: [{ $divide: ['$correctAnswers', '$totalQuestions'] }, 100] }
            ]
          }
        }
      },
      { $sort: { totalQuestions: -1 } }
    ]);

    // Графік змін балансу монет по днях
    const coinBalanceHistory = await CoinTransaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          status: 'approved'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          earned: {
            $sum: {
              $cond: [
                { $in: ['$type', ['earned', 'manual_add', 'refund']] },
                '$amount',
                0
              ]
            }
          },
          spent: {
            $sum: {
              $cond: [
                { $in: ['$type', ['spent', 'manual_subtract']] },
                '$amount',
                0
              ]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Обчислити баланс по днях (накопичувальний)
    let runningBalance = 0;
    const balanceChart = coinBalanceHistory.map(day => {
      runningBalance += day.earned - day.spent;
      return {
        date: day._id,
        earned: day.earned,
        spent: day.spent,
        balance: runningBalance
      };
    });

    // Серія успішних тестів (підряд)
    const completedTests = await DailyTest.find({
      user: userId,
      status: 'completed'
    })
      .sort({ completedAt: 1 })
      .select('score completedAt');

    let maxStreak = 0;
    let currentStreak = 0;
    completedTests.forEach(test => {
      if (test.score >= 3) { // Вважаємо успішним тест з балом >= 3
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    // Останні дії (останні 10 тестів)
    const recentActivity = await DailyTest.find({
      user: userId
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('status score completedAt createdAt');

    res.json({
      success: true,
      data: {
        testResultsByDay: dailyTestResults.map(day => ({
          date: day._id,
          count: day.count,
          avgScore: day.avgScore.toFixed(2),
          totalCoins: day.totalCoins
        })),
        categoryStats: categoryStats.map(stat => ({
          category: stat.category,
          totalQuestions: stat.totalQuestions,
          correctAnswers: stat.correctAnswers,
          accuracy: stat.accuracy.toFixed(2)
        })),
        coinBalanceHistory: balanceChart,
        maxStreak: maxStreak,
        currentStreak: currentStreak,
        recentActivity: recentActivity.map(activity => ({
          status: activity.status,
          score: activity.score,
          completedAt: activity.completedAt,
          createdAt: activity.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Get user detailed stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні детальної статистики користувача'
    });
  }
});

module.exports = router;

