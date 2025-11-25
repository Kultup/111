const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const City = require('../models/City');
const Position = require('../models/Position');
const DailyTest = require('../models/DailyTest');
const CoinTransaction = require('../models/CoinTransaction');
const Question = require('../models/Question');
const Category = require('../models/Category');
const { protect, authorize } = require('../middleware/auth');
const { getUserPositionByPosition, getRatingByPosition } = require('../services/ratingService');

const router = express.Router();

// @route   GET /api/stats/rating
// @desc    Отримати рейтинг користувачів
// @access  Private
router.get('/rating', protect, async (req, res) => {
  try {
    const { position, city, startDate, endDate } = req.query;
    const query = { isActive: true };

    // Підтримка множинного вибору (через кому)
    if (position) {
      const positionIds = position.split(',').filter(Boolean);
      // Фільтруємо тільки валідні ObjectId
      const validPositionIds = positionIds.filter(id => mongoose.Types.ObjectId.isValid(id));
      
      if (validPositionIds.length === 0) {
        // Якщо немає валідних ObjectId, повертаємо порожній результат
        return res.json({
          success: true,
          data: []
        });
      }
      
      if (validPositionIds.length === 1) {
        query.position = validPositionIds[0];
      } else if (validPositionIds.length > 1) {
        query.position = { $in: validPositionIds };
      }
    }
    if (city) {
      const cityIds = city.split(',').filter(Boolean);
      // Фільтруємо тільки валідні ObjectId
      const validCityIds = cityIds.filter(id => mongoose.Types.ObjectId.isValid(id));
      
      if (validCityIds.length === 0) {
        // Якщо немає валідних ObjectId, повертаємо порожній результат
        return res.json({
          success: true,
          data: []
        });
      }
      
      if (validCityIds.length === 1) {
        query.city = validCityIds[0];
      } else if (validCityIds.length > 1) {
        query.city = { $in: validCityIds };
      }
    }
    
    // Фільтр по даті реєстрації (якщо потрібно)
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

    const users = await User.find(query)
      .select('firstName lastName statistics coins')
      .populate('position', 'name')
      .populate('city', 'name')
      .sort({ 'statistics.correctAnswers': -1, 'statistics.averageScore': -1 })
      .limit(100);

    const rating = users.map((user, index) => ({
      position: index + 1,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        position: user.position,
        city: user.city
      },
      statistics: {
        correctAnswers: user.statistics.correctAnswers || 0,
        completedTests: user.statistics.completedTests || 0,
        averageScore: user.statistics.averageScore || 0
      },
      coins: user.coins || 0
    }));

    res.json({
      success: true,
      count: rating.length,
      data: rating
    });
  } catch (error) {
    console.error('Get rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні рейтингу'
    });
  }
});

// @route   GET /api/stats/rating/position/:positionId
// @desc    Отримати рейтинг по посаді
// @access  Private
router.get('/rating/position/:positionId', protect, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const rating = await getRatingByPosition(req.params.positionId, parseInt(limit));

    res.json({
      success: true,
      count: rating.length,
      data: rating
    });
  } catch (error) {
    console.error('Get rating by position error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні рейтингу по посаді'
    });
  }
});

// @route   GET /api/stats/user/:id/position
// @desc    Отримати позицію користувача в рейтингу по посаді
// @access  Private
router.get('/user/:id/position', protect, async (req, res) => {
  try {
    // Користувач може переглядати тільки свою позицію, адмін - будь-яку
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Немає доступу до цього ресурсу'
      });
    }

    const ratingPosition = await getUserPositionByPosition(req.params.id);

    res.json({
      success: true,
      data: ratingPosition
    });
  } catch (error) {
    console.error('Get user position error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні позиції користувача'
    });
  }
});

