const express = require('express');
const { body, validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const Question = require('../models/Question');
const Category = require('../models/Category');
const Position = require('../models/Position');
const { protect, authorize, optionalProtect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const uploadExcel = require('../middleware/uploadExcel');

const router = express.Router();

// @route   GET /api/questions
// @desc    Отримати список питань
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, search, difficulty, active, position, page = 1, limit = 10 } = req.query;
    const query = {};

    if (category) query.category = category;
    if (difficulty) query.difficulty = parseInt(difficulty);
    if (active !== undefined) query.isActive = active === 'true';
    if (search) {
      query.$or = [
        { text: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Фільтр по посаді: питання для конкретної посади
    if (position) {
      query.positions = position;
    }

    const skip = (page - 1) * limit;

    const questions = await Question.find(query)
      .populate('category', 'name')
      .populate('positions', 'name')
      .select('-answers.isCorrect') // Не показувати правильну відповідь для звичайних користувачів
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Для адмінів показувати правильні відповіді
    if (req.user && req.user.role === 'admin') {
      const adminQuestions = await Question.find(query)
        .populate('category', 'name')
        .populate('positions', 'name')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });
      
      return res.json({
        success: true,
        count: adminQuestions.length,
        total: await Question.countDocuments(query),
        page: parseInt(page),
        pages: Math.ceil((await Question.countDocuments(query)) / limit),
        data: adminQuestions
      });
    }

    const total = await Question.countDocuments(query);

    res.json({
      success: true,
      count: questions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: questions
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні питань'
    });
  }
});

// @route   GET /api/questions/:id
// @desc    Отримати питання по ID
// @access  Public (з опціональною авторизацією для адмінів)
router.get('/:id', optionalProtect, async (req, res) => {
  try {
    // Логування для діагностики
    console.log('=== GET /api/questions/:id ===');
    console.log('Question ID:', req.params.id);
    console.log('req.user:', req.user ? { _id: req.user._id, role: req.user.role } : 'null');
    console.log('req.user?.role:', req.user?.role);
    
    let question = await Question.findById(req.params.id)
      .populate('category', 'name')
      .populate('positions', 'name');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Питання не знайдено'
      });
    }

    // Для адміністраторів показувати всі дані включаючи правильні відповіді
    const isAdmin = req.user && req.user.role === 'admin';
    console.log('Is admin?', isAdmin);
    
    if (isAdmin) {
      // Логування для діагностики
      console.log('Admin requesting question:', req.params.id);
      console.log('User role:', req.user.role);
      console.log('Question answers (raw):', question.answers);
      console.log('Question answers (mapped):', question.answers.map(a => ({ 
        text: a.text, 
        isCorrect: a.isCorrect,
        isCorrectType: typeof a.isCorrect,
        isCorrectValue: a.isCorrect
      })));
      
      // Для адмінів повертаємо повні дані з правильними відповідями
      const questionData = question.toObject();
      console.log('Returning question data with answers:', questionData.answers.map(a => ({ 
        text: a.text, 
        isCorrect: a.isCorrect,
        isCorrectType: typeof a.isCorrect
      })));
      
      // Відключити кешування для адмінів
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      return res.json({
        success: true,
        data: questionData
      });
    }

    // Для звичайних користувачів не показувати правильну відповідь
    question = question.toObject();
    question.answers = question.answers.map(answer => ({
      text: answer.text,
      isCorrect: undefined // Приховати правильну відповідь
    }));

    res.json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при отриманні питання'
    });
  }
});

