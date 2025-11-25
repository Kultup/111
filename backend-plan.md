# BACKEND (Node.js + Express + MongoDB)

**Призначення:** REST API сервер з MongoDB для обробки всіх запитів від мобільного додатку та адмін панелі.

## Технологічний стек

- Node.js + Express
- MongoDB + Mongoose
- JWT для автентифікації
- bcrypt для хешування паролів
- node-cron для розсилки тестів
- exceljs для експорту звітів
- express-validator для валідації
- multer для завантаження файлів
- sharp або jimp для обробки зображень (опціонально)

## 1.1. Налаштування проекту ✅

- ✅ Ініціалізація Node.js проекту з Express
- ✅ Підключення MongoDB (Mongoose)
- ✅ Налаштування структури папок (routes, models, controllers, middleware)
- ✅ Налаштування environment variables (.env)
- ✅ CORS для мобільного додатку та адмін панелі
- ✅ Налаштування логування (morgan)
- ⏳ Налаштування завантаження файлів (multer) - в процесі
- ⏳ Створення папки для зберігання зображень (uploads/images) - в процесі
- ✅ Налаштування статичного обслуговування зображень (express.static)
- ⏳ Валідація типів файлів (jpg, jpeg, png, webp) - в процесі
- ⏳ Валідація розміру файлів (максимальний розмір) - в процесі

## 1.2. Моделі даних (Mongoose Schemas)

- ✅ **User** - користувачі (ПІБ, місто, посада, логін, пароль, статистика, монети "Мрійчики")
- ✅ **Category** - категорії питань
- ✅ **Question** - питання (текст, категорія, варіанти відповідей, правильна відповідь, пояснення, зображення)
- ✅ **DailyTest** - щоденні тести (користувач, дата, рівно 5 питань, статус, дедлайн)
- ✅ **TestResult** - результати тестування (користувач, тест, відповіді, бали)
- ✅ **KnowledgeBase** - база знань (категорія, заголовок, контент, зображення, теги, перегляди)
- ✅ **Comment** - коментарі до статей (користувач, стаття, текст, відповіді, лайки)
- ✅ **Feedback** - зворотний зв'язок (користувач, тип, текст, статус, пріоритет, відповідь)
- ✅ **City** - міста
- ✅ **Position** - посади
- ✅ **Achievement** - ачівки (назва, опис, іконка, умови отримання, тип, рідкісність, нагорода)
- ✅ **UserAchievement** - зв'язок користувач-ачівка (користувач, ачівка, дата отримання, прогрес)
- ✅ **ShopItem** - товари в магазині (назва, опис, ціна в монетах, тип товару, зображення, активний/неактивний, склад)
- ✅ **UserPurchase** - покупки користувача (користувач, товар, дата покупки, статус, адмін підтвердження)
- ✅ **CoinTransaction** - транзакції монет (користувач, тип, сума, причина, статус, адмін підтвердження)
- **AuditLog** - audit log (користувач, дія, сутність, зміни, дата, IP)
- **Comment** - коментарі до статей (користувач, стаття, текст, дата, лайки)
- ✅ **Tournament** - турніри між містами (назва, опис, дата початку, дата кінця, статус, міста-учасники, переможці, нагороди, правила підрахунку балів)
- ✅ **Friendship** - дружба між користувачами (user1, user2, status: pending/accepted/rejected, createdAt, updatedAt)
- ✅ **FriendRequest** - запити на дружбу (from, to, status: pending/accepted/rejected, createdAt, message)
- **Challenge** - щоденні челенджі (назва, опис, умови, нагорода, дата)
- **Event** - сезонні події (назва, опис, дата початку, дата кінця, нагороди)
- **SupportTicket** - звернення користувачів (користувач, тип, текст, статус, відповіді, дата)

## 1.3. Автентифікація та авторизація ✅

