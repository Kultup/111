const express = require('express');
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const { protect, authorize } = require('../middleware/auth');
const { getAchievementProgress } = require('../services/achievementService');

const router = express.Router();

// @route   GET /api/achievements
// @desc    Отримати список всіх ачівок
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { type, rarity, active } = req.query;
    const query = {};

    if (type) query.type = type;
    if (rarity) query.rarity = rarity;
    if (active !== undefined) query.isActive = active === 'true';

    const achievements = await Achievement.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: achievements.length,
      data: achievements
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні ачівок'
    });
  }
});

// @route   GET /api/achievements/user/:userId
// @desc    Отримати ачівки користувача
// @access  Private
router.get('/user/:userId', protect, async (req, res) => {
  try {
    // Користувач може переглядати тільки свої ачівки, адмін - будь-які
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({
        success: false,
        message: 'Немає доступу до цього ресурсу'
      });
    }

    const userAchievements = await UserAchievement.find({ user: req.params.userId })
      .populate('achievement')
      .sort({ earnedAt: -1 });

    // Отримати всі ачівки з прогресом
    const allAchievements = await Achievement.find({ isActive: true });
    const achievementsWithProgress = await Promise.all(
      allAchievements.map(async (achievement) => {
        const userAchievement = userAchievements.find(
          ua => ua.achievement._id.toString() === achievement._id.toString()
        );

        if (userAchievement) {
          return {
            achievement: achievement,
            earned: true,
            earnedAt: userAchievement.earnedAt,
            progress: userAchievement.progress
          };
        }

        // Отримати прогрес до отримання
        const progress = await getAchievementProgress(req.params.userId, achievement._id);
        return {
          achievement: achievement,
          earned: false,
          progress: progress.progress,
          target: progress.target,
          percentage: progress.percentage
        };
      })
    );

    res.json({
      success: true,
      count: achievementsWithProgress.length,
      earnedCount: userAchievements.length,
      data: achievementsWithProgress
    });
  } catch (error) {
    console.error('Get user achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні ачівок користувача'
    });
  }
});

// @route   GET /api/achievements/:id
// @desc    Отримати ачівку по ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id);

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Ачівку не знайдено'
      });
    }

    res.json({
      success: true,
      data: achievement
    });
  } catch (error) {
    console.error('Get achievement error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні ачівки'
    });
  }
});

// @route   POST /api/achievements
// @desc    Створити ачівку
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, description, icon, type, condition, reward, rarity } = req.body;

    if (!name || !description || !type || !condition) {
      return res.status(400).json({
        success: false,
        message: 'Всі обов\'язкові поля мають бути заповнені'
      });
    }

    const achievement = await Achievement.create({
      name,
      description,
      icon,
      type,
      condition,
      reward: reward || {},
      rarity: rarity || 'common'
    });

    res.status(201).json({
      success: true,
      message: 'Ачівку успішно створено',
      data: achievement
    });
  } catch (error) {
    console.error('Create achievement error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при створенні ачівки'
    });
  }
});

// @route   PUT /api/achievements/:id
// @desc    Оновити ачівку
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, description, icon, type, condition, reward, rarity, isActive } = req.body;

    const achievement = await Achievement.findByIdAndUpdate(
      req.params.id,
      { name, description, icon, type, condition, reward, rarity, isActive },
      { new: true, runValidators: true }
    );

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Ачівку не знайдено'
      });
    }

    res.json({
      success: true,
      message: 'Ачівку успішно оновлено',
      data: achievement
    });
  } catch (error) {
    console.error('Update achievement error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при оновленні ачівки'
    });
  }
});

// @route   DELETE /api/achievements/:id
// @desc    Видалити ачівку
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.id);

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Ачівку не знайдено'
      });
    }

    await achievement.deleteOne();

    res.json({
      success: true,
      message: 'Ачівку успішно видалено'
    });
  } catch (error) {
    console.error('Delete achievement error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при видаленні ачівки'
    });
  }
});

// @route   GET /api/achievements/stats
// @desc    Отримати статистику по ачівках (скільки користувачів отримали кожну ачівку)
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const UserAchievement = require('../models/UserAchievement');
    const User = require('../models/User');
    
    // Отримати всі активні ачівки
    const achievements = await Achievement.find({ isActive: true });
    
    // Отримати загальну кількість активних користувачів
    const totalActiveUsers = await User.countDocuments({ isActive: true });
    
    // Для кожної ачівки підрахувати скільки користувачів її отримали
    const stats = await Promise.all(
      achievements.map(async (achievement) => {
        const earnedCount = await UserAchievement.countDocuments({
          achievement: achievement._id
        });
        
        const percentage = totalActiveUsers > 0
          ? ((earnedCount / totalActiveUsers) * 100).toFixed(2)
          : '0.00';
        
        return {
          achievement: {
            _id: achievement._id,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            type: achievement.type,
            rarity: achievement.rarity,
            reward: achievement.reward,
          },
          earnedCount,
          totalUsers: totalActiveUsers,
          percentage: parseFloat(percentage),
        };
      })
    );
    
    // Сортувати за кількістю отриманих (найпопулярніші спочатку)
    stats.sort((a, b) => b.earnedCount - a.earnedCount);
    
    res.json({
      success: true,
      count: stats.length,
      totalUsers: totalActiveUsers,
      data: stats
    });
  } catch (error) {
    console.error('Get achievements stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні статистики по ачівках'
    });
  }
});

module.exports = router;

