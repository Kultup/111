# Міграція мобільного додатку з Expo на Flutter

## Загальна стратегія

Повна заміна React Native/Expo проєкту на Flutter з збереженням всієї функціональності. Використання Flutter best practices та стандартної архітектури.

## 1. Створення Flutter проєкту та базової структури

### 1.1. Ініціалізація Flutter проєкту

- Створити новий Flutter проєкт замість існуючої папки mobile
- Налаштувати `pubspec.yaml` з усіма необхідними залежностями
- Налаштувати `android/` та `ios/` конфігурації
- Створити структуру папок за Flutter conventions

### 1.2. Мапінг залежностей React Native → Flutter

- `@react-navigation/*` → `go_router` або `flutter_navigation`
- `@react-native-async-storage/async-storage` → `shared_preferences`
- `axios` → `dio` або `http`
- `expo-local-authentication` → `local_auth`
- `expo-secure-store` → `flutter_secure_storage`
- `expo-notifications` → `flutter_local_notifications` + `firebase_messaging`
- `react-native-chart-kit` → `fl_chart` або `syncfusion_flutter_charts`
- `react-native-safe-area-context` → вбудований `SafeArea`
- `react-native-gesture-handler` → вбудований `GestureDetector`
- `expo-image-picker` → `image_picker`
- `react-native-video` → `video_player`
- `react-native-image-cropper` → `image_cropper`

### 1.3. Структура папок Flutter

```
mobile/
├── lib/
│   ├── main.dart
│   ├── app.dart
│   ├── config/
│   │   ├── app_config.dart
│   │   └── theme.dart
│   ├── core/
│   │   ├── constants/
│   │   ├── utils/
│   │   ├── validators/
│   │   └── errors/
│   ├── data/
│   │   ├── models/
│   │   ├── repositories/
│   │   └── services/
│   ├── domain/
│   │   ├── entities/
│   │   └── usecases/
│   ├── presentation/
│   │   ├── providers/ (або bloc/, або riverpod/)
│   │   ├── screens/
│   │   ├── widgets/
│   │   └── navigation/
│   └── shared/
│       ├── widgets/
│       └── utils/
├── android/
├── ios/
└── pubspec.yaml
```

## 2. State Management та Architecture

### 2.1. Вибрати state management

- Рекомендовано: `flutter_riverpod` або `provider` + `ChangeNotifier`
- Альтернатива: `bloc` (Bloc pattern)

### 2.2. Конвертація Context API → Flutter State Management

- `AuthContext` → `AuthProvider` (Riverpod) або `AuthBloc`
- `DeviceContext` → `DeviceProvider` або `DeviceNotifier`
- `ThemeContext` → `ThemeProvider` або використати вбудований `ThemeData`

### 2.3. Dependency Injection

- Використати `riverpod` для DI або `get_it`

## 3. Навігація

### 3.1. Конвертація React Navigation → Flutter Navigation

- `Stack.Navigator` → `Navigator.push/pop` або `go_router`
- `Tab.Navigator` → `BottomNavigationBar` або `TabBarView`
- `Drawer.Navigator` → `Drawer` widget
- `AppNavigator.js` → `app_router.dart` з `go_router` або `routes.dart`

### 3.2. Навігаційні екрани

- Конвертувати всі екрани з `screens/` в Flutter widgets
- Адаптивна навігація (tabs для телефонів, drawer для планшетів)

## 4. Сервіси та API

### 4.1. API Client

- Конвертувати `services/api.js` → `data/services/api_service.dart`
- Використати `dio` з interceptors для токенів та retry логіки
- Створити `api_client.dart` з базовою конфігурацією

### 4.2. Сервіси

- `services/auth.js` → `data/repositories/auth_repository.dart`
- `services/biometric.js` → `data/services/biometric_service.dart`
- `services/pinCode.js` → `data/services/pin_code_service.dart`
- `services/security.js` → `data/services/security_service.dart`
- `services/notifications.js` → `data/services/notification_service.dart`

### 4.3. Storage

- `AsyncStorage` → `shared_preferences` для звичайних даних
- `expo-secure-store` → `flutter_secure_storage` для токенів та PIN-кодів

## 5. Екрани (Screens)

### 5.1. Автентифікація