// @route   POST /api/questions
// @desc    Створити питання з можливістю завантаження зображення
// @access  Private/Admin
router.post('/', protect, authorize('admin'), upload.single('image'), [
  body('text').trim().notEmpty().withMessage('Текст питання обов\'язковий'),
  body('category').notEmpty().withMessage('Категорія обов\'язкова'),
  body('answers').custom((value) => {
    let answersArray = [];
    if (Array.isArray(value)) {
      answersArray = value;
    } else if (typeof value === 'string') {
      try {
        answersArray = JSON.parse(value);
      } catch {
        throw new Error('Невірний формат відповідей');
      }
    }
    if (!Array.isArray(answersArray) || answersArray.length < 2) {
      throw new Error('Має бути мінімум 2 варіанти відповідей');
    }
    return true;
  }),
  body('positions').custom((value) => {
    if (!value) {
      throw new Error('Посади обов\'язкові');
    }
    let positionsArray = [];
    if (Array.isArray(value)) {
      positionsArray = value;
    } else if (typeof value === 'string') {
      try {
        positionsArray = JSON.parse(value);
      } catch {
        positionsArray = value ? [value] : [];
      }
    }
    if (!Array.isArray(positionsArray) || positionsArray.length === 0) {
      throw new Error('Необхідно вибрати хоча б одну посаду');
    }
    return true;
  })
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

    const { text, category, answers, explanation, difficulty, positions } = req.body;
    const image = req.file ? `/uploads/images/${req.file.filename}` : null;
    
    // Обробити answers - може бути JSON-рядок
    let answersArray = [];
    if (answers) {
      if (Array.isArray(answers)) {
        answersArray = answers;
      } else if (typeof answers === 'string') {
        try {
          answersArray = JSON.parse(answers);
        } catch {
          return res.status(400).json({
            success: false,
            message: 'Невірний формат відповідей'
          });
        }
      }
    }
    
    // Перевірка кількості відповідей
    if (!Array.isArray(answersArray) || answersArray.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Має бути мінімум 2 варіанти відповідей'
      });
    }
    
    // Перевірка що всі відповіді мають текст
    const emptyAnswers = answersArray.some(a => !a.text || !a.text.trim());
    if (emptyAnswers) {
      return res.status(400).json({
        success: false,
        message: 'Всі варіанти відповідей мають бути заповнені'
      });
    }
    
    // Обробити positions - обов'язкове поле
    let positionsArray = [];
    if (positions) {
      if (Array.isArray(positions)) {
        positionsArray = positions;
      } else if (typeof positions === 'string') {
        try {
          positionsArray = JSON.parse(positions);
        } catch {
          positionsArray = positions ? [positions] : [];
        }
      }
    }
    
    // Перевірка що вибрано хоча б одну посаду
    if (positionsArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Необхідно вибрати хоча б одну посаду'
      });
    }

    // Перевірка що є рівно одна правильна відповідь
    const correctAnswers = answersArray.filter(a => a.isCorrect);
    if (correctAnswers.length !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Має бути рівно одна правильна відповідь'
      });
    }

    const question = await Question.create({
      text,
      category,
      answers: answersArray,
      explanation,
      difficulty: difficulty ? parseInt(difficulty) : 3,
      image,
      positions: positionsArray
    });

    res.status(201).json({
      success: true,
      message: 'Питання успішно створено',
      data: question
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при створенні питання',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/questions/:id
// @desc    Оновити питання з можливістю завантаження/видалення зображення
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), upload.single('image'), async (req, res) => {
  try {
    const { text, category, answers, explanation, difficulty, isActive, deleteImage, positions } = req.body;
    
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Питання не знайдено'
      });
    }

    let image = question.image;

    // Видалити старе зображення якщо потрібно
    if (deleteImage === 'true' && question.image) {
      const oldImagePath = path.join(__dirname, '..', question.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      image = null;
    }

    // Завантажити нове зображення якщо є
    if (req.file) {
      // Видалити старе зображення якщо воно було
      if (question.image) {
        const oldImagePath = path.join(__dirname, '..', question.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      image = `/uploads/images/${req.file.filename}`;
    }

    // Якщо оновлюються відповіді, перевірити що є рівно одна правильна
    if (answers) {
      const correctAnswers = answers.filter(a => a.isCorrect);
      if (correctAnswers.length !== 1) {
        return res.status(400).json({
          success: false,
          message: 'Має бути рівно одна правильна відповідь'
        });
      }
    }

    // Обробити positions - обов'язкове поле при оновленні
    let positionsArray = undefined;
    if (positions !== undefined) {
      if (Array.isArray(positions)) {
        positionsArray = positions;
      } else if (typeof positions === 'string') {
        try {
          positionsArray = JSON.parse(positions);
        } catch {
          positionsArray = positions ? [positions] : [];
        }
      } else {
        positionsArray = [];
      }
      
      // Перевірка що вибрано хоча б одну посаду
      if (positionsArray.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Необхідно вибрати хоча б одну посаду'
        });
      }
    }

    const updateData = {};
    if (text) updateData.text = text;
    if (category) updateData.category = category;
    if (answers) updateData.answers = answers;
    if (explanation !== undefined) updateData.explanation = explanation;
    if (difficulty) updateData.difficulty = difficulty;
    if (image !== undefined) updateData.image = image;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (positionsArray !== undefined) updateData.positions = positionsArray;

    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'name')
     .populate('positions', 'name');

    res.json({
      success: true,
      message: 'Питання успішно оновлено',
      data: updatedQuestion
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при оновленні питання'
    });
  }
});

// @route   DELETE /api/questions/:id
// @desc    Видалити питання
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Питання не знайдено'
      });
    }

    // Видалити зображення якщо є
    if (question.image) {
      const imagePath = path.join(__dirname, '..', question.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await question.deleteOne();

    res.json({
      success: true,
      message: 'Питання успішно видалено'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при видаленні питання'
    });
  }
});

