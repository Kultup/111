import '../../config/app_config.dart';

class KnowledgeArticleModel {
  final String id;
  final String title;
  final String content;
  final String? categoryId;
  final String? categoryName;
  final String? image;
  final List<String> tags;
  final int views;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<String> positions; // ID посад, до яких прив'язана стаття

  KnowledgeArticleModel({
    required this.id,
    required this.title,
    required this.content,
    this.categoryId,
    this.categoryName,
    this.image,
    this.tags = const [],
    this.views = 0,
    required this.createdAt,
    required this.updatedAt,
    this.positions = const [],
  });

  factory KnowledgeArticleModel.fromJson(Map<String, dynamic> json) {
    // Обробити category - може бути об'єкт або ID
    String? categoryId;
    String? categoryName;
    if (json['category'] != null) {
      if (json['category'] is Map) {
        categoryId = json['category']['_id'] ?? json['category']['id'];
        categoryName = json['category']['name'];
      } else {
        categoryId = json['category']?.toString();
      }
    }

    // Обробити positions - може бути масив об'єктів або ID
    List<String> positionsList = [];
    if (json['positions'] != null) {
      final positionsData = json['positions'];
      if (positionsData is List) {
        positionsList = positionsData.map<String>((pos) {
          if (pos is Map) {
            return (pos['_id'] ?? pos['id'] ?? pos.toString()) as String;
          }
          return pos.toString();
        }).toList();
      }
    }

    return KnowledgeArticleModel(
      id: json['_id'] ?? json['id'] ?? '',
      title: json['title'] ?? '',
      content: json['content'] ?? '',
      categoryId: categoryId,
      categoryName: categoryName,
      image: json['image'],
      tags: (json['tags'] as List<dynamic>?)
              ?.map((tag) => tag.toString())
              .toList() ??
          [],
      views: (json['views'] ?? 0).toInt(),
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : DateTime.now(),
      positions: positionsList,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'id': id,
      'title': title,
      'content': content,
      'category': categoryId,
      'image': image,
      'tags': tags,
      'views': views,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'positions': positions,
    };
  }

  KnowledgeArticleModel copyWith({
    String? id,
    String? title,
    String? content,
    String? categoryId,
    String? categoryName,
    String? image,
    List<String>? tags,
    int? views,
    DateTime? createdAt,
    DateTime? updatedAt,
    List<String>? positions,
  }) {
    return KnowledgeArticleModel(
      id: id ?? this.id,
      title: title ?? this.title,
      content: content ?? this.content,
      categoryId: categoryId ?? this.categoryId,
      categoryName: categoryName ?? this.categoryName,
      image: image ?? this.image,
      tags: tags ?? this.tags,
      views: views ?? this.views,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      positions: positions ?? this.positions,
    );
  }

  bool get isAttachedToPosition => positions.isNotEmpty;

  bool isAccessibleForPosition(String? userPositionId) {
    // Якщо стаття не прив'язана до посад - доступна всім
    if (positions.isEmpty) return true;
    // Якщо прив'язана - перевіряємо чи є посада користувача в списку
    if (userPositionId == null) return false;
    return positions.contains(userPositionId);
  }
}

