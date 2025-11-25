const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { setupCronJobs } = require('./services/cronJobs');
require('dotenv').config();

const app = express();

// Middleware
// CORS налаштування
const corsOptions = {
  credentials: true
};

if (process.env.NODE_ENV === 'development') {
  // В development режимі дозволяємо всі origins для зручності тестування
  corsOptions.origin = true; // Дозволити всі origins
} else {
  // В production тільки дозволені origins
  corsOptions.origin = [
    process.env.FRONTEND_URL,
    process.env.MOBILE_URL
  ].filter(Boolean); // Видалити undefined значення
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static files - обслуговування завантажених файлів
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));
// Також підтримуємо старий шлях для сумісності
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/cities', require('./routes/cities'));
  app.use('/api/positions', require('./routes/positions'));
  app.use('/api/categories', require('./routes/categories'));
  app.use('/api/questions', require('./routes/questions'));
  app.use('/api/daily-tests', require('./routes/dailyTests'));
  app.use('/api/stats', require('./routes/stats'));
  app.use('/api/achievements', require('./routes/achievements'));
  app.use('/api/shop', require('./routes/shop'));
  app.use('/api/coins', require('./routes/coins'));
  app.use('/api/knowledge-base', require('./routes/knowledgeBase'));
  app.use('/api/feedback', require('./routes/feedback'));
  app.use('/api/cron', require('./routes/cron'));
  app.use('/api/settings', require('./routes/settings'));
  app.use('/api/audit-logs', require('./routes/auditLogs'));
  app.use('/api/notifications', require('./routes/notifications'));
  console.log('✅ All routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error);
  process.exit(1);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learning-system', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected');
  
  // Setup cron jobs
  setupCronJobs();
  
  // Start server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Error handling
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

module.exports = app;

