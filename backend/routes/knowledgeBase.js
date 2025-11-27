const express = require('express');
const path = require('path');
const fs = require('fs');
const KnowledgeBase = require('../models/KnowledgeBase');
const Comment = require('../models/Comment');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();


router.get('/', async (req, res) => {
  try {
    const { category, search, active, position, page = 1, limit = 10 } = req.query;
    const query = {};

    if (category) query.category = category;
    
    // За замовчуванням показуємо тільки активні статті (якщо параметр active не передано явно)
    if (active !== undefined) {
      query.isActive = active === 'true';
    } else {
      // За замовчуванням тільки активні статті для звичайних користувачів
      query.isActive = true;
    }
    
    if (search) {
      query.$text = { $search: search };
    }
  
    if (position) {
      // Знайти статті, де масив positions містить позицію користувача
      query.positions = { $in: [position] };
      console.log('Filtering articles by position:', position);
    } else {
      console.log('No position filter - showing all articles');
    }

    const skip = (page - 1) * limit;

    const articles = await KnowledgeBase.find(query)
      .populate('category', 'name')
      .populate('positions', 'name')
      .select(search ? { score: { $meta: 'textScore' } } : '')
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log(`Found ${articles.length} articles for query:`, JSON.stringify(query));

    const total = await KnowledgeBase.countDocuments(query);

    res.json({
      success: true,
      count: articles.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: articles
    });
  } catch (error) {
    console.error('Get knowledge base articles error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні статей'
    });
  }
});

// @route   GET /api/knowledge-base/category/:categoryId
// @desc    Отримати статті по категорії
// @access  Public
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { position } = req.query;
    const query = {
      category: req.params.categoryId,
      isActive: true
    };
    
    // Фільтр по посаді якщо вказано
    // Стаття може бути прив'язана до кількох позицій, тому використовуємо $in
    if (position) {
      query.positions = { $in: [position] };
    }
    
    const articles = await KnowledgeBase.find(query)
      .populate('category', 'name')
      .populate('positions', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: articles.length,
      data: articles
    });
  } catch (error) {
    console.error('Get articles by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні статей'
    });
  }
});

// @route   GET /api/knowledge-base/access-status
// @desc    Отримати статус доступу до бази знань
// @access  Public
router.get('/access-status', async (req, res) => {
  try {
    const SystemSettings = require('../models/SystemSettings');
    const settings = await SystemSettings.getSettings();
    
    // За замовчуванням доступ відкритий, якщо налаштування не встановлено
    const isAccessEnabled = settings.knowledgeBaseAccess !== 'closed';
    
    res.json({
      success: true,
      data: {
        isAccessEnabled,
        accessStatus: settings.knowledgeBaseAccess || 'open'
      }
    });
  } catch (error) {
    console.error('Get access status error:', error);
    // За замовчуванням доступ відкритий при помилці
    res.json({
      success: true,
      data: {
        isAccessEnabled: true,
        accessStatus: 'open'
      }
    });
  }
});

// @route   GET /api/knowledge-base/:id
// @desc    Отримати статтю по ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const article = await KnowledgeBase.findById(req.params.id)
      .populate('category', 'name');

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Статтю не знайдено'
      });
    }

    // Збільшити кількість переглядів
    article.views += 1;
    await article.save();

    res.json({
      success: true,
      data: article
    });
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні статті'
    });
  }
});

// @route   POST /api/knowledge-base
// @desc    Створити статтю з можливістю завантаження зображення
// @access  Private/Admin
router.post('/', protect, authorize('admin'), upload.single('image'), async (req, res) => {
  try {
    const { title, content, category, tags, positions } = req.body;
    const image = req.file ? `/uploads/images/${req.file.filename}` : null;

    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        message: 'Заголовок, контент та категорія обов\'язкові'
      });
    }

    // Перевірка позицій
    let positionsArray = [];
    if (positions) {
      positionsArray = Array.isArray(positions) ? positions : JSON.parse(positions);
    }
    
    if (!positionsArray || positionsArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Необхідно вибрати хоча б одну посаду'
      });
    }

    const article = await KnowledgeBase.create({
      title,
      content,
      category,
      image,
      tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [],
      positions: positionsArray
    });

    res.status(201).json({
      success: true,
      message: 'Статтю успішно створено',
      data: article
    });
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при створенні статті'
    });
  }
});

