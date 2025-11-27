import 'category_stat_model.dart';
import 'test_history_model.dart';

class StatsModel {
  final int totalTests;
  final int correctAnswers;
  final int totalAnswers;
  final double accuracy;
  final int coins;
  final int rank;
  final List<TestHistoryModel> testHistory;
  final List<CategoryStatModel> categoryStats;

  StatsModel({
    required this.totalTests,
    required this.correctAnswers,
    required this.totalAnswers,
    required this.accuracy,
    required this.coins,
    required this.rank,
    this.testHistory = const [],
    this.categoryStats = const [],
  });

  factory StatsModel.fromJson(Map<String, dynamic> json) {
    final userData = json['userData'] ?? json;
    final statistics = userData['statistics'] ?? {};
    final testHistoryData = json['testHistory'] as List<dynamic>? ?? [];
    final categoryStatsData = statistics['categoryStats'] as List<dynamic>? ?? [];

    // Якщо немає categoryStats, спробувати personalCategoryStats
    final categoryData = categoryStatsData.isEmpty
        ? (userData['personalCategoryStats'] as List<dynamic>? ?? [])
        : categoryStatsData;

    return StatsModel(
      totalTests: json['totalTests'] ?? testHistoryData.length,
      correctAnswers: json['correctAnswers'] ?? 0,
      totalAnswers: json['totalAnswers'] ?? 0,
      accuracy: (json['accuracy'] is num)
          ? (json['accuracy'] as num).toDouble()
          : double.tryParse(json['accuracy']?.toString() ?? '0') ?? 0.0,
      coins: userData['coins'] ?? 0,
      rank: statistics['rank'] ?? 0,
      testHistory: testHistoryData
          .map((item) => TestHistoryModel.fromJson(item as Map<String, dynamic>))
          .toList(),
      categoryStats: categoryData
          .map((item) => CategoryStatModel.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalTests': totalTests,
      'correctAnswers': correctAnswers,
      'totalAnswers': totalAnswers,
      'accuracy': accuracy,
      'coins': coins,
      'rank': rank,
      'testHistory': testHistory.map((item) => item.toJson()).toList(),
      'categoryStats': categoryStats.map((item) => item.toJson()).toList(),
    };
  }
}

