const express = require('express');
const DailyTest = require('../models/DailyTest');
const QuestionHistory = require('../models/QuestionHistory');
const { protect, authorize } = require('../middleware/auth');
const { generateDailyTest, submitAnswer, getCurrentTest } = require('../services/dailyTestService');

const router = express.Router();

// @route   GET /api/daily-tests/current
// @desc    Отримати поточний тест користувача
// @access  Private
router.get('/current', protect, async (req, res) => {
  try {
    const test = await getCurrentTest(req.user._id);

    if (!test) {
      return res.json({
        success: true,
        message: 'Тест на сьогодні ще не створено',
        data: null
      });
    }

    // Перевірити чи не прострочений
    if (test.isExpired() && test.status !== 'completed') {
      test.status = 'expired';
      await test.save();
    }

    // Для клієнта не показувати правильні відповіді до завершення
    const testData = test.toObject();
    if (test.status !== 'completed') {
      testData.questions = testData.questions.map(q => ({
        question: {
          _id: q.question._id,
          text: q.question.text,
          image: q.question.image,
          answers: q.question.answers.map(a => ({ text: a.text })) // Без isCorrect
        },
        userAnswer: q.userAnswer,
        isCorrect: q.isCorrect,
        answeredAt: q.answeredAt
      }));
    }

    res.json({
      success: true,
      data: testData
    });
  } catch (error) {
    console.error('Get current test error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні тесту'
    });
  }
});

// @route   POST /api/daily-tests/generate
// @desc    Згенерувати щоденний тест
// @access  Private
router.post('/generate', protect, async (req, res) => {
  try {
    const test = await generateDailyTest(req.user._id);
    
    // Populate питань перед поверненням
    await test.populate('questions.question');

    // Для клієнта не показувати правильні відповіді
    const testData = test.toObject();
    testData.questions = testData.questions.map(q => ({
      question: {
        _id: q.question._id,
        text: q.question.text,
        image: q.question.image,
        answers: q.question.answers.map(a => ({ text: a.text })) // Без isCorrect
      },
      userAnswer: q.userAnswer,
      isCorrect: q.isCorrect,
      answeredAt: q.answeredAt
    }));

    res.status(201).json({
      success: true,
      message: 'Тест успішно згенеровано',
      data: testData
    });
  } catch (error) {
    console.error('Generate test error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Помилка при генерації тесту'
    });
  }
});

// @route   GET /api/daily-tests
// @desc    Отримати список тестів (для адмінів)
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, userId, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (userId) query.user = userId;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const skip = (page - 1) * limit;

    const tests = await DailyTest.find(query)
      .populate('user', 'firstName lastName city position')
      .populate('user.city', 'name')
      .populate('user.position', 'name')
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await DailyTest.countDocuments(query);

    // Статистика
    const stats = await DailyTest.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          expired: {
            $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
          },
          avgScore: { $avg: '$score' },
          totalCoins: { $sum: '$coinsEarned' }
        }
      }
    ]);

    res.json({
      success: true,
      count: tests.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      stats: stats[0] || {
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        expired: 0,
        avgScore: 0,
        totalCoins: 0
      },
      data: tests
    });
  } catch (error) {
    console.error('Get daily tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні тестів'
    });
  }
});

