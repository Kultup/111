const express = require('express');
const ShopItem = require('../models/ShopItem');
const UserPurchase = require('../models/UserPurchase');
const { protect, authorize } = require('../middleware/auth');
const { purchaseItem, approvePurchase, rejectPurchase, bulkApprovePurchases, bulkRejectPurchases } = require('../services/shopService');
const upload = require('../middleware/upload');

const router = express.Router();

// @route   GET /api/shop/items
// @desc    Отримати список товарів
// @access  Public
router.get('/items', async (req, res) => {
  try {
    const { type, active, search } = req.query;
    const query = {};

    if (type) query.type = type;
    if (active !== undefined) query.isActive = active === 'true';
    
    // Фільтрувати товари: прибрати ті, яких немає в наявності
    // stock === -1 означає необмежену кількість (завжди в наявності)
    // stock > 0 означає, що товар є в наявності
    // stock <= 0 (але stock !== -1) означає, що товар не в наявності - не показувати
    const stockCondition = {
      $or: [
        { stock: -1 }, // Товари без обмежень (завжди в наявності)
        { stock: { $gt: 0 } } // Товари з наявністю > 0
      ]
    };
    
    // Якщо є пошук, об'єднати умови через $and
    if (search) {
      query.$and = [
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        },
        stockCondition
      ];
    } else {
      // Якщо пошуку немає, просто додати умову наявності
      Object.assign(query, stockCondition);
    }

    const items = await ShopItem.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error('Get shop items error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні товарів'
    });
  }
});

// @route   GET /api/shop/items/:id
// @desc    Отримати товар по ID
// @access  Public
router.get('/items/:id', async (req, res) => {
  try {
    const item = await ShopItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Товар не знайдено'
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Get shop item error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні товару'
    });
  }
});

// @route   POST /api/shop/items
// @desc    Створити товар
// @access  Private/Admin
router.post('/items', protect, authorize('admin'), upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, type, image, stock, requiresApproval } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Назва та ціна обов\'язкові'
      });
    }

    // Якщо завантажено файл, використовуємо його шлях
    let imagePath = image;
    if (req.file) {
      imagePath = `/uploads/images/${req.file.filename}`;
    }

    const item = await ShopItem.create({
      name,
      description,
      price,
      type: type || 'other',
      image: imagePath,
      stock: stock !== undefined ? stock : -1,
      requiresApproval: requiresApproval !== undefined ? requiresApproval : true
    });

    res.status(201).json({
      success: true,
      message: 'Товар успішно створено',
      data: item
    });
  } catch (error) {
    console.error('Create shop item error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при створенні товару'
    });
  }
});

// @route   PUT /api/shop/items/:id
// @desc    Оновити товар
// @access  Private/Admin
router.put('/items/:id', protect, authorize('admin'), upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, type, image, stock, isActive, requiresApproval } = req.body;

    // Якщо завантажено новий файл, використовуємо його шлях
    let imagePath = image;
    if (req.file) {
      imagePath = `/uploads/images/${req.file.filename}`;
      // Видалити старе зображення, якщо воно було
      const oldItem = await ShopItem.findById(req.params.id);
      if (oldItem && oldItem.image && oldItem.image.startsWith('/uploads/images/')) {
        const fs = require('fs');
        const path = require('path');
        const oldImagePath = path.join(__dirname, '..', oldItem.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    const item = await ShopItem.findByIdAndUpdate(
      req.params.id,
      { name, description, price, type, image: imagePath, stock, isActive, requiresApproval },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Товар не знайдено'
      });
    }

    res.json({
      success: true,
      message: 'Товар успішно оновлено',
      data: item
    });
  } catch (error) {
    console.error('Update shop item error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при оновленні товару'
    });
  }
});

