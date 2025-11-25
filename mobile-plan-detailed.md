# Детальний покроковий план міграції з Expo на Flutter

## ЕТАП 1: Підготовка та ініціалізація (Кроки 1-10)

### Крок 1: Резервне копіювання та підготовка
- [ ] Створити резервну копію папки `mobile/`
- [ ] Перевірити наявність Flutter SDK (версія 3.0+)
- [ ] Перевірити наявність Dart SDK
- [ ] Підготувати робоче середовище

### Крок 2: Створення Flutter проєкту
- [x] Видалити або перейменувати існуючу папку `mobile/`
- [x] Виконати `flutter create mobile` в корені проєкту
- [x] Перевірити, що проєкт успішно створено
- [x] Запустити `flutter doctor` для перевірки налаштувань

### Крок 3: Створення структури папок
- [x] Створити `lib/config/`
- [ ] Створити `lib/core/constants/`
- [ ] Створити `lib/core/utils/`
- [x] Створити `lib/core/validators/`
- [ ] Створити `lib/core/errors/`
- [x] Створити `lib/data/models/`
- [x] Створити `lib/data/repositories/`
- [x] Створити `lib/data/services/`
- [ ] Створити `lib/domain/entities/`
- [ ] Створити `lib/domain/usecases/`
- [x] Створити `lib/presentation/providers/`
- [x] Створити `lib/presentation/screens/auth/`
- [x] Створити `lib/presentation/screens/home/`
- [x] Створити `lib/presentation/screens/test/`
- [x] Створити `lib/presentation/screens/stats/`
- [x] Створити `lib/presentation/screens/knowledge/`
- [x] Створити `lib/presentation/screens/profile/`
- [x] Створити `lib/presentation/screens/achievements/`
- [x] Створити `lib/presentation/screens/shop/`
- [x] Створити `lib/presentation/screens/feedback/`
- [ ] Створити `lib/presentation/screens/tournament/`
- [ ] Створити `lib/presentation/screens/rewards/`
- [ ] Створити `lib/presentation/screens/onboarding/`
- [ ] Створити `lib/presentation/screens/settings/`
- [ ] Створити `lib/presentation/widgets/`
- [x] Створити `lib/presentation/navigation/`
- [ ] Створити `lib/shared/widgets/`
- [ ] Створити `lib/shared/utils/`

### Крок 4: Налаштування pubspec.yaml - базові залежності
- [x] Додати `flutter_riverpod: ^2.4.0` (або `provider: ^6.0.0`)
- [x] Додати `go_router: ^12.0.0` (або `flutter_navigation`)
- [x] Додати `shared_preferences: ^2.2.0`
- [x] Додати `dio: ^5.3.0`
- [x] Додати `flutter_secure_storage: ^9.0.0`
- [x] Додати `local_auth: ^2.1.0` (додано ^2.3.0)
- [ ] Додати `flutter_local_notifications: ^16.0.0`
- [x] Додати `fl_chart: ^0.65.0`
- [x] Додати `flutter_dotenv: ^5.1.0`
- [x] Додати `intl: ^0.18.0` (для форматування дат)

### Крок 5: Налаштування pubspec.yaml - додаткові залежності
- [ ] Додати `image_picker: ^1.0.0` (для вибору зображень)
- [ ] Додати `cached_network_image: ^3.3.0` (для кешування зображень)
- [ ] Додати `url_launcher: ^6.2.0` (для відкриття посилань)
- [ ] Додати `share_plus: ^7.0.0` (для поділу контенту)
- [ ] Додати `package_info_plus: ^5.0.0` (інформація про додаток)
- [ ] Додати `device_info_plus: ^9.0.0` (інформація про пристрій)
- [ ] Додати `connectivity_plus: ^5.0.0` (перевірка інтернету)
- [ ] Додати `fluttertoast: ^8.2.0` (для Toast повідомлень)
- [ ] Додати `shimmer: ^3.0.0` (для skeleton screens)

### Крок 6: Налаштування Android конфігурації
- [ ] Відкрити `android/app/build.gradle`
- [ ] Встановити `minSdkVersion 21`
- [ ] Встановити `targetSdkVersion 34`
- [ ] Додати `compileSdkVersion 34`
- [ ] Відкрити `android/app/src/main/AndroidManifest.xml`
- [ ] Додати permission `INTERNET`
- [ ] Додати permission `CAMERA`
- [ ] Додати permission `READ_EXTERNAL_STORAGE`
- [ ] Додати permission `WRITE_EXTERNAL_STORAGE`
- [x] Додати permission `USE_BIOMETRIC`
- [x] Додати permission `USE_FINGERPRINT`
- [ ] Налаштувати `android:usesCleartextTraffic="true"` для dev

### Крок 7: Налаштування iOS конфігурації
- [x] Відкрити `ios/Runner/Info.plist`
- [x] Додати `NSFaceIDUsageDescription` (опис використання Face ID)
- [ ] Додати `NSCameraUsageDescription` (опис використання камери)
- [ ] Додати `NSPhotoLibraryUsageDescription` (опис використання фото)
- [ ] Відкрити `ios/Podfile`
- [ ] Перевірити мінімальну версію iOS (13.0+)
- [ ] Виконати `cd ios && pod install`

### Крок 8: Створення конфігураційних файлів
- [x] Створити `lib/config/app_config.dart` з API URL
- [ ] Створити `lib/config/theme.dart` з темами
- [ ] Створити `.env` файл з API_URL
- [ ] Створити `.env.example` файл
- [ ] Додати `.env` в `.gitignore`

### Крок 9: Створення базових констант
- [ ] Створити `lib/core/constants/app_constants.dart`
- [ ] Створити `lib/core/constants/colors.dart`
- [ ] Створити `lib/core/constants/spacing.dart`
- [ ] Створити `lib/core/constants/typography.dart`
- [ ] Створити `lib/core/constants/api_endpoints.dart`

### Крок 10: Створення базових утиліт
- [ ] Створити `lib/core/utils/device_info.dart`
- [ ] Створити `lib/core/utils/responsive.dart`
- [ ] Створити `lib/core/utils/adaptive_styles.dart`
- [ ] Створити `lib/core/utils/logger.dart`

## ЕТАП 2: Моделі даних та API (Кроки 11-20)

### Крок 11: Створення моделей даних - User
- [x] Створити `lib/data/models/user_model.dart`
- [x] Додати поля: id, firstName, lastName, login, city, position, coins
- [x] Реалізувати `fromJson` та `toJson`
- [x] Додати `copyWith` метод

### Крок 12: Створення моделей даних - Test та Question
- [x] Створити `lib/data/models/test_model.dart`
- [x] Створити `lib/data/models/question_model.dart`
- [x] Створити `lib/data/models/answer_model.dart`
- [x] Створити `lib/data/models/test_question_model.dart`
- [x] Реалізувати всі необхідні методи

### Крок 12.1: Створення моделей даних - Stats, CategoryStat, TestHistory, CoinHistory
- [x] Створити `lib/data/models/stats_model.dart`
- [x] Створити `lib/data/models/category_stat_model.dart`
- [x] Створити `lib/data/models/test_history_model.dart`
- [x] Реалізувати всі необхідні методи для статистики

### Крок 13: Створення моделей даних - інші
- [ ] Створити `lib/data/models/achievement_model.dart`
- [x] Створити `lib/data/models/shop_item_model.dart`
- [x] Створити `lib/data/models/purchase_model.dart`
- [ ] Створити `lib/data/models/knowledge_article_model.dart`
- [ ] Створити `lib/data/models/feedback_model.dart`
- [ ] Створити `lib/data/models/comment_model.dart`
- [ ] Створити `lib/data/models/tournament_model.dart`
- [ ] Створити `lib/data/models/reward_model.dart`
- [ ] Створити `lib/data/models/friend_model.dart`
- [ ] Створити `lib/data/models/friendship_model.dart`

