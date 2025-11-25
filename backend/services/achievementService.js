const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const User = require('../models/User');
const DailyTest = require('../models/DailyTest');
const TestResult = require('../models/TestResult');

/**
 * Перевірка та нарахування ачівок після завершення тесту
 */
const checkAndAwardAchievements = async (userId, testScore) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('Користувача не знайдено');
    }

    // Отримати всі активні ачівки
    const achievements = await Achievement.find({ isActive: true });

    const awardedAchievements = [];

    for (const achievement of achievements) {
      // Перевірити чи користувач вже має цю ачівку
      const existing = await UserAchievement.findOne({
        user: userId,
        achievement: achievement._id
      });

      if (existing) {
        continue; // Ачівка вже отримана
      }

      // Перевірити умови отримання ачівки
      let shouldAward = false;
      let progress = 0;

      switch (achievement.type) {
        case 'correct_answers':
          // Загальна кількість правильних відповідей
          const targetCorrect = achievement.condition.correctAnswers || 0;
          progress = user.statistics.correctAnswers || 0;
          shouldAward = progress >= targetCorrect;
          break;

        case 'test_streak':
          // Серія днів підряд
          const targetStreak = achievement.condition.streak || 0;
          const currentStreak = await calculateTestStreak(userId);
          progress = currentStreak;
          shouldAward = currentStreak >= targetStreak;
          break;

        case 'total_tests':
          // Загальна кількість тестів
          const targetTests = achievement.condition.totalTests || 0;
          progress = user.statistics.completedTests || 0;
          shouldAward = progress >= targetTests;
          break;

        case 'perfect_score':
          // Кількість тестів з ідеальним результатом (5/5)
          const targetPerfect = achievement.condition.perfectScore || 0;
          const perfectTests = await TestResult.countDocuments({
            user: userId,
            totalScore: 5
          });
          progress = perfectTests;
          shouldAward = perfectTests >= targetPerfect;
          break;

        case 'category_master':
          // Майстер категорії (багато правильних відповідей в категорії)
          const categoryId = achievement.condition.category;
          const targetCategoryCorrect = achievement.condition.correctAnswers || 0;
          // Тут потрібна логіка підрахунку правильних відповідей по категорії
          // Поки що пропускаємо
          shouldAward = false;
          break;

        default:
          shouldAward = false;
      }

      if (shouldAward) {
        // Нарахувати ачівку
        await UserAchievement.create({
          user: userId,
          achievement: achievement._id,
          progress: progress
        });

        // Нарахувати нагороду (монети)
        if (achievement.reward && achievement.reward.coins > 0) {
          await User.findByIdAndUpdate(userId, {
            $inc: { coins: achievement.reward.coins }
          });
        }

        awardedAchievements.push({
          achievement: achievement,
          progress: progress,
          reward: achievement.reward
        });
      }
    }

    return awardedAchievements;
  } catch (error) {
    console.error('Check achievements error:', error);
    throw error;
  }
};

/**
 * Розрахувати поточну серію днів підряд
 */
const calculateTestStreak = async (userId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let currentDate = new Date(today);

    while (true) {
      const test = await DailyTest.findOne({
        user: userId,
        date: {
          $gte: currentDate,
          $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000)
        },
        status: 'completed'
      });

      if (test) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Calculate streak error:', error);
    return 0;
  }
};

/**
 * Отримати прогрес до отримання ачівки
 */
const getAchievementProgress = async (userId, achievementId) => {
  try {
    const achievement = await Achievement.findById(achievementId);
    if (!achievement) {
      throw new Error('Ачівку не знайдено');
    }

    const user = await User.findById(userId);
    const existing = await UserAchievement.findOne({
      user: userId,
      achievement: achievementId
    });

    if (existing) {
      return {
        earned: true,
        earnedAt: existing.earnedAt,
        progress: existing.progress
      };
    }

    let currentProgress = 0;
    let target = 0;

    switch (achievement.type) {
      case 'correct_answers':
        target = achievement.condition.correctAnswers || 0;
        currentProgress = user.statistics.correctAnswers || 0;
        break;
      case 'test_streak':
        target = achievement.condition.streak || 0;
        currentProgress = await calculateTestStreak(userId);
        break;
      case 'total_tests':
        target = achievement.condition.totalTests || 0;
        currentProgress = user.statistics.completedTests || 0;
        break;
      case 'perfect_score':
        target = achievement.condition.perfectScore || 0;
        currentProgress = await TestResult.countDocuments({
          user: userId,
          totalScore: 5
        });
        break;
    }

    return {
      earned: false,
      progress: currentProgress,
      target: target,
      percentage: target > 0 ? Math.min((currentProgress / target) * 100, 100) : 0
    };
  } catch (error) {
    console.error('Get achievement progress error:', error);
    throw error;
  }
};

module.exports = {
  checkAndAwardAchievements,
  calculateTestStreak,
  getAchievementProgress
};

