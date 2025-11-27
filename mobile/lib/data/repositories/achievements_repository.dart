import '../models/achievement_model.dart';
import '../models/user_achievement_model.dart';
import '../services/api_service.dart';

class AchievementsRepository {
  final ApiService _apiService = ApiService();

  /// Завантажує всі доступні ачівки
  Future<AchievementsResult> getAllAchievements() async {
    try {
      final response = await _apiService.get('/achievements');

      if (response.data['success'] == true) {
        final achievementsData = response.data['data'] as List<dynamic>? ?? [];
        final achievements = achievementsData
            .map((item) => AchievementModel.fromJson(item as Map<String, dynamic>))
            .toList();

        return AchievementsResult(
          success: true,
          achievements: achievements,
        );
      } else {
        return AchievementsResult(
          success: false,
          message: response.data['message'] ?? 'Не вдалося завантажити ачівки',
        );
      }
    } catch (e) {
      print('Get all achievements error: $e');
      return AchievementsResult(
        success: false,
        message: 'Помилка при завантаженні ачівок',
      );
    }
  }

  /// Завантажує ачівки користувача з прогресом
  Future<UserAchievementsResult> getUserAchievements(String userId) async {
    try {
      final response = await _apiService.get('/achievements/user/$userId');

      if (response.data['success'] == true) {
        final achievementsData = response.data['data'] as List<dynamic>? ?? [];
        final userAchievements = achievementsData
            .map((item) => UserAchievementModel.fromJson(item as Map<String, dynamic>))
            .toList();

        return UserAchievementsResult(
          success: true,
          userAchievements: userAchievements,
        );
      } else {
        return UserAchievementsResult(
          success: false,
          message: response.data['message'] ?? 'Не вдалося завантажити ачівки користувача',
        );
      }
    } catch (e) {
      print('Get user achievements error: $e');
      return UserAchievementsResult(
        success: false,
        message: 'Помилка при завантаженні ачівок користувача',
      );
    }
  }

  /// Отримує деталі ачівки по ID
  Future<AchievementResult> getAchievement(String achievementId) async {
    try {
      final response = await _apiService.get('/achievements/$achievementId');

      if (response.data['success'] == true) {
        final achievementData = response.data['data'] as Map<String, dynamic>;
        final achievement = AchievementModel.fromJson(achievementData);

        return AchievementResult(
          success: true,
          achievement: achievement,
        );
      } else {
        return AchievementResult(
          success: false,
          message: response.data['message'] ?? 'Ачівку не знайдено',
        );
      }
    } catch (e) {
      print('Get achievement error: $e');
      return AchievementResult(
        success: false,
        message: 'Помилка при завантаженні ачівки',
      );
    }
  }
}

class AchievementsResult {
  final bool success;
  final List<AchievementModel> achievements;
  final String? message;

  AchievementsResult({
    required this.success,
    this.achievements = const [],
    this.message,
  });
}

class UserAchievementsResult {
  final bool success;
  final List<UserAchievementModel> userAchievements;
  final String? message;

  UserAchievementsResult({
    required this.success,
    this.userAchievements = const [],
    this.message,
  });
}

class AchievementResult {
  final bool success;
  final AchievementModel? achievement;
  final String? message;

  AchievementResult({
    required this.success,
    this.achievement,
    this.message,
  });
}