// @route   GET /api/questions/import/template
// @desc    Завантажити шаблон Excel для імпорту питань
// @access  Private/Admin
router.get('/import/template', protect, authorize('admin'), async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Питання');

    // Заголовки колонок
    worksheet.columns = [
      { header: 'Текст питання', key: 'text', width: 50 },
      { header: 'Категорія', key: 'category', width: 20 },
      { header: 'Відповідь 1', key: 'answer1', width: 30 },
      { header: 'Відповідь 2', key: 'answer2', width: 30 },
      { header: 'Відповідь 3', key: 'answer3', width: 30 },
      { header: 'Відповідь 4', key: 'answer4', width: 30 },
      { header: 'Правильна відповідь (1-4)', key: 'correctAnswer', width: 25 },
      { header: 'Пояснення', key: 'explanation', width: 40 },
      { header: 'Складність (1-5)', key: 'difficulty', width: 20 },
      { header: 'Посади (через кому)', key: 'positions', width: 30 },
      { header: 'Активне (так/ні)', key: 'isActive', width: 15 }
    ];

    // Стилізація заголовків
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Приклад запису
    worksheet.addRow({
      text: 'Яка оптимальна температура подачі червоного вина?',
      category: 'Вина',
      answer1: '10-12°C',
      answer2: '16-18°C',
      answer3: '20-22°C',
      answer4: '25-27°C',
      correctAnswer: 2,
      explanation: 'Червоне вино подається при кімнатній температурі 16-18°C',
      difficulty: 3,
      positions: 'Офіціант, Банкетний менеджер',
      isActive: 'так'
    });

    // Додати примітки
    worksheet.addRow({});
    worksheet.addRow({ text: 'ПРИМІТКИ:' });
    worksheet.addRow({ text: '1. Текст питання - обов\'язкове поле' });
    worksheet.addRow({ text: '2. Категорія - назва існуючої категорії (буде створена, якщо не існує)' });
    worksheet.addRow({ text: '3. Мінімум 2 відповіді (Відповідь 1, Відповідь 2) - обов\'язкові' });
    worksheet.addRow({ text: '4. Правильна відповідь - номер від 1 до 4 (вказує яка відповідь правильна)' });
    worksheet.addRow({ text: '5. Посади - через кому, наприклад: "Офіціант, Банкетний менеджер"' });
    worksheet.addRow({ text: '6. Складність - число від 1 до 5 (за замовчуванням 3)' });
    worksheet.addRow({ text: '7. Активне - "так" або "ні" (за замовчуванням "так")' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=questions_template.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Generate template error:', error);
    res.status(500).json({
      success: false,
      message: 'Помилка при генерації шаблону'
    });
  }
});

