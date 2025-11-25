# План розробки навчальної системи тестування

## Архітектура проекту

**Структура:**

- `/backend` - Node.js + Express + MongoDB (REST API)
- `/mobile` - Expo React Native додаток
- `/admin` - React адмін панель (Next.js або CRA)

## Окремі плани розробки

План розділено на три окремі файли для зручності:

- **[backend-plan.md](./backend-plan.md)** - План розробки Backend (Node.js + Express + MongoDB)
- **[mobile-plan.md](./mobile-plan.md)** - План розробки Mobile додатку (Expo React Native)
- **[frontend-admin-plan.md](./frontend-admin-plan.md)** - План розробки Frontend Admin панелі (React)
- **[additional-recommendations.md](./additional-recommendations.md)** - Додаткові рекомендації та покращення (тестування, CI/CD, моніторинг, безпека, тощо)

---

# ЗАГАЛЬНИЙ ОГЛЯД

## Основні компоненти системи

### Backend (Node.js + Express + MongoDB)
REST API сервер для обробки всіх запитів. Детальний план: [backend-plan.md](./backend-plan.md)

### Mobile (Expo React Native)
Мобільний додаток для користувачів. Детальний план: [mobile-plan.md](./mobile-plan.md)

### Frontend Admin (React)
Веб адмін панель для управління системою. Детальний план: [frontend-admin-plan.md](./frontend-admin-plan.md)

---

# ІНТЕГРАЦІЯ ТА ТЕСТУВАННЯ

### Інтеграція компонентів

- Підключення мобільного додатку до Backend API
- Підключення адмін панелі до Backend API
- Тестування всіх endpoints
- Налаштування CORS та безпеки

### Обробка помилок

- Error handling в backend (централізований error handler)
- Обробка помилок в мобільному додатку (try-catch, error boundaries)
- Обробка помилок в адмін панелі (error handling в компонентах)

### Валідація даних

- Валідація на backend (express-validator)
- Валідація форм в мобільному додатку
- Валідація форм в адмін панелі

### Тестування

- Unit тести для критичних функцій backend
- Інтеграційні тести API
- Тестування мобільного додатку на різних пристроях (iOS, Android)
- Тестування адмін панелі в різних браузерах

## Технологічний стек

**Backend:**

- Node.js + Express
- MongoDB + Mongoose
- JWT для автентифікації
- bcrypt для хешування паролів
- node-cron для розсилки тестів
- exceljs для експорту звітів

**Mobile:**

- Expo (React Native)
- React Navigation
- AsyncStorage
- Axios для API запитів
- Expo Notifications

**Admin:**

- React (CRA або Next.js)
- React Router
- Material-UI / Ant Design
- Axios для API запитів
- Chart.js / Recharts для графіків

## Ключові файли для створення

**Backend:**

- `backend/server.js` - точка входу
- `backend/models/` - Mongoose моделі
- `backend/routes/` - API роути
- `backend/controllers/` - логіка обробки запитів
- `backend/middleware/auth.js` - JWT middleware
- `backend/services/dailyTestService.js` - логіка генерації тестів

**Mobile:**

- `mobile/App.js` - точка входу
- `mobile/screens/` - екрани додатку
- `mobile/components/` - переіспользувані компоненти
- `mobile/services/api.js` - API клієнт
- `mobile/navigation/` - налаштування навігації

**Admin:**

- `admin/src/App.js` - точка входу
- `admin/src/pages/` - сторінки адмін панелі
- `admin/src/components/` - компоненти
- `admin/src/services/api.js` - API клієнт