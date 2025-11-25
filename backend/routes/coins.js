const express = require('express');
const User = require('../models/User');
const CoinTransaction = require('../models/CoinTransaction');
const { protect, authorize } = require('../middleware/auth');
const { sendTransactionApprovalNotification } = require('../services/pushNotifications');

const router = express.Router();

// @route   GET /api/coins/balance
// @desc    Отримати баланс монет користувача
// @access  Private
router.get('/balance', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('coins');

    res.json({
      success: true,
      data: {
        balance: user.coins || 0
      }
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні балансу'
    });
  }
});

// @route   GET /api/coins/history
// @desc    Отримати історію транзакцій монет
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query;
    const query = { user: req.user._id };

    if (type) query.type = type;
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const transactions = await CoinTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CoinTransaction.countDocuments(query);

    res.json({
      success: true,
      count: transactions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: transactions
    });
  } catch (error) {
    console.error('Get coin history error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні історії транзакцій'
    });
  }
});

// @route   POST /api/coins/manual-add
// @desc    Ручне нарахування монет (адмін)
// @access  Private/Admin
router.post('/manual-add', protect, authorize('admin'), async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID користувача та сума обов\'язкові'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Користувача не знайдено'
      });
    }

    // Оновити баланс
    await User.findByIdAndUpdate(userId, {
      $inc: { coins: amount }
    });

    // Створити транзакцію
    const transaction = await CoinTransaction.create({
      user: userId,
      type: 'manual_add',
      amount: amount,
      reason: reason || 'Ручне нарахування адміністратором',
      status: 'pending', // Потребує підтвердження
      approvedBy: null
    });

    res.status(201).json({
      success: true,
      message: 'Монети нараховано, очікується підтвердження',
      data: transaction
    });
  } catch (error) {
    console.error('Manual add coins error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при нарахуванні монет'
    });
  }
});

// @route   POST /api/coins/manual-subtract
// @desc    Ручне списання монет (адмін)
// @access  Private/Admin
router.post('/manual-subtract', protect, authorize('admin'), async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID користувача та сума обов\'язкові'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Користувача не знайдено'
      });
    }

    if (user.coins < amount) {
      return res.status(400).json({
        success: false,
        message: 'Недостатньо монет у користувача'
      });
    }

    // Оновити баланс
    await User.findByIdAndUpdate(userId, {
      $inc: { coins: -amount }
    });

    // Створити транзакцію
    const transaction = await CoinTransaction.create({
      user: userId,
      type: 'manual_subtract',
      amount: amount,
      reason: reason || 'Ручне списання адміністратором',
      status: 'pending', // Потребує підтвердження
      approvedBy: null
    });

    res.status(201).json({
      success: true,
      message: 'Монети списано, очікується підтвердження',
      data: transaction
    });
  } catch (error) {
    console.error('Manual subtract coins error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при списанні монет'
    });
  }
});

// @route   GET /api/coins/pending
// @desc    Отримати список транзакцій на підтвердження (адмін)
// @access  Private/Admin
router.get('/pending', protect, authorize('admin'), async (req, res) => {
  try {
    const transactions = await CoinTransaction.find({ status: 'pending' })
      .populate('user', 'firstName lastName login')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    console.error('Get pending transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні транзакцій на підтвердження'
    });
  }
});

// @route   GET /api/coins/pending-count
// @desc    Отримати кількість непідтверджених транзакцій (адмін)
// @access  Private/Admin
router.get('/pending-count', protect, authorize('admin'), async (req, res) => {
  try {
    const count = await CoinTransaction.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get pending transactions count error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні кількості транзакцій на підтвердження'
    });
  }
});

// @route   GET /api/coins/transactions/all
// @desc    Отримати всі транзакції з фільтрами (адмін)
// @access  Private/Admin
router.get('/transactions/all', protect, authorize('admin'), async (req, res) => {
  try {
    const { type, status, userId, startDate, endDate, page = 1, limit = 50 } = req.query;
    const query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (userId) query.user = userId;
    
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
      // Якщо тільки один параметр, ініціалізувати об'єкт
      if (Object.keys(query.createdAt).length === 0) {
        delete query.createdAt;
      }
    }

    const skip = (page - 1) * limit;

    const transactions = await CoinTransaction.find(query)
      .populate('user', 'firstName lastName login')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CoinTransaction.countDocuments(query);

    res.json({
      success: true,
      count: transactions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: transactions
    });
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні транзакцій'
    });
  }
});

