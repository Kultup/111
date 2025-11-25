const User = require('../models/User');
const DailyTest = require('../models/DailyTest');

/**
 * Отримати рейтинг користувача по посаді
 * Рейтинг базується на загальній кількості правильних відповідей
 */
const getUserPositionByPosition = async (userId) => {
  try {
    const user = await User.findById(userId).populate('position');
    
    if (!user) {
      throw new Error('Користувача не знайдено');
    }

    // Отримати всіх користувачів з тієї ж посади
    const usersWithSamePosition = await User.find({
      position: user.position._id,
      isActive: true
    }).select('_id statistics');

    // Підрахувати загальну кількість правильних відповідей для кожного користувача
    const usersStats = await Promise.all(
      usersWithSamePosition.map(async (u) => {
        const completedTests = await DailyTest.countDocuments({
          user: u._id,
          status: 'completed'
        });

        return {
          userId: u._id,
          correctAnswers: u.statistics.correctAnswers || 0,
          completedTests: completedTests,
          averageScore: u.statistics.averageScore || 0
        };
      })
    );

    // Сортувати за кількістю правильних відповідей (спочатку найбільше)
    usersStats.sort((a, b) => {
      // Спочатку за кількістю правильних відповідей
      if (b.correctAnswers !== a.correctAnswers) {
        return b.correctAnswers - a.correctAnswers;
      }
      // Якщо рівно, то за середнім балом
      return b.averageScore - a.averageScore;
    });

    // Знайти позицію поточного користувача
    const userIndex = usersStats.findIndex(
      stat => stat.userId.toString() === userId.toString()
    );

    if (userIndex === -1) {
      return {
        position: null,
        totalUsers: usersStats.length,
        userStats: null
      };
    }

    const position = userIndex + 1; // Позиція починається з 1
    const totalUsers = usersStats.length;

    return {
      position,
      totalUsers,
      userStats: {
        correctAnswers: usersStats[userIndex].correctAnswers,
        completedTests: usersStats[userIndex].completedTests,
        averageScore: usersStats[userIndex].averageScore
      },
      topUsers: usersStats.slice(0, 10).map((stat, idx) => ({
        position: idx + 1,
        userId: stat.userId,
        correctAnswers: stat.correctAnswers,
        averageScore: stat.averageScore
      }))
    };
  } catch (error) {
    console.error('Get user position error:', error);
    throw error;
  }
};

/**
 * Отримати повний рейтинг по посаді
 */
const getRatingByPosition = async (positionId, limit = 50) => {
  try {
    const users = await User.find({
      position: positionId,
      isActive: true
    }).select('_id firstName lastName statistics').populate('position', 'name');

    const usersStats = await Promise.all(
      users.map(async (user) => {
        const completedTests = await DailyTest.countDocuments({
          user: user._id,
          status: 'completed'
        });

        return {
          userId: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          position: user.position,
          correctAnswers: user.statistics.correctAnswers || 0,
          completedTests: completedTests,
          averageScore: user.statistics.averageScore || 0,
          totalTests: user.statistics.totalTests || 0
        };
      })
    );

    // Сортувати за кількістю правильних відповідей
    usersStats.sort((a, b) => {
      if (b.correctAnswers !== a.correctAnswers) {
        return b.correctAnswers - a.correctAnswers;
      }
      return b.averageScore - a.averageScore;
    });

    // Додати позиції
    const rating = usersStats.slice(0, limit).map((stat, index) => ({
      position: index + 1,
      ...stat
    }));

    return rating;
  } catch (error) {
    console.error('Get rating by position error:', error);
    throw error;
  }
};

module.exports = {
  getUserPositionByPosition,
  getRatingByPosition
};

