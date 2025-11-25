const express = require('express');
const City = require('../models/City');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/cities
// @desc    Отримати список міст
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

    const cities = await City.find(query).sort({ name: 1 });

    res.json({
      success: true,
      count: cities.length,
      data: cities
    });
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні міст'
    });
  }
});

// @route   GET /api/cities/:id
// @desc    Отримати місто по ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const city = await City.findById(req.params.id);

    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'Місто не знайдено'
      });
    }

    res.json({
      success: true,
      data: city
    });
  } catch (error) {
    console.error('Get city error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні міста'
    });
  }
});

// @route   POST /api/cities
// @desc    Створити місто
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Назва міста обов\'язкова'
      });
    }

    const city = await City.create({ name });

    res.status(201).json({
      success: true,
      message: 'Місто успішно створено',
      data: city
    });
  } catch (error) {
    console.error('Create city error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Місто з такою назвою вже існує'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Помилка при створенні міста'
    });
  }
});

// @route   PUT /api/cities/:id
// @desc    Оновити місто
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, isActive } = req.body;

    const city = await City.findByIdAndUpdate(
      req.params.id,
      { name, isActive },
      { new: true, runValidators: true }
    );

    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'Місто не знайдено'
      });
    }

    res.json({
      success: true,
      message: 'Місто успішно оновлено',
      data: city
    });
  } catch (error) {
    console.error('Update city error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при оновленні міста'
    });
  }
});

// @route   POST /api/cities/bulk-update
// @desc    Масове оновлення міст (активація/деактивація)
// @access  Private/Admin
router.post('/bulk-update', protect, authorize('admin'), async (req, res) => {
  try {
    const { cityIds, isActive } = req.body;

    if (!Array.isArray(cityIds) || cityIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Необхідно вказати масив ID міст'
      });
    }

    if (isActive === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Необхідно вказати значення isActive'
      });
    }

    const result = await City.updateMany(
      { _id: { $in: cityIds } },
      { $set: { isActive } }
    );

    res.json({
      success: true,
      message: `Успішно оновлено ${result.modifiedCount} міст`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update cities error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при масовому оновленні міст'
    });
  }
});

// @route   DELETE /api/cities/:id
// @desc    Видалити місто
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const city = await City.findById(req.params.id);

    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'Місто не знайдено'
      });
    }

    await city.deleteOne();

    res.json({
      success: true,
      message: 'Місто успішно видалено'
    });
  } catch (error) {
    console.error('Delete city error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при видаленні міста'
    });
  }
});

module.exports = router;