// @route   POST /api/questions/import
// @desc    Імпортувати питання з Excel файлу
// @access  Private/Admin
router.post('/import', protect, authorize('admin'), uploadExcel.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Файл не завантажено'
      });
    }

    const filePath = req.file.path;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.getWorksheet(1); // Перший лист
    if (!worksheet) {
      return res.status(400).json({
        success: false,
        message: 'Excel файл не містить даних'
      });
    }

    const results = {
      success: [],
      errors: [],
      skipped: []
    };

    // Отримати всі категорії та посади для швидкого пошуку
    const categories = await Category.find({});
    const positions = await Position.find({});
    const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c._id]));
    const positionMap = new Map(positions.map(p => [p.name.toLowerCase(), p._id]));

    // Обробка рядків (починаємо з 2-го, бо 1-й - заголовки)
    const rows = [];
    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return; // Пропустити заголовки
      rows.push({ row, rowIndex });
    });

    // Обробка кожного рядка асинхронно
    for (const { row, rowIndex } of rows) {
      const rowData = {
        text: row.getCell(1).value,
        category: row.getCell(2).value,
        answer1: row.getCell(3).value,
        answer2: row.getCell(4).value,
        answer3: row.getCell(5).value,
        answer4: row.getCell(6).value,
        correctAnswer: row.getCell(7).value,
        explanation: row.getCell(8).value,
        difficulty: row.getCell(9).value,
        positions: row.getCell(10).value,
        isActive: row.getCell(11).value
      };

      // Пропустити порожні рядки
      const textValue = rowData.text ? rowData.text.toString().trim() : '';
      if (!textValue) {
        continue;
      }

      // Пропустити рядки з примітками та інструкціями
      const textStr = textValue.toLowerCase();
      if (textStr.includes('примітк') || 
          textStr.includes('note') ||
          textStr.includes('інструкці') ||
          textStr.startsWith('1.') ||
          textStr.startsWith('2.') ||
          textStr.startsWith('3.') ||
          textStr.startsWith('4.') ||
          textStr.startsWith('5.') ||
          textStr.startsWith('6.') ||
          textStr.startsWith('7.') ||
          textStr === 'примітки:' ||
          textStr === 'notes:') {
        continue;
      }

      // Перевірити, чи є хоча б одна відповідь та категорія
      const hasAnswer = rowData.answer1 || rowData.answer2;
      const hasCategory = rowData.category && rowData.category.toString().trim();
      
      // Якщо немає відповіді або категорії, це не питання - пропустити
      if (!hasAnswer || !hasCategory) {
        continue;
      }

      try {
        // Валідація та обробка даних
        const text = rowData.text.toString().trim();
        if (!text) {
          results.errors.push({
            row: rowIndex,
            error: 'Текст питання обов\'язковий'
          });
          continue;
        }

        // Обробка категорії
        const categoryName = rowData.category ? rowData.category.toString().trim() : '';
        if (!categoryName) {
          results.errors.push({
            row: rowIndex,
            error: 'Категорія обов\'язкова'
          });
          continue;
        }

        let categoryId = categoryMap.get(categoryName.toLowerCase());
        if (!categoryId) {
          // Створити нову категорію
          const newCategory = await Category.create({ name: categoryName });
          categoryId = newCategory._id;
          categoryMap.set(categoryName.toLowerCase(), categoryId);
        }

        // Обробка відповідей
        const answers = [];
        if (rowData.answer1) answers.push({ text: rowData.answer1.toString().trim(), isCorrect: false });
        if (rowData.answer2) answers.push({ text: rowData.answer2.toString().trim(), isCorrect: false });
        if (rowData.answer3) answers.push({ text: rowData.answer3.toString().trim(), isCorrect: false });
        if (rowData.answer4) answers.push({ text: rowData.answer4.toString().trim(), isCorrect: false });

        if (answers.length < 2) {
          results.errors.push({
            row: rowIndex,
            error: 'Має бути мінімум 2 відповіді'
          });
          continue;
        }

        // Обробка правильної відповіді
        const correctAnswerNum = parseInt(rowData.correctAnswer) || 1;
        if (correctAnswerNum < 1 || correctAnswerNum > answers.length) {
          results.errors.push({
            row: rowIndex,
            error: `Правильна відповідь має бути від 1 до ${answers.length}`
          });
          continue;
        }

        answers[correctAnswerNum - 1].isCorrect = true;

        // Обробка пояснення
        const explanation = rowData.explanation ? rowData.explanation.toString().trim() : null;

        // Обробка складності
        let difficulty = parseInt(rowData.difficulty) || 3;
        if (difficulty < 1) difficulty = 1;
        if (difficulty > 5) difficulty = 5;

        // Обробка посад
        const positionsStr = rowData.positions ? rowData.positions.toString().trim() : '';
        if (!positionsStr) {
          results.errors.push({
            row: rowIndex,
            error: 'Посади обов\'язкові'
          });
          continue;
        }

        const positionNames = positionsStr.split(',').map(p => p.trim()).filter(p => p);
        const positionIds = [];

        for (const posName of positionNames) {
          let positionId = positionMap.get(posName.toLowerCase());
          if (!positionId) {
            // Створити нову посаду
            const newPosition = await Position.create({ name: posName });
            positionId = newPosition._id;
            positionMap.set(posName.toLowerCase(), positionId);
          }
          positionIds.push(positionId);
        }

        if (positionIds.length === 0) {
          results.errors.push({
            row: rowIndex,
            error: 'Необхідно вказати хоча б одну посаду'
          });
          continue;
        }

        // Обробка активності
        const isActiveStr = rowData.isActive ? rowData.isActive.toString().toLowerCase().trim() : 'так';
        const isActive = isActiveStr === 'так' || isActiveStr === 'yes' || isActiveStr === 'true' || isActiveStr === '1';

        // Створити питання
        const question = await Question.create({
          text,
          category: categoryId,
          answers,
          explanation,
          difficulty,
          positions: positionIds,
          isActive
        });

        results.success.push({
          row: rowIndex,
          questionId: question._id,
          text: text.length > 50 ? text.substring(0, 50) + '...' : text
        });

      } catch (error) {
        results.errors.push({
          row: rowIndex,
          error: error.message || 'Помилка при обробці рядка'
        });
      }
    }

    // Видалити завантажений файл
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: `Імпорт завершено. Успішно: ${results.success.length}, Помилок: ${results.errors.length}`,
      results: {
        imported: results.success.length,
        errors: results.errors.length,
        details: {
          success: results.success,
          errors: results.errors
        }
      }
    });
  } catch (error) {
    console.error('Import questions error:', error);
    
    // Видалити файл якщо він існує
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Помилка при імпорті питань',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