// @route   PUT /api/knowledge-base/:id
// @desc    Оновити статтю з можливістю завантаження/видалення зображення
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), upload.single('image'), async (req, res) => {
  try {
    const { title, content, category, tags, isActive, deleteImage, positions } = req.body;
    
    const article = await KnowledgeBase.findById(req.params.id);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Статтю не знайдено'
      });
    }

    let image = article.image;

    // Видалити старе зображення якщо потрібно
    if (deleteImage === 'true' && article.image) {
      const oldImagePath = path.join(__dirname, '..', article.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      image = null;
    }

    // Завантажити нове зображення якщо є
    if (req.file) {
      // Видалити старе зображення якщо воно було
      if (article.image) {
        const oldImagePath = path.join(__dirname, '..', article.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      image = `/uploads/images/${req.file.filename}`;
    }

    // Обробка позицій
    if (positions !== undefined) {
      const positionsArray = Array.isArray(positions) ? positions : JSON.parse(positions);
      if (!positionsArray || positionsArray.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Необхідно вибрати хоча б одну посаду'
        });
      }
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (category) updateData.category = category;
    if (image !== undefined) updateData.image = image;
    if (tags) updateData.tags = Array.isArray(tags) ? tags : JSON.parse(tags);
    if (isActive !== undefined) updateData.isActive = isActive;
    if (positions !== undefined) {
      updateData.positions = Array.isArray(positions) ? positions : JSON.parse(positions);
    }

    const updatedArticle = await KnowledgeBase.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name');

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Статтю не знайдено'
      });
    }

    res.json({
      success: true,
      message: 'Статтю успішно оновлено',
      data: updatedArticle
    });
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при оновленні статті'
    });
  }
});

// @route   DELETE /api/knowledge-base/:id
// @desc    Видалити статтю
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const article = await KnowledgeBase.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Статтю не знайдено'
      });
    }

    // Видалити зображення якщо є
    if (article.image) {
      const imagePath = path.join(__dirname, '..', article.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await article.deleteOne();

    res.json({
      success: true,
      message: 'Статтю успішно видалено'
    });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при видаленні статті'
    });
  }
});

// @route   GET /api/knowledge-base/:id/comments
// @desc    Отримати коментарі до статті
// @access  Public
router.get('/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ article: req.params.id })
      .populate('user', 'firstName lastName')
      .populate('parentComment')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні коментарів'
    });
  }
});

// @route   POST /api/knowledge-base/:id/comments
// @desc    Додати коментар до статті
// @access  Private
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { text, parentComment } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Текст коментаря обов\'язковий'
      });
    }

    const comment = await Comment.create({
      user: req.user._id,
      article: req.params.id,
      text,
      parentComment: parentComment || null
    });

    await comment.populate('user', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Коментар успішно додано',
      data: comment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при додаванні коментаря'
    });
  }
});

// @route   PUT /api/knowledge-base/comments/:id
// @desc    Оновити коментар
// @access  Private
router.put('/comments/:id', protect, async (req, res) => {
  try {
    const { text } = req.body;

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Коментар не знайдено'
      });
    }

    // Користувач може редагувати тільки свої коментарі
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Немає доступу до редагування цього коментаря'
      });
    }

    comment.text = text;
    comment.isEdited = true;
    await comment.save();

    await comment.populate('user', 'firstName lastName');

    res.json({
      success: true,
      message: 'Коментар успішно оновлено',
      data: comment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при оновленні коментаря'
    });
  }
});

// @route   DELETE /api/knowledge-base/comments/:id
// @desc    Видалити коментар
// @access  Private
router.delete('/comments/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Коментар не знайдено'
      });
    }

    // Користувач може видаляти тільки свої коментарі, адмін - будь-які
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Немає доступу до видалення цього коментаря'
      });
    }

    await comment.deleteOne();

    res.json({
      success: true,
      message: 'Коментар успішно видалено'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при видаленні коментаря'
    });
  }
});

// @route   POST /api/knowledge-base/comments/:id/like
// @desc    Лайкнути/дизлайкнути коментар
// @access  Private
router.post('/comments/:id/like', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Коментар не знайдено'
      });
    }

    const userId = req.user._id.toString();
    const likes = comment.likes.map(id => id.toString());
    const isLiked = likes.includes(userId);

    if (isLiked) {
      // Видалити лайк
      comment.likes = comment.likes.filter(id => id.toString() !== userId);
    } else {
      // Додати лайк
      comment.likes.push(userId);
    }

    await comment.save();

    res.json({
      success: true,
      message: isLiked ? 'Лайк видалено' : 'Коментар лайкнуто',
      data: {
        likesCount: comment.likes.length,
        isLiked: !isLiked
      }
    });
  } catch (error) {
    console.error('Like comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при лайку коментаря'
    });
  }
});

module.exports = router;

