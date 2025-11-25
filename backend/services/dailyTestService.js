const DailyTest = require('../models/DailyTest');
const Question = require('../models/Question');
const QuestionHistory = require('../models/QuestionHistory');
const User = require('../models/User');
const TestResult = require('../models/TestResult');
const { getUserPositionByPosition } = require('./ratingService');
const { checkAndAwardAchievements } = require('./achievementService');

/**
 * Генерація щоденного тесту для користувача
 * Вибирає рівно 5 питань з різних категорій
 * Виключає питання, які користувач вже пройшов
 * Тести задаються по містах: всі користувачі в місті отримують тести з одного пулу питань,
 * але кожен користувач отримує різний набір з 5 питань
 */
const generateDailyTest = async (userId) => {
  try {
    // Отримати користувача з посадою та містом
    const user = await User.findById(userId).select('position city role');
    const isAdmin = user && user.role === 'admin';

    // Перевірити чи вже є тест на сьогодні
    // Для адміністраторів дозволяємо створювати нові тести навіть якщо вже є завершений
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingTest = await DailyTest.findOne({
      user: userId,
      date: { $gte: today, $lt: tomorrow }
    });

    // Перевірка чи вже є тест на сьогодні
    if (existingTest) {
      // Якщо тест завершено - не дозволяти створювати новий (для всіх користувачів)
      if (existingTest.status === 'completed') {
        throw new Error('Ви вже пройшли тест на сьогодні. Новий тест буде доступний завтра.');
      }
      // Якщо тест не завершено - повернути існуючий
      return existingTest;
    }
    
    // Для адміністраторів пропускаємо перевірки посади та міста
    if (user && user.role === 'admin') {
      // Адміністратори можуть проходити тести без обмежень
      // Використаємо всі доступні питання
    } else {
      if (!user || !user.position) {
        throw new Error('Користувач не знайдений або не має посади');
      }
      if (!user.city) {
        throw new Error('Користувач не має міста');
      }
    }

    // Отримати всі питання, які користувач вже бачив (з історії + з завершених тестів)
    // Використовуємо QuestionHistory щоб пам'ятати питання навіть після скидання тестів
    const questionHistory = await QuestionHistory.find({ user: userId }).select('question');
    const answeredQuestionIds = new Set(questionHistory.map(qh => qh.question.toString()));

    // Також додати питання з завершених тестів (якщо вони ще не в історії)
    const completedTests = await DailyTest.find({
      user: userId,
      status: 'completed'
    }).select('questions.question');

    completedTests.forEach(test => {
      test.questions.forEach(q => {
        if (q.question) {
          answeredQuestionIds.add(q.question.toString());
        }
      });
    });

    console.log(`User ${userId} has seen ${answeredQuestionIds.size} questions previously (from history + completed tests)`);

    // Фільтр питань по посаді: питання для конкретної посади користувача
    // Для адміністраторів не застосовуємо фільтр по посаді
    const positionFilter = user && user.role === 'admin' ? {} : {
      positions: user.position
    };

    // Отримати всі питання, які вже використані іншими користувачами в цьому місті сьогодні
    // Для адміністраторів не застосовуємо обмеження по місту
    let usedQuestionIdsInCity = new Set();
    
    if (user && user.role !== 'admin' && user.city) {
      const cityUsers = await User.find({ 
        city: user.city, 
        isActive: true 
      }).select('_id');
      
      const cityUserIds = cityUsers.map(u => u._id.toString());
      
      // Отримати всі тести користувачів міста на сьогодні
      const cityTestsToday = await DailyTest.find({
        user: { $in: cityUserIds },
        date: { $gte: today, $lt: tomorrow }
      }).select('questions.question');

      cityTestsToday.forEach(test => {
        test.questions.forEach(q => {
          if (q.question) {
            usedQuestionIdsInCity.add(q.question.toString());
          }
        });
      });
    }

    // Отримати всі доступні питання для міста (з урахуванням посади)
    let availableQuestions = await Question.find({
      isActive: true,
      _id: { 
        $nin: [
          ...Array.from(answeredQuestionIds), // Вже пройдені цим користувачем
          ...Array.from(usedQuestionIdsInCity) // Вже використані іншими користувачами в місті сьогодні
        ]
      },
      ...positionFilter // Фільтр по посаді
    }).select('_id category');

    console.log(`Available questions (excluding answered and used in city): ${availableQuestions.length}`);

    // Якщо недостатньо питань з урахуванням виключення використаних в місті,
    // дозволити повторне використання питань (але не пройдених цим користувачем)
    if (availableQuestions.length < 5) {
      console.log(`Недостатньо питань з урахуванням виключення використаних в місті (${availableQuestions.length}). Спробуємо без виключення використаних в місті.`);
      
      availableQuestions = await Question.find({
        isActive: true,
        _id: { 
          $nin: Array.from(answeredQuestionIds) // Тільки виключити вже пройдені цим користувачем
        },
        ...positionFilter // Фільтр по посаді
      }).select('_id category');
      
      console.log(`Available questions (excluding only answered): ${availableQuestions.length}`);
    }

    // ВАЖЛИВО: Не дозволяти повторне використання питань, які користувач вже пройшов
    // Тільки якщо питань для посади взагалі недостатньо, показати помилку
    if (availableQuestions.length < 5) {
      // Підрахувати загальну кількість питань для посади
      const totalQuestionsForPosition = await Question.countDocuments({
        isActive: true,
        ...positionFilter
      });
      
      console.log(`Недостатньо непройдених питань (${availableQuestions.length}). Всього питань для посади: ${totalQuestionsForPosition}`);
      
      if (totalQuestionsForPosition < 5) {
        throw new Error(`Недостатньо питань для вашої посади. Доступно: ${totalQuestionsForPosition}, потрібно: 5. Будь ласка, зверніться до адміністратора.`);
      } else {
        throw new Error(`Ви вже пройшли всі доступні питання для вашої посади (${answeredQuestionIds.size} питань). Будь ласка, зверніться до адміністратора для додавання нових питань.`);
      }
    }

    if (availableQuestions.length < 5) {
      throw new Error(`Недостатньо доступних питань. Доступно: ${availableQuestions.length}, потрібно: 5. Будь ласка, додайте більше питань в систему.`);
    }

    // Отримати всі активні категорії з доступних питань
    const categories = [...new Set(availableQuestions.map(q => q.category.toString()))];

    // Вибрати рівно 5 питань з різних категорій
    const selectedQuestions = [];
    const usedCategories = new Set();
    const usedQuestionIds = new Set();

    // Спочатку вибрати по одному питанню з кожної категорії (до 5)
    for (let i = 0; i < Math.min(5, categories.length); i++) {
      const categoryId = categories[i];
      
      const question = availableQuestions.find(
        q => q.category.toString() === categoryId && !usedQuestionIds.has(q._id.toString())
      );

      if (question) {
        selectedQuestions.push({
          question: question._id,
          userAnswer: null,
          isCorrect: false,
          answeredAt: null
        });
        usedCategories.add(categoryId);
        usedQuestionIds.add(question._id.toString());
      }
    }

    // Якщо не вистачає питань до 5, додати з будь-яких категорій
    while (selectedQuestions.length < 5) {
      const question = availableQuestions.find(
        q => !usedQuestionIds.has(q._id.toString())
      );

      if (!question) {
        throw new Error(`Недостатньо доступних питань. Доступно: ${selectedQuestions.length}, потрібно: 5`);
      }

      selectedQuestions.push({
        question: question._id,
        userAnswer: null,
        isCorrect: false,
        answeredAt: null
      });
      usedQuestionIds.add(question._id.toString());
    }

    // Перевірка що точно 5 питань
    if (selectedQuestions.length !== 5) {
      throw new Error(`Помилка: тест має містити рівно 5 питань, а отримано ${selectedQuestions.length}`);
    }

    // Встановити дедлайн (сьогодні до 00:00 наступного дня)
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 1);
    deadline.setHours(0, 0, 0, 0);

    // Створити тест
    const dailyTest = await DailyTest.create({
      user: userId,
      date: today,
      questions: selectedQuestions,
      deadline,
      status: 'pending'
    });

    return dailyTest;
  } catch (error) {
    console.error('Generate daily test error:', error);
    throw error;
  }
};

