# Flutter Mobile App - Навчальна система

## Встановлення

1. Встановити Flutter SDK (версія 3.0+)
2. Встановити залежності:
```bash
flutter pub get
```

## Налаштування API URL

Відредагуйте файл `lib/config/app_config.dart` та змініть `defaultApiUrl`:

- Для Android емулятора: `http://10.0.2.2:5000/api`
- Для iOS емулятора: `http://localhost:5000/api`
- Для фізичного пристрою: `http://192.168.0.189:5000/api` (замініть на ваш IP)

## Запуск

```bash
# Development
flutter run

# iOS
flutter run -d ios

# Android
flutter run -d android
```

## Структура проєкту

```
lib/
├── config/          # Конфігурація (API URL, теми)
├── core/            # Базові утиліти, валідатори
├── data/            # Моделі, репозиторії, сервіси
└── presentation/    # UI (screens, widgets, providers, navigation)
```

## Реалізовано

✅ Авторизація (Login)
✅ Реєстрація (Register)
✅ Мінімальний дашборд (Home)
✅ State Management (Provider)
✅ Навігація (GoRouter)
✅ API Service з Dio
✅ Валідація логіну
✅ Перевірка унікальності логіну в реальному часі
✅ Збереження токенів та даних користувача

## Наступні кроки

- [ ] Додати біометричну автентифікацію
- [ ] Додати PIN-код
- [ ] Додати екран тестування
- [ ] Додати статистику
- [ ] Додати базу знань
- [ ] Додати профіль
- [ ] Додати ачівки
- [ ] Додати магазин

