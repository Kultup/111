class AppConfig {
  // API URL - можна змінити в .env файлі
  static const String defaultApiUrl = 'http://192.168.0.189:5000/api';
  
  // Для Android емулятора:
  // static const String defaultApiUrl = 'http://10.0.2.2:5000/api';
  
  // Для iOS емулятора:
  // static const String defaultApiUrl = 'http://localhost:5000/api';
  
  static String get apiUrl {
    // Спробувати отримати з .env, якщо ні - використати default
    // TODO: додати підтримку flutter_dotenv
    return defaultApiUrl;
  }
}