// @route   POST /api/coins/transactions/:id/approve
// @desc    Підтвердити транзакцію (адмін)
// @access  Private/Admin
router.post('/transactions/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const transaction = await CoinTransaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Транзакцію не знайдено'
      });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Транзакція вже оброблена'
      });
    }

    transaction.status = 'approved';
    transaction.approvedBy = req.user._id;
    transaction.approvedAt = new Date();
    await transaction.save();

    // Відправити push-нотифікацію користувачу
    if (transaction.user && transaction.user.pushToken) {
      try {
        await sendTransactionApprovalNotification(
          transaction.user.pushToken,
          transaction.amount,
          transaction.reason
        );
      } catch (error) {
        console.error('Error sending transaction approval notification:', error);
        // Не блокуємо процес, якщо сповіщення не відправлено
      }
    }

    res.json({
      success: true,
      message: 'Транзакцію успішно підтверджено',
      data: transaction
    });
  } catch (error) {
    console.error('Approve transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при підтвердженні транзакції'
    });
  }
});

// @route   POST /api/coins/transactions/:id/reject
// @desc    Відхилити транзакцію (адмін)
// @access  Private/Admin
router.post('/transactions/:id/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const transaction = await CoinTransaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Транзакцію не знайдено'
      });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Транзакція вже оброблена'
      });
    }

    // Якщо це нарахування, повернути монети
    if (transaction.type === 'manual_add') {
      await User.findByIdAndUpdate(transaction.user, {
        $inc: { coins: -transaction.amount }
      });
    } else if (transaction.type === 'manual_subtract') {
      // Якщо це списання, повернути монети
      await User.findByIdAndUpdate(transaction.user, {
        $inc: { coins: transaction.amount }
      });
    }

    transaction.status = 'rejected';
    transaction.approvedBy = req.user._id;
    transaction.approvedAt = new Date();
    await transaction.save();

    res.json({
      success: true,
      message: 'Транзакцію відхилено',
      data: transaction
    });
  } catch (error) {
    console.error('Reject transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при відхиленні транзакції'
    });
  }
});

// @route   POST /api/coins/transactions/bulk-approve
// @desc    Масове підтвердження транзакцій (адмін)
// @access  Private/Admin
router.post('/transactions/bulk-approve', protect, authorize('admin'), async (req, res) => {
  try {
    const { transactionIds } = req.body;

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Список ID транзакцій обов\'язковий'
      });
    }

    const transactions = await CoinTransaction.find({
      _id: { $in: transactionIds },
      status: 'pending'
    });

    const results = {
      approved: [],
      failed: []
    };

    for (const transaction of transactions) {
      try {
        transaction.status = 'approved';
        transaction.approvedBy = req.user._id;
        transaction.approvedAt = new Date();
        await transaction.save();
        results.approved.push(transaction._id);
      } catch (error) {
        results.failed.push({
          id: transaction._id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Підтверджено ${results.approved.length} з ${transactionIds.length} транзакцій`,
      data: results
    });
  } catch (error) {
    console.error('Bulk approve transactions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Помилка при масовому підтвердженні транзакцій'
    });
  }
});

// @route   POST /api/coins/transactions/bulk-reject
// @desc    Масове відхилення транзакцій (адмін)
// @access  Private/Admin
router.post('/transactions/bulk-reject', protect, authorize('admin'), async (req, res) => {
  try {
    const { transactionIds, reason } = req.body;

    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Список ID транзакцій обов\'язковий'
      });
    }

    const transactions = await CoinTransaction.find({
      _id: { $in: transactionIds },
      status: 'pending'
    }).populate('user');

    const results = {
      rejected: [],
      failed: []
    };

    for (const transaction of transactions) {
      try {
        // Якщо це нарахування, повернути монети
        if (transaction.type === 'manual_add') {
          await User.findByIdAndUpdate(transaction.user._id, {
            $inc: { coins: -transaction.amount }
          });
        } else if (transaction.type === 'manual_subtract') {
          // Якщо це списання, повернути монети
          await User.findByIdAndUpdate(transaction.user._id, {
            $inc: { coins: transaction.amount }
          });
        }

        transaction.status = 'rejected';
        transaction.approvedBy = req.user._id;
        transaction.approvedAt = new Date();
        if (reason) {
          transaction.reason = (transaction.reason || '') + ' | Причина відхилення: ' + reason;
        }
        await transaction.save();
        results.rejected.push(transaction._id);
      } catch (error) {
        results.failed.push({
          id: transaction._id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Відхилено ${results.rejected.length} з ${transactionIds.length} транзакцій`,
      data: results
    });
  } catch (error) {
    console.error('Bulk reject transactions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Помилка при масовому відхиленні транзакцій'
    });
  }
});

module.exports = router;