// @route   GET /api/stats/by-cities
// @desc    Отримати статистику по містах
// @access  Private/Admin
router.get('/by-cities', protect, authorize('admin'), async (req, res) => {
  try {
    const cities = await City.find({ isActive: true });
    const stats = await Promise.all(
      cities.map(async (city) => {
        const users = await User.find({ city: city._id, isActive: true });
        const totalUsers = users.length;
        const totalTests = await DailyTest.countDocuments({
          user: { $in: users.map(u => u._id) },
          status: 'completed'
        });
        const totalCoins = users.reduce((sum, u) => sum + (u.coins || 0), 0);
        const avgScore = users.length > 0
          ? users.reduce((sum, u) => sum + (u.statistics?.averageScore || 0), 0) / users.length
          : 0;

        return {
          city: {
            _id: city._id,
            name: city.name
          },
          totalUsers,
          activeUsers: users.filter(u => u.isActive).length,
          totalTests,
          totalCoins,
          avgScore: avgScore.toFixed(2),
          avgTestsPerUser: totalUsers > 0 ? (totalTests / totalUsers).toFixed(2) : '0.00'
        };
      })
    );

    res.json({
      success: true,
      count: stats.length,
      data: stats
    });
  } catch (error) {
    console.error('Get stats by cities error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні статистики по містах'
    });
  }
});

// @route   GET /api/stats/by-positions
// @desc    Отримати статистику по посадах
// @access  Private/Admin
router.get('/by-positions', protect, authorize('admin'), async (req, res) => {
  try {
    const positions = await Position.find({ isActive: true });
    const stats = await Promise.all(
      positions.map(async (position) => {
        const users = await User.find({ position: position._id, isActive: true });
        const totalUsers = users.length;
        const totalTests = await DailyTest.countDocuments({
          user: { $in: users.map(u => u._id) },
          status: 'completed'
        });
        const totalCoins = users.reduce((sum, u) => sum + (u.coins || 0), 0);
        const avgScore = users.length > 0
          ? users.reduce((sum, u) => sum + (u.statistics?.averageScore || 0), 0) / users.length
          : 0;

        return {
          position: {
            _id: position._id,
            name: position.name
          },
          totalUsers,
          activeUsers: users.filter(u => u.isActive).length,
          totalTests,
          totalCoins,
          avgScore: avgScore.toFixed(2),
          avgTestsPerUser: totalUsers > 0 ? (totalTests / totalUsers).toFixed(2) : '0.00'
        };
      })
    );

    res.json({
      success: true,
      count: stats.length,
      data: stats
    });
  } catch (error) {
    console.error('Get stats by positions error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні статистики по посадах'
    });
  }
});

