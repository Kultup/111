const express = require('express');
const Category = require('../models/Category');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/categories
// @desc    Отримати список категорій
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

    const categories = await Category.find(query).sort({ name: 1 });

    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні категорій'
    });
  }
});

// @route   GET /api/categories/:id
// @desc    Отримати категорію по ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Категорію не знайдено'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні категорії'
    });
  }
});

// @route   POST /api/categories
// @desc    Створити категорію
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Назва категорії обов\'язкова'
      });
    }

    const category = await Category.create({ name, description });

    res.status(201).json({
      success: true,
      message: 'Категорію успішно створено',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при створенні категорії'
    });
  }
});

// @route   PUT /api/categories/:id
// @desc    Оновити категорію
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, isActive },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Категорію не знайдено'
      });
    }

    res.json({
      success: true,
      message: 'Категорію успішно оновлено',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при оновленні категорії'
    });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Видалити категорію
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Категорію не знайдено'
      });
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: 'Категорію успішно видалено'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при видаленні категорії'
    });
  }
});

module.exports = router;

