const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const City = require('../models/City');
const Position = require('../models/Position');
const generateToken = require('../utils/generateToken');
const validateLogin = require('../utils/loginValidator');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Реєстрація користувача
// @access  Public
router.post('/register', [
  body('firstName').trim().notEmpty().withMessage('Ім\'я обов\'язкове'),
  body('lastName').trim().notEmpty().withMessage('Прізвище обов\'язкове'),
  body('login').trim().notEmpty().withMessage('Логін обов\'язковий'),
  body('password').isLength({ min: 6 }).withMessage('Пароль має містити мінімум 6 символів'),
  body('city').notEmpty().withMessage('Місто обов\'язкове'),
  body('position').notEmpty().withMessage('Посада обов\'язкова')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Помилки валідації',
        errors: errors.array()
      });
    }

    const { firstName, lastName, login, password, city, position } = req.body;

    // Валідація логіну
    const loginValidation = validateLogin(login);
    if (!loginValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: loginValidation.message
      });
    }

    // Перевірка чи існує користувач
    const userExists = await User.findOne({ login });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Користувач з таким логіном вже існує'
      });
    }

    // Перевірка чи існують місто та посада
    const cityExists = await City.findById(city);
    if (!cityExists || !cityExists.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Місто не знайдено або неактивне'
      });
    }

    const positionExists = await Position.findById(position);
    if (!positionExists || !positionExists.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Посада не знайдена або неактивна'
      });
    }

    // Створення користувача
    const user = await User.create({
      firstName,
      lastName,
      login,
      password,
      city,
      position
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Користувача успішно зареєстровано',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        login: user.login,
        city: user.city,
        position: user.position,
        role: user.role,
        coins: user.coins
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при реєстрації',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/login
// @desc    Вхід користувача
// @access  Public
router.post('/login', [
  body('login').trim().notEmpty().withMessage('Логін обов\'язковий'),
  body('password').notEmpty().withMessage('Пароль обов\'язковий')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Помилки валідації',
        errors: errors.array()
      });
    }

    let { login, password } = req.body;
    
    // Обрізати пробіли з логіну та паролю
    login = login?.trim();
    password = password?.trim();
    
    // Логування для діагностики (без пароля)
    console.log('Login attempt:', { 
      login, 
      loginLength: login?.length,
      passwordLength: password?.length 
    });

    // Знайти користувача з паролем (пошук нечутливий до регістру)
    const user = await User.findOne({ 
      $or: [
        { login: login },
        { login: new RegExp(`^${login}$`, 'i') }
      ]
    }).select('+password').populate('city position');
    
    if (!user) {
      console.log('User not found for login:', login);
      // Спробувати знайти всіх користувачів для діагностики
      const allUsers = await User.find({}).select('login');
      console.log('Available logins:', allUsers.map(u => u.login));
      return res.status(401).json({
        success: false,
        message: 'Невірний логін або пароль'
      });
    }

    console.log('User found:', { 
      login: user.login, 
      isActive: user.isActive,
      hasPassword: !!user.password 
    });

    if (!user.isActive) {
      console.log('User is inactive:', login);
      return res.status(401).json({
        success: false,
        message: 'Користувач деактивований'
      });
    }

    // Перевірка пароля
    if (!user.password) {
      console.log('User has no password hash:', login);
      return res.status(401).json({
        success: false,
        message: 'Невірний логін або пароль'
      });
    }

    const isMatch = await user.comparePassword(password);
    console.log('Password comparison result:', isMatch);
    
    if (!isMatch) {
      console.log('Password mismatch for login:', login);
      // Додаткова діагностика
      console.log('Stored password hash exists:', !!user.password);
      console.log('Provided password length:', password?.length);
      return res.status(401).json({
        success: false,
        message: 'Невірний логін або пароль'
      });
    }
    
    console.log('Login successful for user:', login);

    // Оновлення останнього входу
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Вхід успішний',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        login: user.login,
        city: user.city,
        position: user.position,
        role: user.role,
        coins: user.coins
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при вході',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/auth/check-login
// @desc    Перевірити унікальність логіну
// @access  Public
router.get('/check-login', async (req, res) => {
  try {
    const { login } = req.query;
    
    if (!login) {
      return res.status(400).json({
        success: false,
        message: 'Логін обов\'язковий'
      });
    }

    // Валідація формату логіну
    const loginValidation = validateLogin(login);
    if (!loginValidation.isValid) {
      return res.json({
        success: true,
        available: false,
        message: loginValidation.message
      });
    }

    // Перевірка чи існує користувач
    const userExists = await User.findOne({ login });
    
    res.json({
      success: true,
      available: !userExists,
      message: userExists 
        ? 'Користувач з таким логіном вже існує' 
        : 'Логін доступний'
    });
  } catch (error) {
    console.error('Check login error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при перевірці логіну'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Отримати поточного користувача
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('city position');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні даних користувача'
    });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Змінити пароль користувача
// @access  Private
// @route   PUT /api/auth/push-token
// @desc    Зберегти push токен для нотифікацій
// @access  Private
router.put('/push-token', protect, [
  body('pushToken').notEmpty().withMessage('Push токен обов\'язковий')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Помилки валідації',
        errors: errors.array()
      });
    }

    const { pushToken } = req.body;
    const userId = req.user._id;

    console.log('Saving push token for user:', userId, 'token:', pushToken?.substring(0, 20) + '...');

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { pushToken: pushToken },
      { new: true, select: 'pushToken' }
    );

    console.log('Push token saved successfully. User pushToken:', updatedUser?.pushToken?.substring(0, 20) + '...');

    res.json({
      success: true,
      message: 'Push токен успішно збережено'
    });
  } catch (error) {
    console.error('Save push token error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при збереженні push токену'
    });
  }
});

router.put('/change-password', protect, [
  body('currentPassword').notEmpty().withMessage('Поточний пароль обов\'язковий'),
  body('newPassword').isLength({ min: 6 }).withMessage('Новий пароль має містити мінімум 6 символів')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Помилки валідації',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Знайти користувача з паролем
    const user = await User.findById(req.user._id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Користувача не знайдено'
      });
    }

    // Перевірка поточного пароля
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Поточний пароль невірний'
      });
    }

    // Перевірка, що новий пароль відрізняється від поточного
    const isSame = await user.comparePassword(newPassword);
    if (isSame) {
      return res.status(400).json({
        success: false,
        message: 'Новий пароль має відрізнятися від поточного'
      });
    }

    // Оновлення пароля
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Пароль успішно змінено'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при зміні паролю'
    });
  }
});

module.exports = router;