### Крок 14: Створення API Service - базова конфігурація
- [x] Створити `lib/data/services/api_service.dart`
- [x] Налаштувати Dio instance з baseURL
- [x] Додати timeout (10000ms)
- [x] Налаштувати headers (Content-Type: application/json)

### Крок 15: Створення API Service - Interceptors
- [x] Додати Request Interceptor для токенів
- [x] Реалізувати логіку додавання Bearer token
- [ ] Додати Response Interceptor
- [x] Реалізувати retry логіку (exponential backoff)
- [x] Обробити помилки 401 (unauthorized)
- [ ] Обробити мережеві помилки

### Крок 16: Створення Storage Services
- [ ] Створити `lib/data/services/storage_service.dart`
- [ ] Реалізувати методи для `shared_preferences`
- [ ] Створити `lib/data/services/secure_storage_service.dart`
- [ ] Реалізувати методи для `flutter_secure_storage`
- [ ] Створити абстракцію для обох storage

### Крок 17: Створення Auth Repository
- [x] Створити `lib/data/repositories/auth_repository.dart`
- [x] Реалізувати метод `login(String login, String password)`
- [x] Реалізувати метод `register(UserData data)`
- [x] Реалізувати метод `getCurrentUser()`
- [x] Реалізувати метод `logout()`
- [ ] Реалізувати метод `changePassword(String oldPassword, String newPassword)`
- [ ] Реалізувати метод `updateProfile(UserData data)`
- [x] Реалізувати метод `checkLoginAvailability(String login)`

### Крок 17.1: Створення Test Repository
- [x] Створити `lib/data/repositories/test_repository.dart`
- [x] Реалізувати метод `generateTest()` - генерація нового тесту
- [x] Реалізувати метод `getCurrentTest()` - отримання поточного тесту
- [x] Реалізувати метод `getTest(String testId)` - завантаження тесту за ID
- [x] Реалізувати метод `submitAnswer()` - відправка відповіді на питання
- [x] Реалізувати метод `getRating(String positionId)` - отримання рейтингу

### Крок 17.2: Створення Stats Repository
- [x] Створити `lib/data/repositories/stats_repository.dart`
- [x] Реалізувати метод `getStats(String userId)` - отримання статистики користувача
- [x] Реалізувати метод `getCoinHistory()` - історія монет
- [x] Реалізувати метод `getPurchases()` - історія покупок

### Крок 17.3: Створення Shop Repository
- [x] Створити `lib/data/repositories/shop_repository.dart`
- [x] Реалізувати метод `getItems()` - отримання списку товарів
- [x] Реалізувати метод `getItem(String itemId)` - отримання товару за ID
- [x] Реалізувати метод `purchaseItem(String itemId)` - покупка товару
- [x] Реалізувати метод `getPurchasesHistory()` - історія покупок користувача

### Крок 17.4: Створення Tournament Repository
- [ ] Створити `lib/data/repositories/tournament_repository.dart`
- [ ] Реалізувати метод `getCurrentTournament()` - отримання поточного турніру
- [ ] Реалізувати метод `getTournament(String tournamentId)` - отримання турніру за ID
- [ ] Реалізувати метод `getTournamentLeaderboard(String tournamentId)` - рейтинг турніру
- [ ] Реалізувати метод `getTournamentHistory()` - історія минулих турнірів
- [ ] Реалізувати метод `getCityRanking(String tournamentId)` - рейтинг міст в турнірі

### Крок 17.5: Створення Rewards Repository
- [ ] Створити `lib/data/repositories/rewards_repository.dart`
- [ ] Реалізувати метод `getUserRewards()` - отримання всіх винагород користувача
- [ ] Реалізувати метод `getAchievements()` - отримання ачівок користувача
- [ ] Реалізувати метод `getTournamentRewards()` - отримання нагород з турнірів
- [ ] Реалізувати метод `getRewardStatistics()` - статистика винагород користувача

### Крок 17.6: Створення Friends Repository
- [ ] Створити `lib/data/repositories/friends_repository.dart`
- [ ] Реалізувати метод `searchUsers(String query)` - пошук користувачів
- [ ] Реалізувати метод `getFriends()` - отримання списку друзів
- [ ] Реалізувати метод `getFriendRequests()` - отримання запитів на дружбу
- [ ] Реалізувати метод `sendFriendRequest(String userId)` - відправка запиту на дружбу
- [ ] Реалізувати метод `acceptFriendRequest(String requestId)` - прийняття запиту
- [ ] Реалізувати метод `rejectFriendRequest(String requestId)` - відхилення запиту
- [ ] Реалізувати метод `removeFriend(String friendId)` - видалення з друзів
- [ ] Реалізувати метод `getFriendStatus(String userId)` - перевірка статусу дружби
- [ ] Реалізувати метод `getUserProfile(String userId)` - отримання профілю користувача з нагородами та ачівками
- [ ] Реалізувати метод `compareWithUser(String userId)` - порівняння результатів з користувачем

### Крок 18: Створення Biometric Service
- [x] Створити `lib/data/services/biometric_service.dart`
- [x] Реалізувати метод `checkBiometricAvailability()` (canAuthenticate)
- [x] Реалізувати метод `authenticateWithBiometric()` (authenticate)
- [x] Обробити різні типи біометрії (Face ID, Touch ID, Fingerprint)
- [x] Обробити помилки автентифікації

### Крок 19: Створення PIN Code Service
- [ ] Створити `lib/data/services/pin_code_service.dart`
- [ ] Реалізувати метод `setPinCode(String pin)`
- [ ] Реалізувати метод `verifyPinCode(String pin)`
- [ ] Реалізувати метод `deletePinCode()`
- [ ] Реалізувати логіку блокування після невдалих спроб

### Крок 20: Створення Security Service
- [ ] Створити `lib/data/services/security_service.dart`
- [ ] Реалізувати метод `getSecuritySettings()`
- [ ] Реалізувати метод `setReAuthMethod(String method)`
- [ ] Реалізувати метод `setLockTimeout(int minutes)`
- [ ] Реалізувати метод `shouldRequireReAuth()`
- [ ] Реалізувати метод `saveLastAppCloseTime()`

## ЕТАП 3: State Management (Кроки 21-25)

### Крок 21: Налаштування Riverpod/Provider
- [ ] Створити `lib/presentation/providers/providers.dart` (root provider)
- [x] Налаштувати ProviderScope в `main.dart`
- [ ] Створити providers для API service
- [ ] Створити providers для Storage services

### Крок 22: Створення Auth Provider
- [x] Створити `lib/presentation/providers/auth_provider.dart`
- [x] Реалізувати StateNotifier для auth state
- [x] Додати поля: user, isAuthenticated, loading
- [x] Реалізувати метод `login()`
- [x] Реалізувати метод `register()`
- [x] Реалізувати метод `logout()`
- [x] Реалізувати метод `checkAuth()`
- [x] Реалізувати метод `updateUser()`
- [x] Додати біометричну автентифікацію (biometricEnabled, biometricVerified, setBiometricEnabled, setBiometricVerified, resetBiometricVerification)

### Крок 23: Створення Device Provider
- [ ] Створити `lib/presentation/providers/device_provider.dart`
- [ ] Реалізувати логіку визначення типу пристрою (phone/tablet)
- [ ] Реалізувати логіку визначення орієнтації
- [ ] Реалізувати логіку визначення розміру екрану
- [ ] Додати listeners для зміни орієнтації