/**
 * Обробка відповіді на питання
 */
const submitAnswer = async (testId, questionIndex, answerIndex, userId) => {
  try {
    const test = await DailyTest.findById(testId).populate('questions.question');

    if (!test) {
      throw new Error('Тест не знайдено');
    }

    if (test.user.toString() !== userId.toString()) {
      throw new Error('Немає доступу до цього тесту');
    }

    if (test.status === 'completed' || test.status === 'expired') {
      throw new Error('Тест вже завершено або прострочений');
    }

    // Перевірити чи користувач є адміністратором
    const user = await User.findById(userId).select('role');
    const isAdmin = user && user.role === 'admin';

    // Для адміністраторів не перевіряємо дедлайн
    if (!isAdmin && test.isExpired()) {
      test.status = 'expired';
      await test.save();
      throw new Error('Час на проходження тесту вийшов');
    }

    if (questionIndex >= test.questions.length) {
      throw new Error('Невірний індекс питання');
    }

    const questionData = test.questions[questionIndex];
    const question = questionData.question;

    // Перевірити відповідь
    const correctAnswerIndex = question.answers.findIndex(a => a.isCorrect);
    const isCorrect = answerIndex === correctAnswerIndex;

    // Оновити відповідь
    questionData.userAnswer = answerIndex;
    questionData.isCorrect = isCorrect;
    questionData.answeredAt = new Date();

    // Перевірити чи всі питання відповідені
    const allAnswered = test.questions.every(q => q.userAnswer !== null);

    if (allAnswered) {
      test.status = 'completed';
      test.completedAt = new Date();
      test.calculateScore();

      // Нарахувати монети з налаштувань системи
      const SystemSettings = require('../models/SystemSettings');
      const settings = await SystemSettings.getSettings();
      const coinsPerAnswer = settings.coinsPerCorrectAnswer || 10;
      const coinsPerTest = settings.coinsPerTestCompletion || 50;
      test.coinsEarned = test.score * coinsPerAnswer + coinsPerTest;

      // Отримати поточні дані користувача перед оновленням
      const userBeforeUpdate = await User.findById(userId);
      const currentTotalAnswers = (userBeforeUpdate.statistics?.totalAnswers || 0);
      const currentCorrectAnswers = (userBeforeUpdate.statistics?.correctAnswers || 0);
      
      // Оновити баланс користувача та статистику
      await User.findByIdAndUpdate(userId, {
        $inc: { 
          coins: test.coinsEarned,
          'statistics.totalTests': 1,
          'statistics.completedTests': 1,
          'statistics.correctAnswers': test.score,
          'statistics.totalAnswers': 5
        }
      });

      // Оновити середній бал користувача (після оновлення)
      const totalAnswers = currentTotalAnswers + 5;
      const totalCorrect = currentCorrectAnswers + test.score;
      const newAverageScore = totalAnswers > 0 ? (totalCorrect / totalAnswers) * 100 : 0;
      
      await User.findByIdAndUpdate(userId, {
        $set: { 'statistics.averageScore': newAverageScore }
      });

      // Створити результат тесту
      await TestResult.create({
        user: userId,
        test: testId,
        answers: test.questions.map((q, idx) => ({
          question: q.question._id,
          selectedAnswer: q.userAnswer,
          isCorrect: q.isCorrect,
          answeredAt: q.answeredAt
        })),
        totalScore: test.score,
        percentage: (test.score / 5) * 100,
        coinsEarned: test.coinsEarned
      });

      // ВАЖЛИВО: Зберегти питання в історію при завершенні тесту
      // Щоб вони не повторювались навіть після скидання тесту
      const historyPromises = test.questions.map(q => 
        QuestionHistory.findOneAndUpdate(
          { user: userId, question: q.question._id },
          { 
            $setOnInsert: { firstSeenAt: new Date() },
            $inc: { timesShown: 1 },
            $set: { 
              everAnsweredCorrectly: q.isCorrect 
            }
          },
          { upsert: true, new: true }
        )
      );
      await Promise.all(historyPromises);

      // Отримати позицію користувача в рейтингу по посаді
      let ratingPosition = null;
      try {
        ratingPosition = await getUserPositionByPosition(userId);
      } catch (ratingError) {
        console.error('Error getting rating position:', ratingError);
        // Не блокуємо завершення тесту, якщо рейтинг не вдалося отримати
      }

      // Перевірити та нарахувати ачівки
      let awardedAchievements = [];
      try {
        awardedAchievements = await checkAndAwardAchievements(userId, test.score);
      } catch (achievementError) {
        console.error('Error checking achievements:', achievementError);
        // Не блокуємо завершення тесту, якщо ачівки не вдалося перевірити
      }

      await test.save();

      return {
        test,
        isCorrect,
        correctAnswerIndex: correctAnswerIndex,
        explanation: question.explanation,
        allAnswered: true,
        ratingPosition: ratingPosition,
        awardedAchievements: awardedAchievements
      };
    } else {
      test.status = 'in_progress';
    }

    await test.save();

    return {
      test,
      isCorrect,
      correctAnswerIndex: undefined, // Не показувати до завершення
      explanation: question.explanation,
      allAnswered: false
    };
  } catch (error) {
    console.error('Submit answer error:', error);
    throw error;
  }
};

/**
 * Отримати поточний тест користувача
 */
const getCurrentTest = async (userId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const test = await DailyTest.findOne({
      user: userId,
      date: { $gte: today, $lt: tomorrow }
    })
    .populate('questions.question', 'text answers explanation image category')
    .populate('user', 'firstName lastName');

    return test;
  } catch (error) {
    console.error('Get current test error:', error);
    throw error;
  }
};

module.exports = {
  generateDailyTest,
  submitAnswer,
  getCurrentTest
};

