# Backend API - Навчальна система тестування

## Встановлення

1. Встановити залежності:
```bash
npm install
```

2. Створити файл `.env` на основі `env.template`:
```bash
cp env.template .env
```

3. Налаштувати змінні оточення в `.env`

4. Запустити MongoDB

5. Створити адмін користувача:
```bash
npm run create-admin
```

**Дані для входу за замовчуванням:**
- **Логін:** `admin`
- **Пароль:** `admin123`

Можна змінити через змінні оточення в `.env`:
- `ADMIN_LOGIN` - логін адміна
- `ADMIN_PASSWORD` - пароль адміна
- `ADMIN_FIRST_NAME` - ім'я адміна
- `ADMIN_LAST_NAME` - прізвище адміна

6. Запустити сервер:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Автентифікація
- `POST /api/auth/register` - Реєстрація
- `POST /api/auth/login` - Вхід
- `GET /api/auth/me` - Поточний користувач

### Міста
- `GET /api/cities` - Список міст
- `GET /api/cities/:id` - Деталі міста
- `POST /api/cities` - Створити місто (Admin)
- `PUT /api/cities/:id` - Оновити місто (Admin)
- `DELETE /api/cities/:id` - Видалити місто (Admin)

### Посади
- `GET /api/positions` - Список посад
- `GET /api/positions/:id` - Деталі посади
- `POST /api/positions` - Створити посаду (Admin)
- `PUT /api/positions/:id` - Оновити посаду (Admin)
- `DELETE /api/positions/:id` - Видалити посаду (Admin)

### Категорії
- `GET /api/categories` - Список категорій
- `GET /api/categories/:id` - Деталі категорії
- `POST /api/categories` - Створити категорію (Admin)
- `PUT /api/categories/:id` - Оновити категорію (Admin)
- `DELETE /api/categories/:id` - Видалити категорію (Admin)

### Питання
- `GET /api/questions` - Список питань
- `GET /api/questions/:id` - Деталі питання
- `POST /api/questions` - Створити питання (Admin)
- `PUT /api/questions/:id` - Оновити питання (Admin)
- `DELETE /api/questions/:id` - Видалити питання (Admin)

### Щоденні тести
- `GET /api/daily-tests/current` - Поточний тест користувача
- `POST /api/daily-tests/generate` - Згенерувати щоденний тест
- `POST /api/daily-tests/:id/answer` - Відправити відповідь на питання
- `GET /api/daily-tests/:id/results` - Результати тесту

**Важливо:**
- Кожен щоденний тест містить **рівно 5 питань**
- Питання, які користувач вже пройшов, **ніколи не відображаються йому знову**
- Після завершення тесту показується кінцевий результат та позиція в рейтингу по посаді

### Статистика та рейтинг
- `GET /api/stats/rating` - Загальний рейтинг користувачів
- `GET /api/stats/rating/position/:positionId` - Рейтинг по посаді
- `GET /api/stats/user/:id/position` - Позиція користувача в рейтингу

### Ачівки
- `GET /api/achievements` - Список всіх ачівок
- `GET /api/achievements/user/:userId` - Ачівки користувача з прогресом
- `POST /api/achievements` - Створити ачівку (Admin)
- `PUT /api/achievements/:id` - Оновити ачівку (Admin)
- `DELETE /api/achievements/:id` - Видалити ачівку (Admin)

### Магазин
- `GET /api/shop/items` - Список товарів
- `POST /api/shop/purchase` - Купити товар
- `GET /api/shop/purchases` - Історія покупок
- `GET /api/shop/purchases/pending` - Покупки на підтвердження (Admin)
- `POST /api/shop/purchases/:id/approve` - Підтвердити покупку (Admin)
- `POST /api/shop/purchases/:id/reject` - Відхилити покупку (Admin)

### Монети
- `GET /api/coins/balance` - Баланс монет
- `GET /api/coins/history` - Історія транзакцій
- `POST /api/coins/manual-add` - Ручне нарахування (Admin)
- `POST /api/coins/manual-subtract` - Ручне списання (Admin)
- `GET /api/coins/pending` - Транзакції на підтвердження (Admin)

### База знань
- `GET /api/knowledge-base` - Список статей (з пошуком)
- `GET /api/knowledge-base/:id` - Деталі статті
- `GET /api/knowledge-base/:id/comments` - Коментарі до статті
- `POST /api/knowledge-base/:id/comments` - Додати коментар
- `POST /api/knowledge-base/comments/:id/like` - Лайкнути коментар

### Зворотний зв'язок
- `POST /api/feedback` - Створити зворотний зв'язок
- `GET /api/feedback/user` - Зворотний зв'язок користувача
- `GET /api/feedback` - Список зворотного зв'язку (Admin)

### Користувачі
- `GET /api/users` - Список користувачів (Admin)
- `GET /api/users/:id` - Деталі користувача
- `PUT /api/users/:id` - Оновити користувача
- `DELETE /api/users/:id` - Видалити користувача (Admin)

### Cron Jobs
- `POST /api/cron/generate-tests` - Ручна генерація тестів для всіх користувачів (Admin)

## Статус виконання

✅ Створено базову структуру проекту
✅ Налаштовано підключення до MongoDB
✅ Створено моделі: User, City, Position, Category, Question, DailyTest, TestResult
✅ Реалізовано автентифікацію (JWT, bcrypt)
✅ Створено базові API endpoints для auth, cities, positions, categories, users, questions, daily-tests
✅ Додано middleware для автентифікації та авторизації
✅ Додано валідацію логіну
✅ Додано error handling
✅ Реалізовано логіку щоденних тестів:
  - Генерація тестів з рівно 5 питань
  - Виключення вже пройдених питань
  - Нарахування монет за правильні відповіді
  - Оновлення статистики користувача
✅ Налаштовано cron job для автоматичної генерації тестів щодня о 12:00
✅ Створено Achievement систему з автоматичною перевіркою
✅ Створено Shop систему та управління покупками
✅ Створено Knowledge Base систему з коментарями
✅ Створено Feedback систему
✅ Реалізовано завантаження зображень (multer) для питань та статей
✅ Реалізовано рейтинг по посаді та показ позиції після тесту
