import 'achievement_model.dart';

class UserAchievementModel {
  final String id;
  final String userId;
  final AchievementModel achievement;
  final DateTime? earnedAt;
  final int progress;
  final int target;
  final bool isEarned;

  UserAchievementModel({
    required this.id,
    required this.userId,
    required this.achievement,
    this.earnedAt,
    required this.progress,
    required this.target,
    required this.isEarned,
  });

  factory UserAchievementModel.fromJson(Map<String, dynamic> json) {
    DateTime? earnedAt;
    if (json['earnedAt'] != null) {
      if (json['earnedAt'] is String) {
        earnedAt = DateTime.tryParse(json['earnedAt']);
      } else if (json['earnedAt'] is Map) {
        // Якщо це об'єкт дати з MongoDB
        final dateObj = json['earnedAt'] as Map<String, dynamic>;
        if (dateObj['\$date'] != null) {
          earnedAt = DateTime.fromMillisecondsSinceEpoch(dateObj['\$date']);
        }
      }
    }

    // Обробка achievement - може бути об'єктом або ID
    AchievementModel achievement;
    if (json['achievement'] is Map) {
      achievement = AchievementModel.fromJson(json['achievement'] as Map<String, dynamic>);
    } else {
      // Якщо тільки ID, створити мінімальний об'єкт (це не повинно статися, але на всяк випадок)
      achievement = AchievementModel(
        id: json['achievement']?.toString() ?? '',
        name: '',
        description: '',
        type: 'general',
        rarity: 'common',
      );
    }

    final progress = json['progress'] is num ? (json['progress'] as num).toInt() : 0;
    final target = json['target'] is num ? (json['target'] as num).toInt() : 1;
    final isEarned = json['isEarned'] ?? json['earnedAt'] != null || progress >= target;

    return UserAchievementModel(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['user']?.toString() ?? json['userId'] ?? '',
      achievement: achievement,
      earnedAt: earnedAt,
      progress: progress,
      target: target,
      isEarned: isEarned,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'id': id,
      'user': userId,
      'userId': userId,
      'achievement': achievement.toJson(),
      'earnedAt': earnedAt?.toIso8601String(),
      'progress': progress,
      'target': target,
      'isEarned': isEarned,
    };
  }

  double get progressPercentage {
    if (target == 0) return 0.0;
    return (progress / target * 100).clamp(0.0, 100.0);
  }
}