- ✅ JWT токени для автентифікації
- ✅ Middleware для перевірки токенів
- ✅ Хешування паролів (bcrypt)
- ✅ **НЕ зберігати паролі в plain text** - обов'язкове хешування всіх паролів
- ✅ Автентифікація через логін (не email)
- ✅ Валідація унікальності логіну при реєстрації
- ✅ Уніфікація формату логіну (мінімум 3 символи, максимум 30, тільки латинські літери, цифри та підкреслення)
- ✅ Валідація формату логіну на backend (regex)
- ✅ Endpoints: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
- ✅ Реєстрація з обов'язковим вибором міста та посади
- ✅ Розрізнення ролей (користувач/адмін)

## 1.4. API Endpoints

### Користувачі: ✅ (базові endpoints)

- ✅ `GET /api/users` - список користувачів (адмін)
- ✅ `GET /api/users/:id` - профіль користувача
- ⏳ `GET /api/users/:id/detailed` - детальна інформація про користувача (статистика, покупки, ачівки, тести)
- ⏳ `GET /api/users/:id/statistics` - повна статистика користувача
- ⏳ `GET /api/users/:id/purchases` - історія покупок користувача
- ⏳ `GET /api/users/:id/tests` - історія тестів користувача
- ⏳ `GET /api/users/:id/achievements` - ачівки користувача
- ⏳ `GET /api/users/:id/coins-history` - історія монет користувача
- ⏳ `GET /api/users/:id/rewards` - всі винагороди користувача (ачівки, турніри, спеціальні)
- ✅ `GET /api/users/:id/profile` - профіль користувача з нагородами та ачівками (для перегляду іншими користувачами)
  - Повертає: загальну інформацію, статистику, ачівки, нагороди з турнірів, спеціальні винагороди
  - Включає статус дружби (якщо запитує інший користувач)
- ✅ `PUT /api/users/:id` - оновлення профілю
- ✅ `GET /api/users/search` - пошук користувачів (query, city, position)
- ✅ `DELETE /api/users/:id` - видалення користувача (адмін)

### Питання та категорії:

- ✅ `GET /api/questions` - список питань (з фільтрами)
- ✅ `POST /api/questions` - створення питання (адмін)
- ✅ `PUT /api/questions/:id` - оновлення питання (адмін)
- ✅ `DELETE /api/questions/:id` - видалення питання (адмін)
- ✅ Завантаження зображення через `POST /api/questions` з полем `image`
- ✅ Оновлення/видалення зображення через `PUT /api/questions/:id` з параметром `deleteImage`
- ✅ `GET /api/categories` - список категорій
- ✅ `POST /api/categories` - створення категорії (адмін)
- ✅ `PUT /api/categories/:id` - оновлення категорії (адмін)
- ✅ `DELETE /api/categories/:id` - видалення категорії (адмін)

### Щоденні тести: ✅

- ✅ `GET /api/daily-tests/current` - поточний тест користувача
- ✅ `POST /api/daily-tests/generate` - генерація щоденного тесту
- ✅ `POST /api/daily-tests/:id/answer` - відправка відповіді
- ✅ `GET /api/daily-tests/:id/results` - результати тесту

### Статистика: ✅ (базові endpoints)

- ⏳ `GET /api/stats/user/:id` - статистика користувача
- ✅ `GET /api/stats/rating` - рейтинг користувачів (з фільтрами по місту/посаді)
- ✅ `GET /api/stats/rating/position/:positionId` - рейтинг по посаді
- ✅ `GET /api/stats/user/:id/position` - позиція користувача в рейтингу по посаді
- ⏳ `GET /api/stats/overview` - загальна статистика (адмін, з фільтрами по місту/посаді)
- ⏳ `GET /api/stats/by-city` - статистика по містах
- ⏳ `GET /api/stats/by-position` - статистика по посадах
- ⏳ `GET /api/stats/by-city-and-position` - статистика по комбінації місто+посада

### База знань: ✅

