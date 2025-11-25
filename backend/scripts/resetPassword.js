const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const User = require('../models/User');

// Завантажити змінні оточення
dotenv.config({ path: path.join(__dirname, '../.env') });

const resetPassword = async () => {
  try {
    // Підключитися до MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/learning-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Підключено до MongoDB');

    // Отримати параметри з командного рядка або використати значення за замовчуванням
    const login = process.argv[2] || 'admin';
    const newPassword = process.argv[3] || 'admin123';

    console.log(`\n🔄 Скидання пароля для користувача: ${login}`);

    // Знайти користувача
    const user = await User.findOne({ login }).select('+password');
    
    if (!user) {
      console.log(`❌ Користувач з логіном "${login}" не знайдено!`);
      process.exit(1);
    }

    console.log(`✅ Користувач знайдено: ${user.firstName} ${user.lastName}`);

    // Оновити пароль (pre-save hook автоматично захешує його)
    user.password = newPassword;
    await user.save();

    console.log(`\n✅ Пароль успішно оновлено!`);
    console.log(`📋 Нові дані для входу:`);
    console.log(`   Логін: ${login}`);
    console.log(`   Пароль: ${newPassword}`);
    console.log('\n⚠️  ВАЖЛИВО: Змініть пароль після першого входу!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Помилка при скиданні пароля:', error);
    process.exit(1);
  }
};

resetPassword();