// @route   GET /api/stats/activity
// @desc    Отримати статистику активності користувачів по датах
// @access  Private/Admin
router.get('/activity', protect, authorize('admin'), async (req, res) => {
  try {
    const { days = 30, type = 'all' } = req.query; // days: кількість днів, type: 'registrations' | 'tests' | 'logins' | 'all'
    const daysCount = parseInt(days);
    
    // Розрахувати дату початку
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysCount);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    const result = {
      registrations: [],
      tests: [],
      logins: [],
    };
    
    // Статистика реєстрацій по датах
    if (type === 'all' || type === 'registrations') {
      const registrations = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);
      
      result.registrations = registrations.map(r => ({
        date: r._id,
        count: r.count
      }));
    }
    
    // Статистика завершених тестів по датах
    if (type === 'all' || type === 'tests') {
      const tests = await DailyTest.aggregate([
        {
          $match: {
            status: 'completed',
            completedAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$completedAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);
      
      result.tests = tests.map(t => ({
        date: t._id,
        count: t.count
      }));
    }
    
    // Статистика логінів по датах (якщо є поле lastLogin)
    if (type === 'all' || type === 'logins') {
      const logins = await User.aggregate([
        {
          $match: {
            lastLogin: { $gte: startDate, $lte: endDate, $ne: null }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$lastLogin' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);
      
      result.logins = logins.map(l => ({
        date: l._id,
        count: l.count
      }));
    }
    
    res.json({
      success: true,
      data: result,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: daysCount
      }
    });
  } catch (error) {
    console.error('Get activity stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні статистики активності'
    });
  }
});

// @route   GET /api/stats/coins
// @desc    Отримати загальну статистику монет (нараховано/витрачено)
// @access  Private/Admin
router.get('/coins', protect, authorize('admin'), async (req, res) => {
  try {
    // Загальний баланс всіх користувачів
    const totalBalance = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$coins' } } }
    ]);
    const totalCoinsInSystem = totalBalance.length > 0 ? totalBalance[0].total : 0;

    // Статистика по типах транзакцій (тільки підтверджені)
    const transactionStats = await CoinTransaction.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Розділити на нараховані та витрачені
    let totalEarned = 0;
    let totalSpent = 0;
    let totalManualAdded = 0;
    let totalManualSubtracted = 0;
    let totalRefunded = 0;

    transactionStats.forEach(stat => {
      if (stat._id === 'earned' || stat._id === 'manual_add' || stat._id === 'refund') {
        if (stat._id === 'earned') totalEarned += stat.total;
        if (stat._id === 'manual_add') totalManualAdded += stat.total;
        if (stat._id === 'refund') totalRefunded += stat.total;
      } else if (stat._id === 'spent' || stat._id === 'manual_subtract') {
        if (stat._id === 'spent') totalSpent += stat.total;
        if (stat._id === 'manual_subtract') totalManualSubtracted += stat.total;
      }
    });

    // Статистика по датах (останні 30 днів)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);

    const dailyStats = await CoinTransaction.aggregate([
      {
        $match: {
          status: 'approved',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$type'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalCoinsInSystem,
        totalEarned,
        totalSpent,
        totalManualAdded,
        totalManualSubtracted,
        totalRefunded,
        netCoins: totalEarned + totalManualAdded + totalRefunded - totalSpent - totalManualSubtracted,
        dailyStats: dailyStats.map(s => ({
          date: s._id.date,
          type: s._id.type,
          total: s.total,
          count: s.count
        }))
      }
    });
  } catch (error) {
    console.error('Get coins stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні статистики монет'
    });
  }
});

// @route   GET /api/stats/tests
// @desc    Отримати детальну статистику по тестах
// @access  Private/Admin
router.get('/tests', protect, authorize('admin'), async (req, res) => {
  try {
    const { startDate, endDate, city, position } = req.query;
    
    const query = { status: 'completed' };
    
    if (startDate || endDate) {
      query.completedAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.completedAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.completedAt.$lte = end;
      }
    }

    // Підтримка множинного вибору міст та посад
    if (city || position) {
      const userQuery = { isActive: true };
      if (city) {
        const cityIds = city.split(',').filter(Boolean);
        if (cityIds.length === 1) {
          userQuery.city = cityIds[0];
        } else if (cityIds.length > 1) {
          userQuery.city = { $in: cityIds };
        }
      }
      if (position) {
        const positionIds = position.split(',').filter(Boolean);
        if (positionIds.length === 1) {
          userQuery.position = positionIds[0];
        } else if (positionIds.length > 1) {
          userQuery.position = { $in: positionIds };
        }
      }
      
      const users = await User.find(userQuery).select('_id');
      const userIds = users.map(u => u._id);
      query.user = { $in: userIds };
    }

    // Загальна статистика
    const totalTests = await DailyTest.countDocuments(query);
    
    const avgScore = await DailyTest.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$score' },
          avgPercentage: { $avg: { $multiply: [{ $divide: ['$score', 5] }, 100] } }
        }
      }
    ]);

    const avgScoreValue = avgScore.length > 0 ? avgScore[0].avgScore : 0;
    const avgPercentageValue = avgScore.length > 0 ? avgScore[0].avgPercentage : 0;

    // Розподіл по балах
    const scoreDistribution = await DailyTest.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$score',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Загальна кількість монет зароблених за тести
    const totalCoinsEarned = await DailyTest.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: '$coinsEarned' }
        }
      }
    ]);
    const coinsEarned = totalCoinsEarned.length > 0 ? totalCoinsEarned[0].total : 0;

    // Статистика по датах
    const dailyTestStats = await DailyTest.aggregate([
      { $match: query },
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

    // Статистика по містах (якщо немає фільтру по місту)
    let cityStats = [];
    if (!city) {
      cityStats = await DailyTest.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        { $unwind: '$userInfo' },
        {
          $lookup: {
            from: 'cities',
            localField: 'userInfo.city',
            foreignField: '_id',
            as: 'cityInfo'
          }
        },
        { $unwind: '$cityInfo' },
        {
          $group: {
            _id: '$cityInfo._id',
            cityName: { $first: '$cityInfo.name' },
            count: { $sum: 1 },
            avgScore: { $avg: '$score' },
            totalCoins: { $sum: '$coinsEarned' }
          }
        },
        { $sort: { count: -1 } }
      ]);
    }

    // Статистика по посадах (якщо немає фільтру по посаді)
    let positionStats = [];
    if (!position) {
      positionStats = await DailyTest.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        { $unwind: '$userInfo' },
        {
          $lookup: {
            from: 'positions',
            localField: 'userInfo.position',
            foreignField: '_id',
            as: 'positionInfo'
          }
        },
        { $unwind: '$positionInfo' },
        {
          $group: {
            _id: '$positionInfo._id',
            positionName: { $first: '$positionInfo.name' },
            count: { $sum: 1 },
            avgScore: { $avg: '$score' },
            totalCoins: { $sum: '$coinsEarned' }
          }
        },
        { $sort: { count: -1 } }
      ]);
    }

    res.json({
      success: true,
      data: {
        summary: {
          totalTests,
          avgScore: avgScoreValue.toFixed(2),
          avgPercentage: avgPercentageValue.toFixed(2),
          totalCoinsEarned: coinsEarned,
        },
        scoreDistribution: scoreDistribution.map(s => ({
          score: s._id,
          count: s.count,
          percentage: totalTests > 0 ? ((s.count / totalTests) * 100).toFixed(2) : '0.00'
        })),
        dailyStats: dailyTestStats.map(s => ({
          date: s._id,
          count: s.count,
          avgScore: s.avgScore.toFixed(2),
          totalCoins: s.totalCoins
        })),
        cityStats: cityStats.map(s => ({
          city: { _id: s._id, name: s.cityName },
          count: s.count,
          avgScore: s.avgScore.toFixed(2),
          totalCoins: s.totalCoins
        })),
        positionStats: positionStats.map(s => ({
          position: { _id: s._id, name: s.positionName },
          count: s.count,
          avgScore: s.avgScore.toFixed(2),
          totalCoins: s.totalCoins
        }))
      }
    });
  } catch (error) {
    console.error('Get tests stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні статистики по тестах'
    });
  }
});