- ✅ `GET /api/knowledge-base` - список статей (з пошуком та пагінацією)
- ✅ `GET /api/knowledge-base/:id` - деталі статті (з автоматичним збільшенням переглядів)
- ✅ `GET /api/knowledge-base/category/:categoryId` - статті по категорії
- ✅ `POST /api/knowledge-base` - створення статті (адмін)
- ✅ `PUT /api/knowledge-base/:id` - оновлення статті (адмін)
- ✅ `DELETE /api/knowledge-base/:id` - видалення статті (адмін)
- ✅ `GET /api/knowledge-base/:id/comments` - коментарі до статті
- ✅ `POST /api/knowledge-base/:id/comments` - додавання коментаря
- ✅ `PUT /api/knowledge-base/comments/:id` - оновлення коментаря
- ✅ `DELETE /api/knowledge-base/comments/:id` - видалення коментаря
- ✅ `POST /api/knowledge-base/comments/:id/like` - лайк/дизлайк коментаря

### Зворотний зв'язок: ✅

- ✅ `POST /api/feedback` - створення зворотного зв'язку (може бути анонімним)
- ✅ `GET /api/feedback` - список зворотного зв'язку (адмін, з фільтрами)
- ✅ `GET /api/feedback/user` - зворотний зв'язок користувача
- ✅ `GET /api/feedback/:id` - деталі зворотного зв'язку
- ✅ `PUT /api/feedback/:id` - оновлення статусу/пріоритету/відповіді (адмін)
- ✅ `DELETE /api/feedback/:id` - видалення зворотного зв'язку (адмін)

### Довідники: ✅

- ✅ `GET /api/cities` - список міст (з фільтрами та пошуком)
- ✅ `GET /api/cities/:id` - деталі міста
- ✅ `POST /api/cities` - створення міста (адмін)
- ✅ `PUT /api/cities/:id` - оновлення міста (адмін)
- ✅ `DELETE /api/cities/:id` - видалення міста (адмін)
- ✅ `GET /api/positions` - список посад (з фільтрами та пошуком)
- ✅ `GET /api/positions/:id` - деталі посади
- ✅ `POST /api/positions` - створення посади (адмін)
- ✅ `PUT /api/positions/:id` - оновлення посади (адмін)
- ✅ `DELETE /api/positions/:id` - видалення посади (адмін)

### Звіти:

- `GET /api/reports/export` - експорт звітів в Excel (адмін)

### Ачівки: ✅

- ✅ `GET /api/achievements` - список всіх ачівок
- ✅ `GET /api/achievements/user/:userId` - ачівки користувача з прогресом
- ✅ `GET /api/achievements/:id` - деталі ачівки
- ✅ `POST /api/achievements` - створення ачівки (адмін)
- ✅ `PUT /api/achievements/:id` - оновлення ачівки (адмін)
- ✅ `DELETE /api/achievements/:id` - видалення ачівки (адмін)
- ✅ Автоматична перевірка та нарахування ачівок після завершення тесту

### Магазин: ✅

- ✅ `GET /api/shop/items` - список товарів в магазині
- ✅ `GET /api/shop/items/:id` - деталі товару
- ✅ `POST /api/shop/items` - створення товару (адмін)
- ✅ `PUT /api/shop/items/:id` - оновлення товару (адмін)
- ✅ `DELETE /api/shop/items/:id` - видалення товару (адмін)
- ✅ `POST /api/shop/purchase` - покупка товару
- ✅ `GET /api/shop/purchases` - історія покупок користувача
- ✅ `GET /api/shop/purchases/pending` - список покупок на підтвердження (адмін)
- ✅ `POST /api/shop/purchases/:id/approve` - підтвердження покупки (адмін)
- ✅ `POST /api/shop/purchases/:id/reject` - відхилення покупки (адмін)

### Монети (Мрійчики): ✅

- ✅ `GET /api/coins/balance` - баланс монет користувача
- ✅ `POST /api/coins/manual-add` - ручне нарахування монет адміном (з підтвердженням)
- ✅ `POST /api/coins/manual-subtract` - ручне списання монет адміном (з підтвердженням)
- ✅ `GET /api/coins/history` - історія нарахувань/витрат монет
- ✅ `GET /api/coins/pending` - список нарахувань на підтвердження (адмін)
- ✅ `POST /api/coins/transactions/:id/approve` - підтвердження транзакції (адмін)
- ✅ `POST /api/coins/transactions/:id/reject` - відхилення транзакції (адмін)
- ✅ Автоматичне нарахування монет при правильній відповіді (в dailyTestService)