// @route   GET /api/daily-tests/history
// @desc    Отримати історію тестів користувача
// @access  Private
// ВАЖЛИВО: Цей маршрут має бути ПЕРЕД /:id/results, інакше "history" буде інтерпретовано як id
router.get('/history', protect, async (req, res) => {
  try {
    console.log('GET /api/daily-tests/history - userId:', req.user._id);
    const { limit = 30, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const tests = await DailyTest.find({ 
      user: req.user._id,
      status: 'completed'
    })
      .select('_id date completedAt score coinsEarned status')
      .sort({ completedAt: -1, date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await DailyTest.countDocuments({ 
      user: req.user._id,
      status: 'completed'
    });

    res.json({
      success: true,
      count: tests.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: tests
    });
  } catch (error) {
    console.error('Get test history error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні історії тестів'
    });
  }
});

// @route   POST /api/daily-tests/:id/answer
// @desc    Відправити відповідь на питання
// @access  Private
router.post('/:id/answer', protect, async (req, res) => {
  try {
    const { questionIndex, answerIndex } = req.body;

    if (questionIndex === undefined || answerIndex === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Індекс питання та відповіді обов\'язкові'
      });
    }

    const result = await submitAnswer(
      req.params.id,
      parseInt(questionIndex),
      parseInt(answerIndex),
      req.user._id
    );

    const responseData = {
      isCorrect: result.isCorrect,
      explanation: result.explanation,
      allAnswered: result.allAnswered,
      score: result.allAnswered ? result.test.score : undefined,
      percentage: result.allAnswered ? (result.test.score / 5) * 100 : undefined,
      coinsEarned: result.allAnswered ? result.test.coinsEarned : undefined,
      correctAnswerIndex: result.correctAnswerIndex
    };

    // Додати рейтинг по посаді, якщо тест завершено
    if (result.allAnswered && result.ratingPosition) {
      responseData.ratingPosition = {
        position: result.ratingPosition.position,
        totalUsers: result.ratingPosition.totalUsers,
        message: `Ви на ${result.ratingPosition.position} місці з ${result.ratingPosition.totalUsers}`
      };
    }

    // Додати отримані ачівки, якщо тест завершено
    if (result.allAnswered && result.awardedAchievements && result.awardedAchievements.length > 0) {
      responseData.awardedAchievements = result.awardedAchievements.map(aa => ({
        id: aa.achievement._id,
        name: aa.achievement.name,
        description: aa.achievement.description,
        icon: aa.achievement.icon,
        rarity: aa.achievement.rarity,
        reward: aa.reward
      }));
    }

    res.json({
      success: true,
      message: result.allAnswered ? 'Тест завершено!' : 'Відповідь збережено',
      data: responseData
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Помилка при збереженні відповіді'
    });
  }
});

// @route   GET /api/daily-tests/:id/results
// @desc    Отримати результати тесту
// @access  Private
router.get('/:id/results', protect, async (req, res) => {
  try {
    const test = await DailyTest.findById(req.params.id)
      .populate('questions.question')
      .populate('user', 'firstName lastName');

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Тест не знайдено'
      });
    }

    // Перевірити доступ
    if (test.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Немає доступу до цього тесту'
      });
    }

    res.json({
      success: true,
      data: test
    });
  } catch (error) {
    console.error('Get test results error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні результатів'
    });
  }
});

// @route   POST /api/daily-tests/generate-for-user/:userId
// @desc    Ручна генерація тесту для конкретного користувача (для адмінів)
// @access  Private/Admin
router.post('/generate-for-user/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const test = await generateDailyTest(req.params.userId);
    
    // Populate питань перед поверненням
    await test.populate('questions.question');

    // Для клієнта не показувати правильні відповіді
    const testData = test.toObject();
    testData.questions = testData.questions.map(q => ({
      question: {
        _id: q.question._id,
        text: q.question.text,
        image: q.question.image,
        answers: q.question.answers.map(a => ({ text: a.text })) // Без isCorrect
      },
      userAnswer: q.userAnswer,
      isCorrect: q.isCorrect,
      answeredAt: q.answeredAt
    }));

    res.status(201).json({
      success: true,
      message: 'Тест успішно згенеровано',
      data: testData
    });
  } catch (error) {
    console.error('Generate test for user error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Помилка при генерації тесту'
    });
  }
});

