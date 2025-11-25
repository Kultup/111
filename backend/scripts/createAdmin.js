const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const User = require('../models/User');
const City = require('../models/City');
const Position = require('../models/Position');

// Завантажити змінні оточення
dotenv.config({ path: path.join(__dirname, '../.env') });

const createAdmin = async () => {
  try {
    // Підключитися до MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/learning-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Підключено до MongoDB');

    // Перевірити чи існує адмін
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️  Адмін користувач вже існує!');
      console.log(`   Логін: ${existingAdmin.login}`);
      process.exit(0);
    }

    // Отримати або створити місто та посаду для адміна
    let city = await City.findOne({ name: 'Київ' });
    if (!city) {
      city = await City.create({ name: 'Київ', isActive: true });
      console.log('✅ Створено місто: Київ');
    }

    let position = await Position.findOne({ name: 'Адміністратор' });
    if (!position) {
      position = await Position.create({ name: 'Адміністратор', isActive: true });
      console.log('✅ Створено посаду: Адміністратор');
    }

    // Дані для адміна (можна змінити)
    const adminData = {
      login: process.env.ADMIN_LOGIN || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123',
      firstName: process.env.ADMIN_FIRST_NAME || 'Адмін',
      lastName: process.env.ADMIN_LAST_NAME || 'Системи',
      city: city._id,
      position: position._id,
      role: 'admin'
    };

    // Створити адміна
    const admin = await User.create(adminData);

    console.log('✅ Адмін користувач успішно створено!');
    console.log('📋 Дані для входу:');
    console.log(`   Логін: ${admin.login}`);
    console.log(`   Пароль: ${adminData.password}`);
    console.log('\n⚠️  ВАЖЛИВО: Змініть пароль після першого входу!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Помилка при створенні адміна:', error);
    process.exit(1);
  }
};

createAdmin();