### Коментарі: ✅ (інтегровано в knowledge-base routes)

- ✅ Коментарі до статей бази знань
- ✅ Відповіді на коментарі (parentComment)
- ✅ Лайки коментарів
- ✅ Редагування та видалення коментарів

### Турніри та челенджі:

- ✅ `GET /api/tournaments` - список турнірів (з фільтрами по статусу)
- ✅ `GET /api/tournaments/:id` - деталі турніру
- ✅ `GET /api/tournaments/current` - поточний активний турнір
- ✅ `GET /api/tournaments/:id/leaderboard` - рейтинг турніру (рейтинг міст)
- ✅ `GET /api/tournaments/:id/city-ranking` - рейтинг міст в турнірі (з детальною статистикою)
- ✅ `POST /api/tournaments` - створення турніру (адмін)
- ✅ `PUT /api/tournaments/:id` - оновлення турніру (адмін)
- ✅ `DELETE /api/tournaments/:id` - видалення турніру (адмін)
- ✅ `POST /api/tournaments/:id/start` - запуск турніру (адмін)
- ✅ `POST /api/tournaments/:id/end` - завершення турніру (адмін, автоматичне визначення переможців)
- ✅ `GET /api/tournaments/history` - історія минулих турнірів
- ✅ Автоматичний підрахунок балів міст на основі результатів тестів користувачів
- ✅ Автоматичне визначення переможців при завершенні турніру
- ✅ Нарахування нагород переможним містам
- `GET /api/challenges` - список челенджів
- `GET /api/challenges/current` - поточні челенджі
- `POST /api/challenges/:id/complete` - завершення челенджу
- `GET /api/events` - список подій
- `GET /api/events/current` - поточні події

### Звернення користувачів:

- `POST /api/support/tickets` - створення звернення
- `GET /api/support/tickets` - список звернень (користувач/адмін)
- `GET /api/support/tickets/:id` - деталі звернення
- `PUT /api/support/tickets/:id` - оновлення звернення
- `POST /api/support/tickets/:id/reply` - відповідь на звернення (адмін)

### Audit Log:

- `GET /api/audit-logs` - список audit logs (адмін)
- `GET /api/audit-logs/user/:userId` - логи користувача
- `GET /api/audit-logs/entity/:entityType/:entityId` - логи сутності

### Метрики:

- `GET /api/metrics/overview` - загальні метрики (адмін)
- `GET /api/metrics/user/:userId` - метрики користувача
- `GET /api/metrics/tests` - метрики тестів (середня кількість, відсоток завершених, середній час)

### GDPR/Privacy:

- `POST /api/users/:id/delete-account` - запит на видалення акаунту
- `GET /api/users/:id/export-data` - експорт даних користувача

## 1.5. Логіка щоденних тестів ✅

- ✅ **Формування щоденних тестів з рівно 5 питань** - кожен тест містить точно 5 питань
- ✅ Алгоритм вибору 5 питань з різних категорій
- ✅ **Виключення вже пройдених питань** - питання, які користувач вже пройшов, ніколи не відображаються йому знову
- ✅ Валідація дедлайну (до 00:00)
- ✅ Автоматичне закриття тестів після дедлайну
- ✅ Підрахунок балів та збереження результатів
- ✅ Перевірка дедлайну перед прийняттям відповіді
- ✅ Нарахування монет "Мрійчики" за правильні відповіді
- ✅ Оновлення статистики користувача
- ✅ Cron job для генерації тестів (щодня о встановлений час)
- ✅ **Показ кінцевого результату після завершення тесту:**
  - Кількість правильних відповідей (X/5)
  - Відсоток правильних відповідей
  - Нараховані монети "Мрійчики"
  - Деталі по кожному питанню (правильно/неправильно)