### Крок 24: Створення Theme Provider
- [ ] Створити `lib/presentation/providers/theme_provider.dart`
- [ ] Реалізувати логіку перемикання теми (light/dark)
- [ ] Інтегрувати з системною темою
- [ ] Створити ThemeData для обох тем

### Крок 25: Створення додаткових Providers
- [x] Створити `lib/presentation/providers/test_provider.dart`
- [x] Створити `lib/presentation/providers/stats_provider.dart`
- [ ] Створити `lib/presentation/providers/achievements_provider.dart`
- [x] Створити `lib/presentation/providers/shop_provider.dart`
- [ ] Створити `lib/presentation/providers/tournament_provider.dart`
- [ ] Створити `lib/presentation/providers/rewards_provider.dart`

## ЕТАП 4: Навігація (Кроки 26-30)

### Крок 26: Створення App Router
- [x] Створити `lib/presentation/navigation/app_router.dart`
- [x] Налаштувати GoRouter з базовими routes
- [ ] Додати route для OnboardingScreen
- [x] Додати route для LoginScreen
- [x] Додати route для RegisterScreen
- [x] Додати route для TestScreen
- [x] Додати route для TestResultsScreen
- [x] Додати route для StatsScreen
- [x] Додати route для BiometricAuthScreen
- [x] Додати route для ProfileScreen
- [x] Додати route для ShopScreen
- [x] Додати route для KnowledgeBaseScreen
- [x] Додати route для AchievementsScreen
- [x] Додати route для FeedbackScreen
- [ ] Додати route для TournamentScreen
- [ ] Додати route для RewardsScreen
- [ ] Додати route для FriendsScreen
- [ ] Додати route для SearchUsersScreen
- [ ] Додати route для UserProfileScreen (профіль іншого користувача)
- [ ] Додати route для PinCodeScreen

### Крок 27: Створення Main Navigation
- [ ] Створити `lib/presentation/navigation/main_navigation.dart`
- [ ] Реалізувати BottomNavigationBar для телефонів
- [ ] Реалізувати Drawer для планшетів
- [ ] Додати адаптивну логіку (перемикання між tabs/drawer)
- [ ] Додати routes для всіх основних екранів

### Крок 28: Налаштування Navigation Guards
- [ ] Реалізувати перевірку onboarding status
- [x] Реалізувати перевірку authentication
- [ ] Реалізувати перевірку re-auth requirement
- [x] Додати redirect логіку

### Крок 29: Створення Navigation Helpers
- [ ] Створити `lib/presentation/navigation/navigation_helpers.dart`
- [ ] Додати helper методи для навігації
- [ ] Додати методи для передачі параметрів
- [ ] Додати методи для повернення назад

### Крок 30: Інтеграція навігації в App
- [x] Оновити `lib/main.dart` з GoRouter
- [x] Налаштувати MaterialApp/CupertinoApp
- [ ] Додати обробку deep links
- [x] Протестувати навігацію

## ЕТАП 5: Валідація та утиліти (Кроки 31-35)

### Крок 31: Створення валідаторів
- [x] Створити `lib/core/validators/login_validator.dart`
- [x] Реалізувати валідацію логіну (3-30 символів, латинські літери, цифри, підкреслення)
- [ ] Створити `lib/core/validators/pin_validator.dart`
- [ ] Реалізувати валідацію PIN (4-6 цифр)
- [ ] Створити `lib/core/validators/password_validator.dart`
- [ ] Створити `lib/core/validators/email_validator.dart`
- [ ] Створити `lib/core/validators/validators.dart` (загальні валідатори)

### Крок 32: Створення Error Handling
- [ ] Створити `lib/core/errors/app_exception.dart`
- [ ] Створити `lib/core/errors/network_exception.dart`
- [ ] Створити `lib/core/errors/auth_exception.dart`
- [ ] Створити `lib/core/errors/error_handler.dart`
- [ ] Реалізувати глобальну обробку помилок

### Крок 33: Створення Responsive Utils
- [ ] Оновити `lib/core/utils/responsive.dart`
- [ ] Додати методи для визначення breakpoints
- [ ] Додати методи для адаптивних значень
- [ ] Додати методи для scale (font, size)
- [ ] Оновити `lib/core/utils/adaptive_styles.dart`
- [ ] Додати методи для адаптивних стилів

### Крок 34: Створення Device Utils
- [ ] Оновити `lib/core/utils/device_info.dart`
- [ ] Додати методи для визначення типу пристрою
- [ ] Додати методи для визначення розміру екрану
- [ ] Додати методи для визначення орієнтації
- [ ] Додати методи для safe area insets

### Крок 35: Створення інших утиліт
- [ ] Створити `lib/core/utils/date_formatter.dart`
- [ ] Створити `lib/core/utils/currency_formatter.dart`
- [ ] Створити `lib/core/utils/image_utils.dart`
- [ ] Створити `lib/core/utils/validation_messages.dart`

## ЕТАП 6: Базові Widgets (Кроки 36-45)

### Крок 36: Створення EmptyState Widget
- [ ] Створити `lib/presentation/widgets/empty_state.dart`
- [ ] Реалізувати EmptyState widget з іконкою, заголовком, описом
- [ ] Додати адаптивний дизайн
- [ ] Додати можливість кастомізації

### Крок 37: Створення Toast Widget
- [ ] Створити `lib/presentation/widgets/toast.dart`
- [ ] Інтегрувати `fluttertoast` або створити custom
- [ ] Додати методи для різних типів повідомлень (success, error, warning, info)
- [ ] Додати анімації

### Крок 38: Створення Loading Widgets
- [ ] Створити `lib/presentation/widgets/loading_indicator.dart`
- [ ] Створити `lib/presentation/widgets/skeleton_loader.dart`
- [ ] Реалізувати shimmer ефект
- [ ] Додати різні типи skeleton screens

### Крок 39: Створення Error Widget
- [ ] Створити `lib/presentation/widgets/error_widget.dart`
- [ ] Реалізувати відображення помилок
- [ ] Додати кнопку retry
- [ ] Додати адаптивний дизайн

### Крок 40: Створення Form Widgets
- [ ] Створити `lib/presentation/widgets/custom_text_field.dart`
- [ ] Додати валідацію в реальному часі
- [ ] Додати відображення помилок
- [ ] Створити `lib/presentation/widgets/custom_button.dart`
- [ ] Додати різні стилі кнопок
- [ ] Додати loading state

### Крок 41: Створення CityPicker Widget
- [ ] Створити `lib/presentation/widgets/city_picker.dart`
- [ ] Реалізувати пошук міст
- [ ] Додати список міст з API
- [ ] Додати вибір міста

### Крок 42: Створення PositionPicker Widget
- [ ] Створити `lib/presentation/widgets/position_picker.dart`
- [ ] Реалізувати пошук посад
- [ ] Додати список посад з API
- [ ] Додати вибір посади

### Крок 43: Створення PinCodeInput Widget
- [ ] Створити `lib/presentation/widgets/pin_code_input.dart`
- [ ] Реалізувати введення PIN-коду (4-6 цифр)
- [ ] Додати візуальні індикатори (кружечки)
- [ ] Додати анімацію при введенні
- [ ] Додати shake анімацію при помилці

### Крок 44: Створення Responsive Widgets
- [ ] Створити `lib/presentation/widgets/responsive/responsive_container.dart`
- [ ] Створити `lib/presentation/widgets/responsive/adaptive_layout.dart`
- [ ] Реалізувати адаптацію під різні розміри екранів
- [ ] Додати breakpoints

