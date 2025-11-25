const cron = require('node-cron');
const User = require('../models/User');
const { generateDailyTest } = require('./dailyTestService');

/**
 * Генерація щоденних тестів для всіх активних користувачів
 */
const generateDailyTestsForAllUsers = async () => {
  try {
    console.log('🔄 Початок генерації щоденних тестів...');
    
    // Генерувати тести тільки для звичайних користувачів, не для адміністраторів
    const activeUsers = await User.find({ 
      isActive: true,
      role: { $ne: 'admin' } // Виключити адміністраторів
    }).select('_id');
    
    if (activeUsers.length === 0) {
      console.log('⚠️ Немає активних користувачів');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const user of activeUsers) {
      try {
        await generateDailyTest(user._id);
        successCount++;
      } catch (error) {
        console.error(`❌ Помилка генерації тесту для користувача ${user._id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`✅ Генерація завершена: ${successCount} успішно, ${errorCount} помилок`);
  } catch (error) {
    console.error('❌ Критична помилка при генерації тестів:', error);
  }
};

/**
 * Налаштування cron jobs
 */
const setupCronJobs = () => {
  // Генерація тестів щодня о 12:00 (за замовчуванням)
  // Можна налаштувати через змінну оточення DAILY_TEST_TIME
  const testTime = process.env.DAILY_TEST_TIME || '12:00';
  const [hours, minutes] = testTime.split(':');

  // Cron expression: щодня о встановлений час
  const cronExpression = `${minutes} ${hours} * * *`;

  console.log(`⏰ Налаштовано генерацію тестів на ${testTime} (cron: ${cronExpression})`);

  cron.schedule(cronExpression, async () => {
    console.log(`\n📅 ${new Date().toISOString()} - Запуск генерації щоденних тестів`);
    await generateDailyTestsForAllUsers();
  }, {
    scheduled: true,
    timezone: "Europe/Kyiv" // UTC+2 (можна налаштувати)
  });

  // Тестовий запуск при старті (опціонально, для перевірки)
  if (process.env.NODE_ENV === 'development') {
    console.log('🧪 Development mode: можна запустити генерацію вручну');
  }
};

module.exports = {
  setupCronJobs,
  generateDailyTestsForAllUsers
};