// @route   POST /api/shop/items/bulk-update
// @desc    Масове оновлення товарів (активація/деактивація)
// @access  Private/Admin
router.post('/items/bulk-update', protect, authorize('admin'), async (req, res) => {
  try {
    const { itemIds, isActive } = req.body;

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Необхідно вказати масив ID товарів'
      });
    }

    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Необхідно вказати значення isActive'
      });
    }

    const result = await ShopItem.updateMany(
      { _id: { $in: itemIds } },
      { $set: { isActive } }
    );

    res.json({
      success: true,
      message: `Успішно оновлено ${result.modifiedCount} товарів`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update shop items error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при масовому оновленні товарів'
    });
  }
});

// @route   DELETE /api/shop/items/:id
// @desc    Видалити товар
// @access  Private/Admin
router.delete('/items/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const item = await ShopItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Товар не знайдено'
      });
    }

    await item.deleteOne();

    res.json({
      success: true,
      message: 'Товар успішно видалено'
    });
  } catch (error) {
    console.error('Delete shop item error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при видаленні товару'
    });
  }
});

// @route   POST /api/shop/purchase
// @desc    Купити товар
// @access  Private
router.post('/purchase', protect, async (req, res) => {
  try {
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: 'ID товару обов\'язковий'
      });
    }

    const purchase = await purchaseItem(req.user._id, itemId);

    res.status(201).json({
      success: true,
      message: purchase.status === 'pending' 
        ? 'Покупка створена, очікується підтвердження' 
        : 'Покупка успішно завершена',
      data: purchase
    });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Помилка при покупці товару'
    });
  }
});

// @route   GET /api/shop/purchases
// @desc    Отримати історію покупок користувача
// @access  Private
router.get('/purchases', protect, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { user: req.user._id };

    if (status) query.status = status;

    const purchases = await UserPurchase.find(query)
      .populate('item', 'name description image type')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: purchases.length,
      data: purchases
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні покупок'
    });
  }
});

// @route   GET /api/shop/purchases/pending
// @desc    Отримати список покупок на підтвердження (адмін)
// @access  Private/Admin
router.get('/purchases/pending', protect, authorize('admin'), async (req, res) => {
  try {
    const purchases = await UserPurchase.find({ status: 'pending' })
      .populate('item', 'name description image type price')
      .populate('user', 'firstName lastName login')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      count: purchases.length,
      data: purchases
    });
  } catch (error) {
    console.error('Get pending purchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні покупок на підтвердження'
    });
  }
});

// @route   GET /api/shop/pending-count
// @desc    Отримати кількість непідтверджених покупок (адмін)
// @access  Private/Admin
router.get('/pending-count', protect, authorize('admin'), async (req, res) => {
  try {
    const count = await UserPurchase.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get pending purchases count error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні кількості покупок на підтвердження'
    });
  }
});

// @route   GET /api/shop/purchases/all
// @desc    Отримати всі покупки з фільтрами (адмін)
// @access  Private/Admin
router.get('/purchases/all', protect, authorize('admin'), async (req, res) => {
  try {
    const { status, userId, startDate, endDate, page = 1, limit = 50 } = req.query;
    const query = {};

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

    const purchases = await UserPurchase.find(query)
      .populate('item', 'name description image type price')
      .populate('user', 'firstName lastName login')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await UserPurchase.countDocuments(query);

    res.json({
      success: true,
      count: purchases.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: purchases
    });
  } catch (error) {
    console.error('Get all purchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні покупок'
    });
  }
});

// @route   POST /api/shop/purchases/:id/approve
// @desc    Підтвердити покупку (адмін)
// @access  Private/Admin
router.post('/purchases/:id/approve', protect, authorize('admin'), async (req, res) => {
  try {
    const purchase = await approvePurchase(req.params.id, req.user._id);

    res.json({
      success: true,
      message: 'Покупку успішно підтверджено',
      data: purchase
    });
  } catch (error) {
    console.error('Approve purchase error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Помилка при підтвердженні покупки'
    });
  }
});

// @route   POST /api/shop/purchases/:id/reject
// @desc    Відхилити покупку (адмін)
// @access  Private/Admin
router.post('/purchases/:id/reject', protect, authorize('admin'), async (req, res) => {
  try {
    const { reason } = req.body;

    const purchase = await rejectPurchase(req.params.id, req.user._id, reason);

    res.json({
      success: true,
      message: 'Покупку відхилено, монети повернено',
      data: purchase
    });
  } catch (error) {
    console.error('Reject purchase error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Помилка при відхиленні покупки'
    });
  }
});