- ✅ **Показ позиції в загальному рейтингу по посаді:**
  - Підрахунок рейтингу користувача серед всіх користувачів з тієї ж посади
  - Відображення позиції (наприклад, "5 з 20")
  - Оновлення рейтингу після кожного завершеного тесту
- ✅ Автоматична перевірка та нарахування ачівок після завершення тесту

## 1.6. Експорт даних

- Генерація Excel звітів (exceljs)
- Експорт статистики користувачів
- Експорт результатів тестування
- Експорт загальної статистики

## 1.7. Завантаження та обробка зображень ✅

- ✅ Завантаження зображень до питань через multer
- ✅ Завантаження зображень до статей бази знань
- ✅ Валідація типів файлів (jpg, jpeg, png, webp)
- ✅ Валідація розміру файлів (максимальний розмір, налаштовується через MAX_FILE_SIZE)
- ✅ Автоматичне видалення старих зображень при оновленні/видаленні
- ✅ Статичне обслуговування зображень через Express
- ✅ Унікальні імена файлів (timestamp-random)
- ⏳ Оптимізація зображень (зменшення розміру, стиснення) - опціонально
- ⏳ Генерація thumbnail для швидкого завантаження - опціонально

## 1.8. Система монет та ачівок

- Нарахування монет "Мрійчики" за правильні відповіді (налаштовувана кількість)
- Нарахування монет за проходження тесту
- Логіка автоматичного отримання ачівок (за кількість правильних відповідей, за серії, за загальну статистику)
- Перевірка умов отримання ачівок після кожного тесту
- Сповіщення користувача про отримання нової ачівки
- ✅ Валідація достатності монет при покупці товарів
- ✅ Обробка покупок та активація товарів
- ✅ Система підтвердження покупок адміном
- ✅ Система підтвердження ручних нарахувань монет адміном
- ✅ Логування всіх транзакцій монет
- ✅ Статуси транзакцій (pending, approved, rejected)
- ✅ Повернення монет при відхиленні покупки
- ✅ Управління складом товарів

## 1.9. Логування та аудит

- **Логування всіх важливих дій:**
  - Логування входів/виходів користувачів
  - Логування змін даних (створення, оновлення, видалення)
  - Логування доступу до адмін функцій
  - Логування транзакцій монет
  - Логування покупок
  - Логування отримання ачівок
- **Audit log модель:**
  - Збереження хто, коли, що змінив
  - Історія змін для критичних даних
  - Можливість відновлення даних з логів
- **Структуроване логування:**
  - JSON формат для логів
  - Рівні логування (error, warn, info, debug)
  - Контекстна інформація (user ID, IP, timestamp)
- **Безпека логів:**
  - Не логувати чутливі дані (паролі, токени)
  - Шифрування логів з чутливою інформацією

## 1.10. Database оптимізація

- **Індекси для часто використовуваних полів:**
  - Індекс на `User.login` (унікальність та швидкий пошук)
  - Індекс на `User.city` та `User.position` (фільтрація)
  - Індекс на `DailyTest.user` та `DailyTest.date` (швидкий пошук тестів)
  - Індекс на `TestResult.user` та `TestResult.test` (статистика)
  - Індекс на `Question.category` (фільтрація питань)
  - Індекс на `UserAchievement.user` та `UserAchievement.achievement`
  - Індекс на `UserPurchase.user` та `UserPurchase.status`
  - Індекс на `CoinTransaction.user` та `CoinTransaction.type`
- **Compound indexes:**
  - Для складних запитів (наприклад, user + date)
  - Для сортування та фільтрації одночасно
- **Query optimization:**
  - Використання projection для зменшення обсягу даних
  - Pagination для великих результатів
  - Aggregation pipelines для складних запитів

## 1.11. Валідація та обробка помилок

- Валідація на backend (express-validator)
- Валідація унікальності логіну
- Валідація формату логіну (мінімум 3 символи, максимум 30, тільки латинські літери, цифри та підкреслення, regex: `^[a-zA-Z0-9_]{3,30}$`)
- Валідація обов'язкових полів при реєстрації (місто, посада)
- Перевірка існування міста та посади в базі даних
- Централізований error handler
- Обробка помилок MongoDB
- Валідація JWT токенів
- Обробка помилок автентифікації

