const express = require('express');
const Position = require('../models/Position');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/positions
// @desc    Отримати список посад
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { search, active } = req.query;
    const query = {};

    if (active !== undefined) {
      query.isActive = active === 'true';
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const positions = await Position.find(query).sort({ name: 1 });

    res.json({
      success: true,
      count: positions.length,
      data: positions
    });
  } catch (error) {
    console.error('Get positions error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні посад'
    });
  }
});

// @route   GET /api/positions/:id
// @desc    Отримати посаду по ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const position = await Position.findById(req.params.id);

    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Посаду не знайдено'
      });
    }

    res.json({
      success: true,
      data: position
    });
  } catch (error) {
    console.error('Get position error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні посади'
    });
  }
});

// @route   POST /api/positions
// @desc    Створити посаду
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Назва посади обов\'язкова'
      });
    }

    const position = await Position.create({ name });

    res.status(201).json({
      success: true,
      message: 'Посаду успішно створено',
      data: position
    });
  } catch (error) {
    console.error('Create position error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Посада з такою назвою вже існує'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Помилка при створенні посади'
    });
  }
});

// @route   PUT /api/positions/:id
// @desc    Оновити посаду
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, isActive } = req.body;

    const position = await Position.findByIdAndUpdate(
      req.params.id,
      { name, isActive },
      { new: true, runValidators: true }
    );

    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Посаду не знайдено'
      });
    }

    res.json({
      success: true,
      message: 'Посаду успішно оновлено',
      data: position
    });
  } catch (error) {
    console.error('Update position error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при оновленні посади'
    });
  }
});

// @route   POST /api/positions/bulk-update
// @desc    Масове оновлення посад (активація/деактивація)
// @access  Private/Admin
router.post('/bulk-update', protect, authorize('admin'), async (req, res) => {
  try {
    const { positionIds, isActive } = req.body;

    if (!Array.isArray(positionIds) || positionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Необхідно вказати масив ID посад'
      });
    }

    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Необхідно вказати значення isActive'
      });
    }

    const result = await Position.updateMany(
      { _id: { $in: positionIds } },
      { $set: { isActive } }
    );

    res.json({
      success: true,
      message: `Успішно оновлено ${result.modifiedCount} посад`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update positions error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при масовому оновленні посад'
    });
  }
});

// @route   DELETE /api/positions/:id
// @desc    Видалити посаду
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const position = await Position.findById(req.params.id);

    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Посаду не знайдено'
      });
    }

    await position.deleteOne();

    res.json({
      success: true,
      message: 'Посаду успішно видалено'
    });
  } catch (error) {
    console.error('Delete position error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при видаленні посади'
    });
  }
});

module.exports = router;