// @route   POST /api/shop/purchases/bulk-approve
// @desc    Масове підтвердження покупок (адмін)
// @access  Private/Admin
router.post('/purchases/bulk-approve', protect, authorize('admin'), async (req, res) => {
  try {
    const { purchaseIds } = req.body;

    if (!purchaseIds || !Array.isArray(purchaseIds) || purchaseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Список ID покупок обов\'язковий'
      });
    }

    const results = await bulkApprovePurchases(purchaseIds, req.user._id);

    res.json({
      success: true,
      message: `Підтверджено ${results.approved.length} з ${purchaseIds.length} покупок`,
      data: results
    });
  } catch (error) {
    console.error('Bulk approve purchases error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Помилка при масовому підтвердженні покупок'
    });
  }
});

// @route   POST /api/shop/purchases/bulk-reject
// @desc    Масове відхилення покупок (адмін)
// @access  Private/Admin
router.post('/purchases/bulk-reject', protect, authorize('admin'), async (req, res) => {
  try {
    const { purchaseIds, reason } = req.body;

    if (!purchaseIds || !Array.isArray(purchaseIds) || purchaseIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Список ID покупок обов\'язковий'
      });
    }

    const results = await bulkRejectPurchases(purchaseIds, req.user._id, reason);

    res.json({
      success: true,
      message: `Відхилено ${results.rejected.length} з ${purchaseIds.length} покупок`,
      data: results
    });
  } catch (error) {
    console.error('Bulk reject purchases error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Помилка при масовому відхиленні покупок'
    });
  }
});

// @route   GET /api/shop/stats
// @desc    Отримати статистику по покупках (найпопулярніші товари, загальна статистика)
// @access  Private/Admin
router.get('/stats', protect, authorize('admin'), async (req, res) => {
  try {
    const ShopItem = require('../models/ShopItem');
    
    // Загальна статистика
    const totalPurchases = await UserPurchase.countDocuments();
    const approvedPurchases = await UserPurchase.countDocuments({ status: 'approved' });
    const pendingPurchases = await UserPurchase.countDocuments({ status: 'pending' });
    const rejectedPurchases = await UserPurchase.countDocuments({ status: 'rejected' });
    const completedPurchases = await UserPurchase.countDocuments({ status: 'completed' });
    
    const totalRevenue = await UserPurchase.aggregate([
      { $match: { status: { $in: ['approved', 'completed'] } } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    const totalRevenueCoins = totalRevenue.length > 0 ? totalRevenue[0].total : 0;
    
    // Статистика по товарах
    const itemStats = await UserPurchase.aggregate([
      {
        $group: {
          _id: '$item',
          purchaseCount: { $sum: 1 },
          totalRevenue: { $sum: '$price' },
          approvedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
        }
      },
      {
        $sort: { purchaseCount: -1 }
      },
      {
        $limit: 20 // Топ 20 товарів
      }
    ]);
    
    // Отримати інформацію про товари
    const itemsWithInfo = await Promise.all(
      itemStats.map(async (stat) => {
        const item = await ShopItem.findById(stat._id);
        return {
          item: item ? {
            _id: item._id,
            name: item.name,
            description: item.description,
            image: item.image,
            type: item.type,
            price: item.price,
          } : null,
          purchaseCount: stat.purchaseCount,
          totalRevenue: stat.totalRevenue,
          approvedCount: stat.approvedCount,
          completedCount: stat.completedCount,
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        summary: {
          totalPurchases,
          approvedPurchases,
          pendingPurchases,
          rejectedPurchases,
          completedPurchases,
          totalRevenueCoins,
        },
        topItems: itemsWithInfo.filter(i => i.item !== null),
      }
    });
  } catch (error) {
    console.error('Get shop stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні статистики покупок'
    });
  }
});

module.exports = router;