// @route   POST /api/daily-tests/reset-user-test/:userId
// @desc    Скинути поточний тест користувача (для адмінів)
// @access  Private/Admin
router.post('/reset-user-test/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const userId = req.params.userId;

    // Знайти поточний тест користувача (за сьогоднішню дату)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const test = await DailyTest.findOne({
      user: userId,
      date: { $gte: today, $lt: tomorrow }
    });

    if (!test) {
      // Не помилка - просто немає тесту на сьогодні
      return res.json({
        success: true,
        message: 'Тест на сьогодні не знайдено. Можливо користувач ще не створив тест або вже пройшов його.',
        deletedCount: 0
      });
    }

    // ВАЖЛИВО: Зберегти питання в історію перед видаленням
    // Щоб користувач не міг проходити ті самі питання після скидання
    if (test.status === 'completed' || test.status === 'in_progress') {
      const historyPromises = test.questions.map(q => 
        QuestionHistory.findOneAndUpdate(
          { user: userId, question: q.question },
          { 
            $setOnInsert: { firstSeenAt: new Date() },
            $inc: { timesShown: 1 },
            $set: { 
              everAnsweredCorrectly: q.isCorrect || false 
            }
          },
          { upsert: true, new: true }
        )
      );
      await Promise.all(historyPromises);
    }

    // Скинути тест (видалити)
    await DailyTest.findByIdAndDelete(test._id);

    res.json({
      success: true,
      message: `Тест успішно скинуто. Статус: ${test.status}, Оцінка: ${test.score}/${test.questions.length}. Питання збережено в історію.`,
      deletedCount: 1
    });
  } catch (error) {
    console.error('Reset user test error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при скиданні тесту'
    });
  }
});

// @route   POST /api/daily-tests/bulk-reset
// @desc    Масове скидання поточних тестів для користувачів (для адмінів)
// @access  Private/Admin
router.post('/bulk-reset', protect, authorize('admin'), async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'userIds обов\'язковий параметр і має бути непорожнім масивом'
      });
    }

    // Знайти поточні тести користувачів (за сьогоднішню дату)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Отримати всі тести для збереження в історію
    const tests = await DailyTest.find({
      user: { $in: userIds },
      date: { $gte: today, $lt: tomorrow }
    });

    // Зберегти питання в історію для кожного тесту
    for (const test of tests) {
      if (test.status === 'completed' || test.status === 'in_progress') {
        const historyPromises = test.questions.map(q => 
          QuestionHistory.findOneAndUpdate(
            { user: test.user, question: q.question },
            { 
              $setOnInsert: { firstSeenAt: new Date() },
              $inc: { timesShown: 1 },
              $set: { 
                everAnsweredCorrectly: q.isCorrect || false 
              }
            },
            { upsert: true, new: true }
          )
        );
        await Promise.all(historyPromises);
      }
    }

    // Видалити тести
    const result = await DailyTest.deleteMany({
      user: { $in: userIds },
      date: { $gte: today, $lt: tomorrow }
    });

    res.json({
      success: true,
      message: `Скинуто ${result.deletedCount} тестів. Питання збережено в історію.`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk reset tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при масовому скиданні тестів'
    });
  }
});

// @route   POST /api/daily-tests/reset-all-user-tests/:userId
// @desc    Скинути ВСЮ статистику тестів користувача (для адмінів)
// @access  Private/Admin
router.post('/reset-all-user-tests/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const userId = req.params.userId;

    // Підрахувати кількість тестів перед видаленням
    const testsCount = await DailyTest.countDocuments({ user: userId });

    if (testsCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'У цього користувача немає тестів для скидання'
      });
    }

    // Видалити всі тести користувача
    const result = await DailyTest.deleteMany({ user: userId });

    // ТАКОЖ видалити історію питань - повне скидання
    await QuestionHistory.deleteMany({ user: userId });

    res.json({
      success: true,
      message: `Успішно видалено ${result.deletedCount} тестів та історію питань. Користувач може проходити всі питання заново.`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Reset all user tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при скиданні статистики користувача'
    });
  }
});

// @route   POST /api/daily-tests/bulk-reset-all
// @desc    Масове скидання ВСІЄЇ статистики для користувачів (для адмінів)
// @access  Private/Admin
router.post('/bulk-reset-all', protect, authorize('admin'), async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'userIds обов\'язковий параметр і має бути непорожнім масивом'
      });
    }

    // Видалити всі тести вибраних користувачів
    const result = await DailyTest.deleteMany({
      user: { $in: userIds }
    });

    // ТАКОЖ видалити історію питань для повного скидання
    await QuestionHistory.deleteMany({
      user: { $in: userIds }
    });

    res.json({
      success: true,
      message: `Успішно видалено ${result.deletedCount} тестів та історію питань для ${userIds.length} користувачів. Вони можуть проходити всі питання заново.`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk reset all tests error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при масовому скиданні статистики'
    });
  }
});

module.exports = router;