// @route   GET /api/stats/categories
// @desc    Отримати статистику по категоріях питань
// @access  Private/Admin
router.get('/categories', protect, authorize('admin'), async (req, res) => {
  try {
    // Статистика по категоріях: кількість питань, використання в тестах, точність відповідей
    const categoryStats = await DailyTest.aggregate([
      {
        $match: { status: 'completed' }
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
          },
          uniqueQuestions: { $addToSet: '$questionData._id' }
        }
      },
      {
        $project: {
          category: { _id: '$_id', name: '$categoryName' },
          totalQuestions: 1,
          correctAnswers: 1,
          uniqueQuestionsCount: { $size: '$uniqueQuestions' },
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

    // Додати загальну кількість питань в кожній категорії
    const categoriesWithQuestionCount = await Promise.all(
      categoryStats.map(async (stat) => {
        const questionCount = await Question.countDocuments({
          category: stat.category._id,
          isActive: true
        });
        return {
          ...stat,
          totalQuestionsInCategory: questionCount
        };
      })
    );

    res.json({
      success: true,
      data: categoriesWithQuestionCount
    });
  } catch (error) {
    console.error('Get categories stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні статистики по категоріях'
    });
  }
});

// @route   GET /api/stats/combined
// @desc    Отримати комбіновану статистику (місто + посада)
// @access  Private/Admin
router.get('/combined', protect, authorize('admin'), async (req, res) => {
  try {
    const cities = await City.find({ isActive: true });
    const positions = await Position.find({ isActive: true });
    
    const combinedStats = [];
    
    for (const city of cities) {
      for (const position of positions) {
        const users = await User.find({
          city: city._id,
          position: position._id,
          isActive: true
        });
        
        if (users.length > 0) {
          const totalUsers = users.length;
          const totalTests = await DailyTest.countDocuments({
            user: { $in: users.map(u => u._id) },
            status: 'completed'
          });
          const totalCoins = users.reduce((sum, u) => sum + (u.coins || 0), 0);
          const avgScore = users.length > 0
            ? users.reduce((sum, u) => sum + (u.statistics?.averageScore || 0), 0) / users.length
            : 0;
          
          combinedStats.push({
            city: {
              _id: city._id,
              name: city.name
            },
            position: {
              _id: position._id,
              name: position.name
            },
            totalUsers,
            totalTests,
            totalCoins,
            avgScore: avgScore.toFixed(2),
            avgTestsPerUser: totalUsers > 0 ? (totalTests / totalUsers).toFixed(2) : '0.00'
          });
        }
      }
    }
    
    res.json({
      success: true,
      count: combinedStats.length,
      data: combinedStats
    });
  } catch (error) {
    console.error('Get combined stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні комбінованої статистики'
    });
  }
});

module.exports = router;

