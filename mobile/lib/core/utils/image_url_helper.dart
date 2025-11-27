import '../../config/app_config.dart';

/// Utility клас для генерації URL зображень
class ImageUrlHelper {
  /// Генерує повний URL для зображення
  /// [imagePath] - відносний шлях до зображення або повний URL
  /// Повертає null якщо imagePath порожній або null
  static String? getImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) return null;
    
    // Якщо вже повний URL (починається з http/https)
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Видаляємо /api з baseUrl, бо imagePath вже містить повний шлях до файлу
    final baseUrl = AppConfig.apiUrl.replaceAll('/api', '');
    
    // Переконуємось, що imagePath починається з /
    final normalizedPath = imagePath.startsWith('/') ? imagePath : '/$imagePath';
    
    return '$baseUrl$normalizedPath';
  }
}