## Ключові файли для створення

- `backend/server.js` - точка входу
- `backend/config/database.js` - налаштування MongoDB
- `backend/models/User.js` - модель користувача
- `backend/models/Question.js` - модель питання
- `backend/models/Category.js` - модель категорії
- `backend/models/DailyTest.js` - модель щоденного тесту
- `backend/models/TestResult.js` - модель результату тесту
- `backend/models/KnowledgeBase.js` - модель бази знань
- `backend/models/Feedback.js` - модель зворотного зв'язку
- `backend/models/City.js` - модель міста
- `backend/models/Position.js` - модель посади
- `backend/models/Achievement.js` - модель ачівки
- `backend/models/UserAchievement.js` - модель зв'язку користувач-ачівка
- `backend/models/ShopItem.js` - модель товару в магазині
- `backend/models/UserPurchase.js` - модель покупки
- `backend/models/CoinTransaction.js` - модель транзакції монет
- `backend/models/AuditLog.js` - модель audit log
- `backend/models/Comment.js` - модель коментаря
- `backend/models/Tournament.js` - модель турніру
- ✅ `backend/models/Friendship.js` - модель дружби
- ✅ `backend/models/FriendRequest.js` - модель запиту на дружбу
- `backend/models/Challenge.js` - модель челенджу
- `backend/models/Event.js` - модель події
- `backend/models/SupportTicket.js` - модель звернення
- `backend/routes/auth.js` - роути автентифікації
- `backend/routes/users.js` - роути користувачів
- `backend/routes/questions.js` - роути питань
- `backend/routes/dailyTests.js` - роути щоденних тестів
- `backend/routes/stats.js` - роути статистики
- `backend/routes/knowledgeBase.js` - роути бази знань
- `backend/routes/feedback.js` - роути зворотного зв'язку
- `backend/routes/achievements.js` - роути ачівок
- `backend/routes/cities.js` - роути міст
- `backend/routes/positions.js` - роути посад
- `backend/routes/shop.js` - роути магазину
- `backend/routes/coins.js` - роути монет
- `backend/routes/comments.js` - роути коментарів
- `backend/routes/tournaments.js` - роути турнірів
- `backend/routes/challenges.js` - роути челенджів
- `backend/routes/events.js` - роути подій
- `backend/routes/support.js` - роути звернень
- `backend/routes/audit.js` - роути audit logs
- `backend/routes/metrics.js` - роути метрик
- `backend/controllers/` - контролери для кожної сутності
- `backend/middleware/auth.js` - JWT middleware
- `backend/middleware/errorHandler.js` - обробка помилок
- `backend/middleware/upload.js` - middleware для завантаження файлів (multer)
- `backend/middleware/auditLog.js` - middleware для логування дій
- `backend/services/dailyTestService.js` - логіка генерації тестів
- `backend/services/ratingService.js` - логіка підрахунку рейтингу по посаді
- `backend/services/auditService.js` - сервіс логування та аудиту
- `backend/services/cronJobs.js` - налаштування cron jobs
- `backend/services/achievementService.js` - логіка перевірки та нарахування ачівок
- `backend/services/coinService.js` - логіка нарахування та витрати монет
- `backend/services/shopService.js` - логіка покупок в магазині
- `backend/services/tournamentService.js` - логіка турнірів
- `backend/services/challengeService.js` - логіка челенджів
- `backend/services/eventService.js` - логіка подій
- `backend/services/supportService.js` - логіка звернень
- `backend/services/metricsService.js` - логіка метрик
- `backend/utils/validators.js` - валідатори
- `backend/utils/loginValidator.js` - уніфікована валідація логіну
- `backend/utils/excelExport.js` - експорт в Excel
- `backend/utils/imageUpload.js` - утиліти для роботи зі зображеннями
- `backend/utils/logger.js` - утиліти для логування