- `LoginScreen.js` → `lib/presentation/screens/auth/login_screen.dart`
- `RegisterScreen.js` → `lib/presentation/screens/auth/register_screen.dart`
- `BiometricAuthScreen.js` → `lib/presentation/screens/auth/biometric_auth_screen.dart`
- `PinCodeScreen.js` → `lib/presentation/screens/auth/pin_code_screen.dart`
- `PinSetupScreen.js` → `lib/presentation/screens/auth/pin_setup_screen.dart`

### 5.2. Основні екрани

- `HomeScreen.js` → `lib/presentation/screens/home/home_screen.dart`
- `TestScreen.js` → `lib/presentation/screens/test/test_screen.dart`
  - Підтримка таймера 20 хвилин з моменту натискання "Почати тест" (POST /api/daily-tests/:id/start)
  - Відображення залишкового часу (GET /api/daily-tests/:id/remaining-time)
  - Автоматичне завершення тесту при досягненні ліміту
  - Підтримка різних типів питань:
    - Тип "multiple_choice" - стандартна логіка (1 питання, 4 варіанти відповідей)
    - Тип "text_input" - питання з полем TextField для введення відповіді (перевірка через алгоритм Левенштейна на backend)
  - Підтримка фото/відео в питаннях (mediaType: image/video, mediaUrl)
  - Відтворення відео через video_player
