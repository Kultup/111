class AchievementModel {
  final String id;
  final String name;
  final String description;
  final String? icon;
  final String type;
  final String rarity;
  final RewardModel? reward;
  final Map<String, dynamic>? conditions;
  final bool isActive;

  AchievementModel({
    required this.id,
    required this.name,
    required this.description,
    this.icon,
    required this.type,
    required this.rarity,
    this.reward,
    this.conditions,
    this.isActive = true,
  });

  factory AchievementModel.fromJson(Map<String, dynamic> json) {
    RewardModel? reward;
    if (json['reward'] != null && json['reward'] is Map) {
      reward = RewardModel.fromJson(json['reward'] as Map<String, dynamic>);
    }

    return AchievementModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      icon: json['icon'],
      type: json['type'] ?? 'general',
      rarity: json['rarity'] ?? 'common',
      reward: reward,
      conditions: json['conditions'] as Map<String, dynamic>?,
      isActive: json['isActive'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'id': id,
      'name': name,
      'description': description,
      'icon': icon,
      'type': type,
      'rarity': rarity,
      'reward': reward?.toJson(),
      'conditions': conditions,
      'isActive': isActive,
    };
  }
}

class RewardModel {
  final int? coins;
  final String? title;
  final String? description;

  RewardModel({
    this.coins,
    this.title,
    this.description,
  });

  factory RewardModel.fromJson(Map<String, dynamic> json) {
    return RewardModel(
      coins: json['coins'] is num ? (json['coins'] as num).toInt() : null,
      title: json['title'],
      description: json['description'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'coins': coins,
      'title': title,
      'description': description,
    };
  }
}