### Крок 45: Створення інших базових Widgets
- [ ] Створити `lib/presentation/widgets/card_widget.dart`
- [ ] Створити `lib/presentation/widgets/badge_widget.dart`
- [ ] Створити `lib/presentation/widgets/divider_widget.dart`
- [ ] Створити `lib/presentation/widgets/icon_button_widget.dart`

## ЕТАП 7: Екрани автентифікації (Кроки 46-52)

### Крок 46: Створення OnboardingScreen
- [ ] Створити `lib/presentation/screens/onboarding/onboarding_screen.dart`
- [ ] Реалізувати PageView з кількома екранами
- [ ] Додати індикатор прогресу
- [ ] Додати кнопки "Пропустити" та "Далі"
- [ ] Зберегти статус onboarding в storage

### Крок 47: Створення LoginScreen
- [x] Створити `lib/presentation/screens/auth/login_screen.dart`
- [x] Додати TextField для логіну
- [x] Додати TextField для пароля (з приховуванням)
- [x] Додати кнопку "Увійти"
- [x] Додати валідацію полів
- [x] Інтегрувати з AuthProvider
- [x] Додати обробку помилок
- [x] Додати loading state
- [x] Додати перехід на RegisterScreen

### Крок 48: Створення RegisterScreen
- [x] Створити `lib/presentation/screens/auth/register_screen.dart`
- [x] Додати TextField для імені
- [x] Додати TextField для прізвища
- [ ] Додати CityPicker
- [ ] Додати PositionPicker
- [x] Додати TextField для логіну з валідацією
- [x] Додати перевірку унікальності логіну в реальному часі
- [x] Додати TextField для пароля
- [x] Додати TextField для підтвердження пароля
- [x] Додати валідацію всіх полів
- [x] Інтегрувати з AuthProvider
- [x] Додати обробку помилок

### Крок 49: Створення BiometricAuthScreen
- [x] Створити `lib/presentation/screens/auth/biometric_auth_screen.dart`
- [x] Додати іконку біометрії (Face ID/Touch ID/Fingerprint)
- [x] Інтегрувати з BiometricService
- [x] Додати автоматичний запит автентифікації
- [x] Додати обробку успішної автентифікації
- [x] Додати обробку помилок
- [x] Додати кнопку переходу на PIN/Password
- [x] Створити BiometricWrapper для автоматичної біометрії при відкритті додатку
- [x] Додати обробку lifecycle станів (paused/resumed)

### Крок 50: Створення PinCodeScreen
- [ ] Створити `lib/presentation/screens/auth/pin_code_screen.dart`
- [ ] Додати PinCodeInput widget
- [ ] Додати логіку перевірки PIN-коду
- [ ] Додати підрахунок невдалих спроб
- [ ] Додати блокування після 5 невдалих спроб
- [ ] Додати таймер блокування (1 хвилина)
- [ ] Додати кнопку "Забули PIN?"
- [ ] Додати вібро-відгук при помилці
- [ ] Додати shake анімацію

### Крок 51: Створення PinSetupScreen
- [ ] Створити `lib/presentation/screens/auth/pin_setup_screen.dart`
- [ ] Додати введення нового PIN-коду
- [ ] Додати підтвердження PIN-коду
- [ ] Додати валідацію (4-6 цифр, співпадіння)
- [ ] Інтегрувати з PinCodeService
- [ ] Додати обробку помилок

### Крок 52: Створення SecuritySettingsScreen
- [ ] Створити `lib/presentation/screens/settings/security_settings_screen.dart`
- [ ] Додати вибір методу повторного входу (біометрія, PIN, пароль, вимкнено)
- [ ] Додати увімкнення/вимкнення біометрії
- [ ] Додати зміну PIN-коду
- [ ] Додати налаштування часу блокування
- [ ] Інтегрувати з SecurityService

## ЕТАП 8: Основні екрани (Кроки 53-60)