- `TestResultsScreen.js` → `lib/presentation/screens/test/test_results_screen.dart`
  - Аналіз неправильних відповідей з посиланнями на базу знань (GET /api/daily-tests/:id/wrong-answers-analysis)
  - Відображення списку неправильних питань з посиланнями на статті (якщо є прив'язка knowledgeArticle)
  - Навігація до статей бази знань для детального вивчення теми
- `StatsScreen.js` → `lib/presentation/screens/stats/stats_screen.dart`
- `KnowledgeBaseScreen.js` → `lib/presentation/screens/knowledge/knowledge_base_screen.dart` ✅
  - ✅ Перевірка доступу до бази знань (GET /api/knowledge-base/access-status, якщо доступ закритий - показувати повідомлення)
  - ✅ Фільтрація статей по посаді користувача (відображати тільки статті, прив'язані до посади)
  - ✅ Список категорій з горизонтальним скролом
  - ✅ Список статей по категорії з пагінацією
  - ✅ Пошук по базі знань з debounce
  - ✅ Закладки для статей (збереження в SharedPreferences)
  - ✅ Lazy loading зображень (cached_network_image)
  - ✅ Навігація до детального перегляду статті
- `ArticleDetailScreen` → `lib/presentation/screens/knowledge/article_detail_screen.dart` ✅
  - ✅ Детальний перегляд статті з HTML контентом (flutter_html)
  - ✅ Коментарі та обговорення матеріалів (додавання, редагування, видалення, лайки)
  - ✅ Вкладені коментарі (відповіді на коментарі)
  - ✅ Закладки (додавання/видалення)
  - ✅ Поділ статей (share_plus)
  - ✅ Масштабування зображення при натисканні
  - ✅ Перевірка доступу та прив'язки до посади
- `ProfileScreen.js` → `lib/presentation/screens/profile/profile_screen.dart`
  - Завантаження та відображення фото аватара

### 5.3. Додаткові екрани

- `AchievementsScreen.js` → `lib/presentation/screens/achievements/achievements_screen.dart`
- `ShopScreen.js` → `lib/presentation/screens/shop/shop_screen.dart`
- `FeedbackScreen.js` → `lib/presentation/screens/feedback/feedback_screen.dart`
- `OnboardingScreen.js` → `lib/presentation/screens/onboarding/onboarding_screen.dart`
- `SecuritySettingsScreen.js` → `lib/presentation/screens/settings/security_settings_screen.dart`
- `NotificationSettingsScreen.js` → `lib/presentation/screens/settings/notification_settings_screen.dart`
- `EditProfileScreen.js` → `lib/presentation/screens/profile/edit_profile_screen.dart`
  - Завантаження та обрізка фото аватара
- `ChangePasswordScreen.js` → `lib/presentation/screens/profile/change_password_screen.dart`
- `FacilityCompetitionScreen.js` → `lib/presentation/screens/competition/facility_competition_screen.dart`
  - Створення змагань між закладами (POST /api/facility-competitions, вибір закладу через GET /api/facilities)
  - Відображення відсотка правильних відповідей кожного закладу (facility1CorrectPercentage, facility2CorrectPercentage)
  - Відображення кількості працівників кожного закладу (facility1EmployeesCount, facility2EmployeesCount)
  - Визначення переможця (заклад з найвищим відсотком правильних відповідей)
  - Прогрес обох закладів в реальному часі

## 6. Компоненти (Widgets)

### 6.1. Базові компоненти

- `EmptyState.js` → `lib/presentation/widgets/empty_state.dart`
- `Toast.js` → `lib/presentation/widgets/toast.dart` (або `flutter_toast`)
- `ErrorBoundary.js` → `lib/core/errors/error_boundary.dart` (Flutter ErrorWidget)
- `SafeAreaWrapper.js` → використати вбудований `SafeArea`

### 6.2. Спеціалізовані компоненти

- `CityPicker.js` → `lib/presentation/widgets/city_picker.dart`
- `PositionPicker.js` → `lib/presentation/widgets/position_picker.dart`
- `PinCodeInput.js` → `lib/presentation/widgets/pin_code_input.dart`
- `QuestionCard` → `lib/presentation/widgets/test/question_card.dart`
- `ProgressBar` → `lib/presentation/widgets/progress_bar.dart`
- `Timer` → `lib/presentation/widgets/timer.dart`

### 6.3. Адаптивні компоненти

- `ResponsiveContainer` → `lib/presentation/widgets/responsive/responsive_container.dart`
- `AdaptiveLayout` → `lib/presentation/widgets/responsive/adaptive_layout.dart`

## 7. Утиліти та валідація

### 7.1. Валідатори

- `utils/loginValidator.js` → `lib/core/validators/login_validator.dart`
- `utils/pinValidator.js` → `lib/core/validators/pin_validator.dart`
- `utils/validators.js` → `lib/core/validators/validators.dart`

### 7.2. Утиліти

- `utils/responsive.js` → `lib/core/utils/responsive.dart`
- `utils/adaptiveStyles.js` → `lib/core/utils/adaptive_styles.dart`
- `utils/deviceInfo.js` → `lib/core/utils/device_info.dart`
- `utils/levenshtein_distance.dart` - алгоритм Левенштейна для перевірки відповідей
- `utils/answer_validator.dart` - валідація відповідей з використанням алгоритму Левенштейна

## 8. Конфігурація

### 8.1. Android

- Оновити `android/app/build.gradle`
- Налаштувати `AndroidManifest.xml` з permissions
- Мінімальна версія: API 21

### 8.2. iOS

- Оновити `ios/Runner/Info.plist`
- Налаштувати permissions (Face ID, Notifications)
- Мінімальна версія: iOS 13.0

### 8.3. Environment Variables

- Створити `lib/config/app_config.dart` для API URL
- Використати `flutter_dotenv` для .env файлів

## 9. Особливі функції

### 9.1. Біометрична автентифікація

- Використати `local_auth` package
- Адаптувати логіку з `services/biometric.js`

### 9.2. Push Notifications

- Налаштувати `firebase_messaging` або `flutter_local_notifications`
- Конвертувати логіку з `services/notifications.js`

### 9.3. Графіки та Charts

- Використати `fl_chart` для статистики
- Конвертувати компоненти з `react-native-chart-kit`

### 9.4. Безпечне зберігання

- `flutter_secure_storage` для токенів та PIN-кодів
- `shared_preferences` для інших налаштувань

### 9.5. Тестові питання з введенням відповіді

- Тип питання "text_input" з полем TextField для введення відповіді
- Відправка текстової відповіді на backend (POST /api/daily-tests/:id/answer з answerText)
- Алгоритм Левенштейна для перевірки відповідей користувача (на backend, порівняння з масивом correctAnswers)
- Підтримка багатьох правильних варіантів відповідей (correctAnswers - масив правильних варіантів)
- Обробка помилок введення та опечаток через порогове значення подібності

### 9.6. Таймер на проходження тесту

- Ліміт 20 хвилин з моменту натискання "Почати тест" (POST /api/daily-tests/:id/start - зберігає startTime, встановлює timeLimit)
- Отримання залишкового часу через GET /api/daily-tests/:id/remaining-time
- Відображення таймера зворотного відліку на екрані тесту
- Автоматичне завершення тесту при досягненні 0 хвилин
- Попередження за 5 хвилин до закінчення часу
- Блокування подальших відповідей після закінчення часу

### 9.7. Аналіз неправильних відповідей

- Відображення списку неправильних відповідей після завершення тесту
- Отримання аналізу через GET /api/daily-tests/:id/wrong-answers-analysis
- Посилання на статті з бази знань для кожного неправильного питання (якщо є прив'язка knowledgeArticle)
- Навігація до статей бази знань для детального вивчення теми
- Відображення правильної відповіді та відповіді користувача
- Рекомендації для покращення результатів

### 9.8. Змагання між закладами

- Вибір закладу для змагання зі списку доступних закладів (GET /api/facilities)
- Створення змагання (POST /api/facility-competitions) - користувач вибирає заклад-противник
- Відображення відсотка правильних відповідей кожного закладу (розрахунок на backend)
- Врахування різної кількості працівників (10 в одному закладі, 16 в іншому - система справедливо порівнює відсотки)
- Визначення переможця (заклад з найвищим відсотком правильних відповідей)
- Прогрес обох закладів в реальному часі (GET /api/facility-competitions/:id/progress)
- Історія змагань з результатами

### 9.9. Завантаження фото аватара

- Вибір фото з галереї або камери (image_picker)
- Обрізка та масштабування фото перед завантаженням (image_cropper)
- Завантаження аватара на сервер (POST /api/users/:id/avatar, multipart/form-data)
- Видалення аватара (DELETE /api/users/:id/avatar)
- Відображення аватара в профілі та в інших місцях (UserProfileScreen, список друзів, рейтинг)
- Збереження URL аватара в user.avatarUrl

### 9.10. Управління доступом до бази знань ✅

- ✅ Перевірка статусу доступу до бази знань (GET /api/knowledge-base/access-status)
- ✅ Відображення повідомлення, якщо доступ закритий
- ✅ Фільтрація статей по посаді користувача (відображати тільки статті, прив'язані до посади)
- ✅ KnowledgeBaseProvider для управління станом
- ✅ KnowledgeBaseRepository з усіма методами (статті, категорії, пошук, закладки, коментарі)

### 9.11. Прив'язка статей до питань та посад

- Прив'язка статті з бази знань до питання (поле knowledgeArticle в Question)
- Автоматичне відображення посилання на статтю при неправильній відповіді
- Прив'язка статей до посад (поле positions в KnowledgeBase) ✅
- Відображення тільки релевантних статей для посади користувача ✅

## 10. Тестування та адаптація

### 10.1. Адаптивний дизайн

- Використати `LayoutBuilder` та `MediaQuery` для responsive design
- Адаптація під планшети через breakpoints

### 10.2. Safe Area

- Використати вбудований `SafeArea` widget
- Адаптація під різні вирізи екранів

### 10.3. Орієнтація

- Використати `SystemChrome.setPreferredOrientations` для блокування орієнтації
- Адаптація layout при зміні орієнтації

## 11. Файли для створення/конвертації

### Ключові файли:

- `lib/main.dart` - точка входу
- `lib/app.dart` - головний App widget
- `lib/presentation/navigation/app_router.dart` - навігація
- `lib/data/services/api_service.dart` - API клієнт
- `lib/presentation/providers/auth_provider.dart` - state management для автентифікації
- ✅ `lib/data/models/knowledge_article_model.dart` - модель статті бази знань
- ✅ `lib/data/repositories/knowledge_base_repository.dart` - репозиторій бази знань
- ✅ `lib/presentation/providers/knowledge_base_provider.dart` - провайдер бази знань
- ✅ `lib/presentation/screens/knowledge/knowledge_base_screen.dart` - екран бази знань
- ✅ `lib/presentation/screens/knowledge/article_detail_screen.dart` - детальний перегляд статті
- ✅ `lib/core/utils/image_url_helper.dart` - utility для URL зображень
- Всі екрани в `lib/presentation/screens/`
- Всі widgets в `lib/presentation/widgets/`
- Всі сервіси в `lib/data/services/`
- Всі моделі в `lib/data/models/`

## 12. Порядок виконання

1. Створити Flutter проєкт та базову структуру
2. Налаштувати залежності в `pubspec.yaml`
3. Створити API service та базові сервіси
4. Налаштувати state management (Riverpod/Provider)
5. Створити навігацію
6. Конвертувати екрани автентифікації
7. Конвертувати основні екрани (Home, Test, Stats)
8. Конвертувати додаткові екрани
9. Конвертувати компоненти та widgets
10. Налаштувати конфігурації Android/iOS
11. Тестування та виправлення помилок

## Примітки

- Зберегти всю функціональність з React Native версії
- Використовувати Flutter best practices
- Дотримуватися Material Design 3 для Android та Cupertino для iOS
- Забезпечити адаптивність під різні розміри екранів
- Зберегти сумісність з існуючим API backend