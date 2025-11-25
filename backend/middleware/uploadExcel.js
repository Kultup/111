const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Створити папку uploads/excel якщо не існує
const uploadDir = path.join(__dirname, '../uploads/excel');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Налаштування зберігання
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Унікальне ім'я файлу: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// Фільтр файлів - тільки Excel
const fileFilter = (req, file, cb) => {
  const allowedTypes = /xlsx|xls/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                   file.mimetype === 'application/vnd.ms-excel' ||
                   file.mimetype === 'application/excel';

  if (extname || mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Дозволені тільки Excel файли: .xlsx, .xls'));
  }
};

// Налаштування multer
const uploadExcel = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB для Excel файлів
  },
  fileFilter: fileFilter
});

module.exports = uploadExcel;