### Крок 53: Створення HomeScreen
- [x] Створити `lib/presentation/screens/home/home_screen.dart`
- [x] Додати відображення поточного тесту
- [x] Додати карточку з інформацією про тест
- [x] Додати кнопку початку тестування
- [x] Додати кнопку генерації нового тесту
- [x] Додати відображення балансу монет
- [x] Додати швидкі дії (Статистика, База знань, Профіль, Магазин, Ачівки, Зворотний зв'язок)
- [x] Додати pull-to-refresh
- [x] Додати кнопку оновлення в AppBar
- [x] Додати автооновлення при поверненні в додаток (WidgetsBindingObserver)
- [x] Видалити admin-специфічну логіку для тестів
- [ ] Додати нагадування про невиконаний тест
- [ ] Додати таймер до дедлайну
- [ ] Додати індикатор нових ачівок
- [ ] Додати відображення поточного турніру (карточка з рейтингом міста)
- [ ] Додати адаптивний дизайн (grid для планшетів)

### Крок 54: Створення TestScreen
- [x] Створити `lib/presentation/screens/test/test_screen.dart`
- [x] Додати відображення питання
- [x] Додати відображення варіантів відповідей
- [x] Додати ProgressBar (1/5, 2/5, тощо)
- [x] Додати відображення зображення (якщо є)
- [x] Додати lazy loading зображень
- [x] Додати масштабування зображення при натисканні
- [x] Додати обробку відповідей
- [x] Додати показ результату (правильно/неправильно)
- [x] Додати показ нарахованих монет
- [x] Додати показ пояснення при помилці
- [x] Додати таймер до дедлайну (до 23:59:59 дня створення тесту)
- [x] Додати блокування навігації назад
- [x] Додати підтвердження виходу з тесту
- [x] Додати анімації переходів (AnimatedSwitcher)
- [x] Видалити admin-специфічну логіку (універсальна логіка для всіх)
- [x] Додати автоматичний перехід до наступного питання через 3 секунди
- [x] Додати перехід до результатів після останнього питання

### Крок 55: Створення TestResultsScreen
- [x] Створити `lib/presentation/screens/test/test_results_screen.dart`
- [x] Додати відображення кінцевого результату (X/5)
- [x] Додати відсоток правильних відповідей
- [x] Додати нараховані монети
- [x] Додати детальну інформацію по кожному питанню
- [x] Додати відображення позиції в рейтингу
- [x] Додати кнопку "На головну"
- [x] Додати кнопку "Переглянути статистику"

### Крок 56: Створення StatsScreen
- [x] Створити `lib/presentation/screens/stats/stats_screen.dart`
- [x] Додати особисту статистику користувача
- [x] Додати кількість пройдених тестів
- [x] Додати відсоток правильних відповідей
- [x] Додати графік результатів по днях (LineChart, останні 30 днів)
- [x] Додати рейтинг користувача
- [x] Додати детальну статистику по категоріях (PieChart)
- [x] Додати історію тестів (останні 5)
- [x] Додати баланс монет
- [x] Додати історію нарахувань/витрат монет
- [x] Додати pull-to-refresh
- [x] Додати навігацію до TestResultsScreen з історії тестів

### Крок 57: Створення KnowledgeBaseScreen
- [x] Створити `lib/presentation/screens/knowledge/knowledge_base_screen.dart` (заглушка)
- [ ] Додати список категорій (горизонтальний скрол)
- [ ] Додати список статей по категорії
- [ ] Додати пошук по базі знань
- [ ] Додати закладки для статей
- [ ] Додати навігацію між статтями
- [ ] Додати відображення медіа контенту
- [ ] Додати lazy loading зображень
- [ ] Додати коментарі до статей
- [ ] Додати фільтрацію по посаді

### Крок 58: Створення ProfileScreen
- [x] Створити `lib/presentation/screens/profile/profile_screen.dart`
- [x] Додати відображення інформації про користувача
- [x] Додати баланс монет
- [ ] Додати швидкий перехід до ачівок
- [ ] Додати швидкий перехід до магазину
- [ ] Додати швидкий перехід до винагород
- [ ] Додати швидкий перехід до друзів
- [ ] Додати редагування профілю
- [ ] Додати зміну паролю
- [x] Додати налаштування безпеки (біометрична автентифікація)
- [x] Додати вихід з акаунту
- [ ] Додати запит на видалення акаунту

### Крок 58.1: Створення RewardsScreen (Сторінка винагород)
- [ ] Створити `lib/presentation/screens/rewards/rewards_screen.dart`
- [ ] Додати відображення всіх ачівок користувача
- [ ] Додати відображення нагород з турнірів
- [ ] Додати відображення спеціальних винагород
- [ ] Додати фільтрацію винагород по типу (ачівки, турніри, спеціальні)
- [ ] Додати сортування винагород (за датою отримання, за типом, за рідкістю)
- [ ] Додати детальну інформацію про кожну винагороду (модальне вікно)
- [ ] Додати статистику винагород (загальна кількість, по типах, по рідкості)
- [ ] Додати прогрес до отримання наступних винагород
- [ ] Додати візуальні індикатори отриманих/неотриманих винагород
- [ ] Додати анімацію при отриманні нової винагороди
- [ ] Додати можливість поділу винагороди в соціальних мережах

### Крок 59: Створення EditProfileScreen
- [ ] Створити `lib/presentation/screens/profile/edit_profile_screen.dart`
- [ ] Додати редагування імені
- [ ] Додати редагування прізвища
- [ ] Додати зміну міста (CityPicker)
- [ ] Додати зміну посади (PositionPicker)
- [ ] Додати валідацію
- [ ] Інтегрувати з API

### Крок 60: Створення ChangePasswordScreen
- [ ] Створити `lib/presentation/screens/profile/change_password_screen.dart`
- [ ] Додати поле для старого пароля
- [ ] Додати поле для нового пароля
- [ ] Додати поле для підтвердження пароля
- [ ] Додати валідацію
- [ ] Інтегрувати з API

## ЕТАП 9: Додаткові екрани (Кроки 61-68)

### Крок 61: Створення AchievementsScreen
- [x] Створити `lib/presentation/screens/achievements/achievements_screen.dart` (заглушка)
- [ ] Додати список всіх ачівок (grid layout)
- [ ] Додати візуальну індикацію отриманих/неотриманих
- [ ] Додати прогрес-бар до отримання ачівки
- [ ] Додати детальну інформацію про ачівку (модальне вікно)
- [ ] Додати фільтрацію по типу
- [ ] Додати анімацію при отриманні
- [ ] Додати сповіщення про нову ачівку
- [ ] Додати поділ ачівки в соціальних мережах
- [ ] Додати загальну статистику

### Крок 62: Створення ShopScreen
- [x] Створити `lib/presentation/screens/shop/shop_screen.dart`
- [x] Додати список товарів (grid layout)
- [x] Додати фільтрацію по типу товарів
- [x] Додати відображення ціни в монетах
- [x] Додати детальну інформацію про товар
- [x] Додати покупку товарів
- [x] Додати підтвердження покупки
- [x] Додати відображення статусу покупки
- [x] Додати історію покупок
- [x] Додати адаптивний дизайн

### Крок 63: Створення FeedbackScreen
- [x] Створити `lib/presentation/screens/feedback/feedback_screen.dart` (заглушка)
- [ ] Додати форму зворотного зв'язку
- [ ] Додати вибір типу зворотного зв'язку
- [ ] Додати валідацію
- [ ] Додати відправку на сервер
- [ ] Додати історію відправлених звернень
- [ ] Додати відстеження статусу
- [ ] Додати прикріплення скріншотів
- [ ] Додати FAQ

### Крок 64: Створення NotificationSettingsScreen
- [ ] Створити `lib/presentation/screens/settings/notification_settings_screen.dart`
- [ ] Додати налаштування часу нагадувань
- [ ] Додати увімкнення/вимкнення різних типів сповіщень
- [ ] Додати збереження налаштувань
- [ ] Інтегрувати з NotificationService

### Крок 65: Створення Test Widgets
- [x] Створити `lib/presentation/widgets/test/question_card.dart` (інтегровано в TestScreen)
- [x] Створити `lib/presentation/widgets/test/answer_button.dart` (інтегровано в TestScreen)
- [x] Створити `lib/presentation/widgets/test/progress_bar.dart` (інтегровано в TestScreen)
- [x] Створити `lib/presentation/widgets/test/timer_widget.dart` (інтегровано в TestScreen)
- [x] Створити `lib/presentation/widgets/test/test_result_card.dart` (інтегровано в TestResultsScreen)
- [x] Створити `lib/presentation/widgets/test/rating_position_card.dart` (інтегровано в TestResultsScreen)

### Крок 66: Створення Stats Widgets
- [ ] Створити `lib/presentation/widgets/stats/stats_chart.dart`
- [ ] Реалізувати LineChart для результатів по днях
- [ ] Реалізувати PieChart для статистики по категоріях
- [ ] Додати інтерактивність графіків

### Крок 67: Створення Knowledge Widgets
- [ ] Створити `lib/presentation/widgets/knowledge/article_card.dart`
- [ ] Створити `lib/presentation/widgets/knowledge/comment_card.dart`
- [ ] Створити `lib/presentation/widgets/knowledge/comment_form.dart`
- [ ] Додати lazy loading для зображень

### Крок 68: Створення Shop Widgets
- [ ] Створити `lib/presentation/widgets/shop/shop_item_card.dart`
- [ ] Створити `lib/presentation/widgets/shop/purchase_status_badge.dart`
- [ ] Створити `lib/presentation/widgets/shop/transaction_card.dart`

### Крок 68.1: Створення TournamentScreen
- [ ] Створити `lib/presentation/screens/tournament/tournament_screen.dart`
- [ ] Додати відображення поточного турніру
- [ ] Додати рейтинг міст
- [ ] Додати прогрес свого міста
- [ ] Додати таймер до кінця турніру
- [ ] Додати історію минулих турнірів
- [ ] Додати нагороди та бонуси турніру
- [ ] Додати детальну статистику по містах

### Крок 68.2: Створення Rewards Widgets
- [ ] Створити `lib/presentation/widgets/rewards/reward_card.dart`
- [ ] Створити `lib/presentation/widgets/rewards/reward_badge.dart`
- [ ] Створити `lib/presentation/widgets/rewards/reward_statistics_card.dart`
- [ ] Створити `lib/presentation/widgets/rewards/reward_progress_indicator.dart`
- [ ] Створити `lib/presentation/widgets/rewards/reward_filter_chip.dart`

### Крок 68.3: Створення Friends Widgets
- [ ] Створити `lib/presentation/widgets/friends/friend_card.dart`
- [ ] Створити `lib/presentation/widgets/friends/friend_request_card.dart`
- [ ] Створити `lib/presentation/widgets/friends/user_search_card.dart`
- [ ] Створити `lib/presentation/widgets/friends/friend_status_badge.dart`
- [ ] Створити `lib/presentation/widgets/friends/friend_action_button.dart`

### Крок 68.4: Створення User Profile Widgets
- [ ] Створити `lib/presentation/widgets/profile/user_profile_header.dart`
- [ ] Створити `lib/presentation/widgets/profile/user_rewards_section.dart`
- [ ] Створити `lib/presentation/widgets/profile/user_achievements_grid.dart`
- [ ] Створити `lib/presentation/widgets/profile/user_statistics_card.dart`
- [ ] Створити `lib/presentation/widgets/profile/friend_status_badge.dart`
- [ ] Створити `lib/presentation/widgets/profile/compare_results_button.dart`

## ЕТАП 10: Notification Service (Кроки 69-72)

### Крок 69: Налаштування Local Notifications
- [ ] Створити `lib/data/services/notification_service.dart`
- [ ] Налаштувати `flutter_local_notifications`
- [ ] Додати ініціалізацію нотифікацій
- [ ] Додати запит дозволів

### Крок 70: Реалізація Notification Logic
- [ ] Реалізувати нагадування про невиконаний тест (16:00, 19:00)
- [ ] Реалізувати сповіщення про новий тест (12:00)
- [ ] Реалізувати сповіщення про ачівки
- [ ] Реалізувати сповіщення про статус покупок
- [ ] Додати scheduled notifications

### Крок 71: Обробка Notification Actions
- [ ] Додати обробку натискань на нотифікації
- [ ] Додати навігацію до відповідних екранів
- [ ] Додати обробку різних типів нотифікацій

### Крок 72: Налаштування Android Channels
- [ ] Створити канал "default"
- [ ] Створити канал "test-reminders"
- [ ] Створити канал "achievements"
- [ ] Налаштувати звуки та вібрації

## ЕТАП 11: Інтеграція та тестування (Кроки 73-80)

### Крок 73: Інтеграція всіх компонентів
- [ ] Перевірити інтеграцію всіх екранів
- [ ] Перевірити навігацію між екранами
- [ ] Перевірити state management
- [ ] Перевірити API інтеграцію

### Крок 74: Тестування на Android
- [ ] Запустити додаток на Android емуляторі
- [ ] Перевірити всі екрани
- [ ] Перевірити біометричну автентифікацію
- [ ] Перевірити push notifications
- [ ] Перевірити адаптивність під різні розміри екранів
- [ ] Виправити знайдені помилки

### Крок 75: Тестування на iOS
- [ ] Запустити додаток на iOS симуляторі
- [ ] Перевірити всі екрани
- [ ] Перевірити Face ID/Touch ID
- [ ] Перевірити push notifications
- [ ] Перевірити адаптивність
- [ ] Виправити знайдені помилки

### Крок 76: Тестування на фізичних пристроях
- [ ] Запустити на Android телефоні
- [ ] Запустити на iPhone
- [ ] Перевірити всі функції
- [ ] Перевірити продуктивність
- [ ] Виправити помилки

### Крок 77: Оптимізація продуктивності
- [ ] Перевірити час запуску додатку
- [ ] Оптимізувати завантаження зображень
- [ ] Оптимізувати API запити
- [ ] Мінімізувати re-renders
- [ ] Оптимізувати розмір додатку

### Крок 78: Тестування адаптивності
- [ ] Перевірити на малих екранах
- [ ] Перевірити на середніх екранах
- [ ] Перевірити на великих екранах (планшети)
- [ ] Перевірити landscape орієнтацію
- [ ] Перевірити safe area на різних пристроях

### Крок 79: Фінальне тестування
- [ ] Пройти повний flow автентифікації
- [ ] Пройти повний flow тестування
- [ ] Перевірити всі функції
- [ ] Перевірити обробку помилок
- [ ] Перевірити edge cases

### Крок 80: Документація та фіналізація
- [ ] Оновити README.md
- [ ] Додати інструкції з встановлення
- [ ] Додати інструкції з налаштування
- [ ] Додати опис архітектури
- [ ] Створити список відомих проблем (якщо є)

## Додаткові кроки (за потреби)

### Крок 81: Accessibility
- [ ] Додати accessibility labels
- [ ] Перевірити підтримку screen readers
- [ ] Додати підтримку Dynamic Type
- [ ] Перевірити контрастність кольорів

### Крок 82: Локалізація
- [ ] Перевірити всі тексти
- [ ] Додати підтримку інших мов (якщо потрібно)
- [ ] Перевірити форматування дат та чисел

### Крок 83: Безпека
- [ ] Перевірити безпечне зберігання токенів
- [ ] Перевірити безпечне зберігання PIN-кодів
- [ ] Перевірити HTTPS з'єднання
- [ ] Перевірити обробку помилок безпеки

---

## Примітки

- Кожен крок має бути виконаний послідовно
- Після кожного етапу варто робити commit
- Тестувати після кожного великого етапу
- Дотримуватися Flutter best practices
- Зберігати сумісність з існуючим API

## Backend зміни (виконано)

### Виправлення генерації тестів та запобігання повторення питань

#### 1. Створено модель QuestionHistory (`backend/models/QuestionHistory.js`)
- Зберігає історію всіх питань, які користувач бачив
- Не видаляється при скиданні поточного тесту
- Містить: user, question, firstSeenAt, timesShown, everAnsweredCorrectly

#### 2. Оновлено логіку генерації тестів (`backend/services/dailyTestService.js`)
- Система виключає питання з QuestionHistory + завершені тести
- Питання **ніколи не повторюються** після того як користувач їх побачив
- Навіть після скидання поточного тесту користувач отримує інші питання
- Автоматичне збереження питань в історію при завершенні тесту
- Виправлено логіку для всіх користувачів (видалено admin-специфічні винятки)

#### 3. Оновлено ендпоінти скидання тестів (`backend/routes/dailyTests.js`)
- **POST /api/daily-tests/reset-user-test/:userId** - скинути поточний тест
  - Зберігає питання в QuestionHistory перед видаленням
  - Користувач може пройти тест знову, але з іншими питаннями
- **POST /api/daily-tests/reset-all-user-tests/:userId** - скинути всю статистику
  - Видаляє всі тести + QuestionHistory
  - Користувач може проходити всі питання заново з нуля
- **POST /api/daily-tests/bulk-reset** - масове скидання поточних тестів
  - Зберігає питання в історію для кожного користувача
- **POST /api/daily-tests/bulk-reset-all** - масове скидання всієї статистики
  - Видаляє тести + історію для всіх вибраних користувачів

#### 4. Виправлено формат даних при генерації тесту
- Додано populate для questions.question перед поверненням
- Додано фільтрацію відповідей (приховування isCorrect до завершення)
- Виправлено для ендпоінтів: /generate та /generate-for-user/:userId

#### 5. Виправлено помилки з рейтингом (`backend/routes/stats.js`)
- Додано перевірку валідності ObjectId для position та city
- Якщо передано невалідний ObjectId - повертає порожній масив замість помилки

#### 6. Оновлено роут користувачів (`backend/routes/users.js`)
- Додано статистику remainingQuestions для кожного користувача:
  - total - загальна кількість питань для посади
  - answered - кількість відповіджених питань
  - remaining - залишок питань

#### 7. Виправлено logіку тестів для адміністраторів
- Видалено винятки для адміністраторів
- Тепер завершений тест блокує генерацію нового для ВСІХ користувачів
- Це забезпечує коректну роботу історії питань

## Mobile зміни (виконано)

### Реалізація біометричної автентифікації

#### 1. Налаштування залежностей та конфігурації
- Додано `local_auth: ^2.3.0` в `pubspec.yaml`
- Додано permissions `USE_BIOMETRIC` та `USE_FINGERPRINT` в `AndroidManifest.xml`
- Додано `NSFaceIDUsageDescription` в `ios/Runner/Info.plist`
- Виправлено `MainActivity.kt` - змінено з `FlutterActivity` на `FlutterFragmentActivity` для підтримки `local_auth`

#### 2. Створено BiometricService (`lib/data/services/biometric_service.dart`)
- Реалізовано метод `canAuthenticate()` - перевірка доступності біометрії
- Реалізовано метод `getAvailableBiometrics()` - отримання списку доступних типів
- Реалізовано метод `authenticate()` - запуск біометричної автентифікації
- Додано обробку помилок та різних типів біометрії (Face ID, Touch ID, Fingerprint)

#### 3. Оновлено AuthProvider (`lib/presentation/providers/auth_provider.dart`)
- Додано поле `biometricEnabled` - чи увімкнена біометрія
- Додано поле `biometricVerified` - чи пройдена біометрія в поточній сесії
- Реалізовано метод `setBiometricEnabled()` - увімкнення/вимкнення біометрії
- Реалізовано метод `setBiometricVerified()` - позначення верифікації
- Реалізовано метод `resetBiometricVerification()` - скидання верифікації
- Додано збереження налаштувань в `SharedPreferences`
- Додано завантаження налаштувань при ініціалізації

#### 4. Створено BiometricAuthScreen (`lib/presentation/screens/auth/biometric_auth_screen.dart`)
- Реалізовано UI з іконкою біометрії та описом
- Додано автоматичний запит автентифікації при відкритті
- Додано обробку успішної автентифікації з callback
- Додано обробку помилок з відображенням повідомлень
- Додано кнопку переходу на логін з паролем
- Додано кнопку повторної спроби
- Вирівняно контент по центру екрану

#### 5. Створено BiometricWrapper (`lib/presentation/widgets/biometric_wrapper.dart`)
- Реалізовано автоматичну перевірку потреби в біометрії при старті додатку
- Додано обробку lifecycle станів (paused/resumed) для повторної біометрії
- Додано логіку запобігання скидання верифікації при системних діалогах
- Інтегровано з `AuthProvider` через `Selector` для оптимізації перебудов
- Додано `BiometricAuthWidget` для відображення біометрії поверх контенту

#### 6. Оновлено ProfileScreen (`lib/presentation/screens/profile/profile_screen.dart`)
- Додано перемикач для увімкнення/вимкнення біометричної автентифікації
- Додано перевірку доступності біометрії на пристрої
- Додано відображення типу біометрії (Face ID/Touch ID/Fingerprint)
- Інтегровано з `BiometricService` для перевірки доступності

#### 7. Оновлено навігацію (`lib/presentation/navigation/app_router.dart`)
- Додано route `/biometric` для `BiometricAuthScreen`
- Додано route `/profile` для `ProfileScreen`
- Оновлено redirect логіку для перевірки біометрії

#### 8. Інтеграція в main.dart
- Обгорнуто `MaterialApp.router` в `BiometricWrapper` для автоматичної біометрії
- Додано `MultiProvider` з `AuthProvider`, `TestProvider`, `StatsProvider`, `ShopProvider`

#### 9. Виправлення та оптимізація
- Виправлено помилку `no_fragment_activity` через зміну `MainActivity.kt`
- Виправлено проблему зі скиданням верифікації при системних діалогах
- Оптимізовано перебудови через `Selector` замість `Provider.of`
- Додано правильне центрування контенту в `BiometricAuthScreen`

### Створення заглушок для майбутніх функцій

#### 1. Створено KnowledgeBaseScreen (`lib/presentation/screens/knowledge/knowledge_base_screen.dart`)
- Створено екран-заглушку для бази знань
- Додано повідомлення про те, що функція в розробці
- Додано навігацію з HomeScreen
- Додано route `/knowledge` в `app_router.dart`

#### 2. Створено AchievementsScreen (`lib/presentation/screens/achievements/achievements_screen.dart`)
- Створено екран-заглушку для ачівок
- Додано повідомлення про те, що функція в розробці
- Додано навігацію з HomeScreen
- Додано route `/achievements` в `app_router.dart`

#### 3. Створено FeedbackScreen (`lib/presentation/screens/feedback/feedback_screen.dart`)
- Створено екран-заглушку для зворотного зв'язку
- Додано повідомлення про те, що функція в розробці
- Додано навігацію з HomeScreen
- Додано route `/feedback` в `app_router.dart`

#### 4. Оновлено HomeScreen
- Додано кнопки для переходу до бази знань, ачівок та зворотного зв'язку
- Організовано швидкі дії в два ряди для кращого відображення
- Оновлено навігацію для кнопки "База знань" (замість SnackBar)

### Планування сторінки винагород (RewardsScreen)

#### 1. Створення моделей даних
- Створено `RewardModel` (`lib/data/models/reward_model.dart`)
  - Поля: id, type (achievement, tournament, special), title, description, icon, rarity, dateEarned, progress
  - Методи: fromJson, typeLabel getter

#### 2. Створено Rewards Repository (`lib/data/repositories/rewards_repository.dart`)
- Реалізовано метод `getUserRewards()` - отримання всіх винагород користувача
- Реалізовано метод `getAchievements()` - отримання ачівок
- Реалізовано метод `getTournamentRewards()` - отримання нагород з турнірів
- Реалізовано метод `getRewardStatistics()` - статистика винагород

#### 3. Створено Rewards Provider (`lib/presentation/providers/rewards_provider.dart`)
- Реалізовано управління станом винагород (rewards, isLoading, errorMessage)
- Реалізовано фільтрацію по типу винагород (selectedType, setSelectedType)
- Реалізовано сортування винагород (sortBy, setSortBy)
- Реалізовано статистику винагород (totalCount, byType, byRarity)

#### 4. Створено RewardsScreen (`lib/presentation/screens/rewards/rewards_screen.dart`)
- Реалізовано grid layout для відображення винагород
- Додано фільтрацію по типах винагород (FilterChips: Всі, Ачівки, Турніри, Спеціальні)
- Додано сортування (за датою, за типом, за рідкістю)
- Додано модальне вікно з детальною інформацією про винагороду
- Реалізовано відображення статистики винагород
- Додано прогрес-бари для наступних винагород
- Додано візуальні індикатори отриманих/неотриманих винагород
- Додано анімацію при отриманні нової винагороди
- Додано можливість поділу винагороди в соціальних мережах
- Додано pull-to-refresh для оновлення даних

#### 5. Оновлено навігацію та інтеграцію
- Додано route `/rewards` для `RewardsScreen` в `app_router.dart`
- Додано кнопку "Винагороди" на `ProfileScreen`
- Інтегровано `RewardsProvider` в `main.dart` через `MultiProvider`

### Планування функціоналу друзів та пошуку користувачів

#### 1. Створення моделей даних
- Створено `FriendModel` (`lib/data/models/friend_model.dart`)
  - Поля: id, user, status, createdAt
  - Методи: fromJson
- Створено `FriendshipModel` (`lib/data/models/friendship_model.dart`)
  - Поля: id, from, to, status (pending/accepted/rejected), createdAt, message
  - Методи: fromJson

#### 2. Створено Friends Repository (`lib/data/repositories/friends_repository.dart`)
- Реалізовано метод `searchUsers()` - пошук користувачів з фільтрацією
- Реалізовано метод `getFriends()` - отримання списку друзів
- Реалізовано метод `getFriendRequests()` - отримання запитів на дружбу
- Реалізовано метод `sendFriendRequest()` - відправка запиту на дружбу
- Реалізовано метод `acceptFriendRequest()` - прийняття запиту
- Реалізовано метод `rejectFriendRequest()` - відхилення запиту
- Реалізовано метод `removeFriend()` - видалення з друзів
- Реалізовано метод `getFriendStatus()` - перевірка статусу дружби

#### 3. Створено Friends Provider (`lib/presentation/providers/friends_provider.dart`)
- Реалізовано управління станом друзів (friends, isLoading, errorMessage)
- Реалізовано управління запитами на дружбу (requests, isLoadingRequests)
- Реалізовано пошук користувачів (searchResults, isSearching)
- Реалізовано методи для роботи з друзями та запитами

#### 4. Створено FriendsScreen (`lib/presentation/screens/friends/friends_screen.dart`)
- Реалізовано список друзів користувача
- Додано відображення кількості друзів
- Додано кнопку пошуку користувачів
- Додано відображення запитів на дружбу (вхідні та вихідні)
- Реалізовано прийняття/відхилення запитів
- Реалізовано видалення з друзів
- Додано перехід до профілю друга
- Додано pull-to-refresh

#### 5. Створено SearchUsersScreen (`lib/presentation/screens/friends/search_users_screen.dart`)
- Реалізовано поле пошуку користувачів
- Додано пошук в реальному часі з debounce
- Реалізовано відображення результатів пошуку
- Додано індикатор статусу дружби (друг, запит відправлено, можна додати)
- Реалізовано кнопку додавання в друзі
- Додано фільтрацію пошуку (місто, посада)
- Додано перехід до профілю користувача (UserProfileScreen)
- Додано обробку помилок пошуку

#### 6. Створено UserProfileScreen (`lib/presentation/screens/profile/user_profile_screen.dart`)
- Реалізовано відображення інформації про користувача (ПІБ, місто, посада, логін)
- Додано відображення балансу монет користувача
- Реалізовано відображення статистики користувача (тести, правильні відповіді, рейтинг)
- Реалізовано grid layout для відображення ачівок користувача
- Додано відображення нагород з турнірів
- Додано відображення спеціальних винагород
- Реалізовано фільтрацію винагород по типу (FilterChips: Всі, Ачівки, Турніри, Спеціальні)
- Додано модальне вікно з детальною інформацією про винагороду
- Реалізовано індикатор статусу дружби (друг, запит відправлено, можна додати)
- Додано кнопку додавання в друзі (якщо не друг)
- Додано кнопку видалення з друзів (якщо друг)
- Реалізовано порівняння результатів з цим користувачем
- Додано графік результатів користувача (якщо дозволено)
- Додано перехід до детальної статистики користувача

#### 7. Оновлено навігацію та інтеграцію
- Додано routes `/friends` та `/search-users` в `app_router.dart`
- Додано кнопку "Друзі" на `ProfileScreen`
- Інтегровано `FriendsProvider` в `main.dart` через `MultiProvider`

#### 7. Створено UserProfileScreen (`lib/presentation/screens/profile/user_profile_screen.dart`)
- Реалізовано відображення інформації про користувача (ПІБ, місто, посада, логін)
- Додано відображення балансу монет користувача
- Реалізовано відображення статистики користувача (тести, правильні відповіді, рейтинг)
- Реалізовано grid layout для відображення ачівок користувача
- Додано відображення нагород з турнірів
- Додано відображення спеціальних винагород
- Реалізовано фільтрацію винагород по типу (FilterChips: Всі, Ачівки, Турніри, Спеціальні)
- Додано модальне вікно з детальною інформацією про винагороду
- Реалізовано індикатор статусу дружби (друг, запит відправлено, можна додати)
- Додано кнопку додавання в друзі (якщо не друг)
- Додано кнопку видалення з друзів (якщо друг)
- Реалізовано порівняння результатів з цим користувачем
- Додано графік результатів користувача (якщо дозволено)
- Додано перехід до детальної статистики користувача

#### 8. Оновлено навігацію для профілів
- Додано route `/user-profile/:userId` для `UserProfileScreen` в `app_router.dart`
- Оновлено `FriendsScreen` та `SearchUsersScreen` для переходу до профілю користувача
- Додано навігацію з детальної інформації про винагороду до профілю користувача

### Реалізація магазину (Shop)

#### 1. Створення моделей даних
- Створено `ShopItemModel` (`lib/data/models/shop_item_model.dart`)
  - Поля: id, name, description, price, type, image, stock, isActive, requiresApproval
  - Методи: fromJson, typeLabel getter
- Створено `PurchaseModel` (`lib/data/models/purchase_model.dart`)
  - Поля: id, user, item, price, status, createdAt, completedAt, rejectionReason
  - Методи: fromJson

#### 2. Створено Shop Repository (`lib/data/repositories/shop_repository.dart`)
- Реалізовано метод `getItems()` - отримання списку товарів з фільтрацією по типу та пошуком
- Реалізовано метод `getItem(String itemId)` - отримання детальної інформації про товар
- Реалізовано метод `purchaseItem(String itemId)` - здійснення покупки товару
- Реалізовано метод `getPurchasesHistory()` - отримання історії покупок користувача
- Додано helper метод `getImageUrl()` для формування URL зображень

#### 3. Створено Shop Provider (`lib/presentation/providers/shop_provider.dart`)
- Реалізовано управління станом товарів (items, isLoadingItems, errorMessage)
- Реалізовано управління історією покупок (purchases, isLoadingPurchases)
- Реалізовано фільтрацію по типу товарів (selectedType, setSelectedType)
- Реалізовано метод `purchaseItem()` з обробкою стану покупки (isPurchasing)
- Додано автоматичне завантаження товарів та історії при ініціалізації

#### 4. Створено ShopScreen (`lib/presentation/screens/shop/shop_screen.dart`)
- Реалізовано grid layout для відображення товарів
- Додано фільтрацію по типах товарів (FilterChips: Всі, Фізичні, Цифрові, Послуги, Бейджі, Інші)
- Додано модальне вікно з детальною інформацією про товар
- Реалізовано відображення зображень товарів (з обробкою помилок та завантаження)
- Додано перевірку достатності монет для покупки
- Реалізовано підтвердження покупки з оновленням балансу користувача
- Додано відображення статусу покупки (pending, approved, rejected, completed)
- Реалізовано перегляд історії покупок з детальною інформацією
- Додано pull-to-refresh для оновлення даних
- Виправлено відображення зображень (BoxFit.contain замість BoxFit.cover для запобігання обрізання)

#### 5. Оновлено навігацію та інтеграцію
- Додано route `/shop` для `ShopScreen` в `app_router.dart`
- Додано кнопку "Магазин" на `HomeScreen` в швидких діях
- Інтегровано `ShopProvider` в `main.dart` через `MultiProvider`
- Додано оновлення балансу користувача після успішної покупки

#### 6. Виправлення UI
- Виправлено обрізання зображень в картках товарів (BoxFit.contain)
- Виправлено обрізання зображень в модальному вікні деталей товара
- Додано центрування та обробку помилок завантаження зображень

### Створення заглушок для майбутніх функцій

#### 1. Створено KnowledgeBaseScreen (`lib/presentation/screens/knowledge/knowledge_base_screen.dart`)
- Створено екран-заглушку для бази знань
- Додано повідомлення про те, що функція в розробці
- Додано навігацію з HomeScreen
- Додано route `/knowledge` в `app_router.dart`

#### 2. Створено AchievementsScreen (`lib/presentation/screens/achievements/achievements_screen.dart`)
- Створено екран-заглушку для ачівок
- Додано повідомлення про те, що функція в розробці
- Додано навігацію з HomeScreen
- Додано route `/achievements` в `app_router.dart`

#### 3. Створено FeedbackScreen (`lib/presentation/screens/feedback/feedback_screen.dart`)
- Створено екран-заглушку для зворотного зв'язку
- Додано повідомлення про те, що функція в розробці
- Додано навігацію з HomeScreen
- Додано route `/feedback` в `app_router.dart`

#### 4. Оновлено HomeScreen
- Додано кнопки для переходу до бази знань, ачівок та зворотного зв'язку
- Організовано швидкі дії в два ряди для кращого відображення
- Оновлено навігацію для кнопки "База знань" (замість SnackBar)

