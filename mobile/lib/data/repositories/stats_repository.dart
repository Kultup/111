import '../models/stats_model.dart';
import '../models/test_history_model.dart';
import '../models/category_stat_model.dart';
import '../services/api_service.dart';

class StatsRepository {
  final ApiService _apiService = ApiService();

  /// Завантажує статистику користувача
  Future<StatsResult> getUserStats(String userId) async {
    try {
      // Завантажити дані користувача
      final userResponse = await _apiService.get('/users/$userId');
      final userData = userResponse.data['data'];

      // Завантажити історію тестів
      List<TestHistoryModel> testHistory = [];
      try {
        final testsResponse = await _apiService.get(
          '/daily-tests/history',
          queryParameters: {'limit': 30},
        );
        if (testsResponse.data['success'] == true) {
          final tests = testsResponse.data['data'] as List<dynamic>? ?? [];
          testHistory = tests
              .where((test) => test['status'] == 'completed')
              .map((test) => TestHistoryModel.fromJson(test as Map<String, dynamic>))
              .toList();
        }
      } catch (e) {
        print('Error loading test history: $e');
      }

      // Підготувати статистику
      final totalTests = testHistory.length;
      final correctAnswers = testHistory.fold<int>(
        0,
        (sum, test) => sum + test.score,
      );
      final totalAnswers = totalTests * 5;
      final accuracy = totalAnswers > 0
          ? (correctAnswers / totalAnswers) * 100
          : 0.0;

      // Завантажити статистику по категоріях
      List<CategoryStatModel> categoryStats = [];
      final statistics = userData['statistics'] ?? {};
      final categoryStatsData = statistics['categoryStats'] as List<dynamic>? ?? [];

      if (categoryStatsData.isNotEmpty) {
        categoryStats = categoryStatsData
            .map((stat) => CategoryStatModel.fromJson(stat as Map<String, dynamic>))
            .toList();
      } else if (userData['personalCategoryStats'] != null) {
        final personalStats = userData['personalCategoryStats'] as List<dynamic>? ?? [];
        categoryStats = personalStats.map((stat) {
          final statMap = stat as Map<String, dynamic>;
          final correct = statMap['correct'] ?? 0;
          final total = statMap['total'] ?? 0;
          final accuracy = total > 0 ? (correct / total) * 100 : 0.0;
          return CategoryStatModel(
            name: statMap['categoryName'] ?? statMap['category'] ?? 'Інше',
            correct: correct,
            total: total,
            accuracy: accuracy,
          );
        }).toList();
      }

      final stats = StatsModel(
        totalTests: totalTests,
        correctAnswers: correctAnswers,
        totalAnswers: totalAnswers,
        accuracy: accuracy,
        coins: userData['coins'] ?? 0,
        rank: statistics['rank'] ?? 0,
        testHistory: testHistory,
        categoryStats: categoryStats,
      );

      return StatsResult(
        success: true,
        stats: stats,
      );
    } catch (e) {
      print('Get user stats error: $e');
      return StatsResult(
        success: false,
        message: 'Помилка при завантаженні статистики',
      );
    }
  }

  /// Завантажує історію монет
  Future<CoinHistoryResult> getCoinHistory({int limit = 50}) async {
    try {
      final response = await _apiService.get(
        '/coins/history',
        queryParameters: {'limit': limit},
      );

      if (response.data['success'] == true) {
        final history = response.data['data'] as List<dynamic>? ?? [];
        return CoinHistoryResult(
          success: true,
          history: history,
        );
      } else {
        return CoinHistoryResult(
          success: false,
          message: response.data['message'] ?? 'Не вдалося завантажити історію монет',
        );
      }
    } catch (e) {
      print('Get coin history error: $e');
      return CoinHistoryResult(
        success: false,
        message: 'Помилка при завантаженні історії монет',
      );
    }
  }

  /// Завантажує історію покупок
  Future<PurchasesResult> getPurchases({int limit = 50}) async {
    try {
      final response = await _apiService.get(
        '/shop/purchases',
        queryParameters: {'limit': limit},
      );

      if (response.data['success'] == true) {
        final purchases = response.data['data'] as List<dynamic>? ?? [];
        return PurchasesResult(
          success: true,
          purchases: purchases,
        );
      } else {
        return PurchasesResult(
          success: false,
          message: response.data['message'] ?? 'Не вдалося завантажити покупки',
        );
      }
    } catch (e) {
      print('Get purchases error: $e');
      return PurchasesResult(
        success: false,
        message: 'Помилка при завантаженні покупок',
      );
    }
  }
}

class StatsResult {
  final bool success;
  final StatsModel? stats;
  final String? message;

  StatsResult({
    required this.success,
    this.stats,
    this.message,
  });
}

class CoinHistoryResult {
  final bool success;
  final List<dynamic> history;
  final String? message;

  CoinHistoryResult({
    required this.success,
    this.history = const [],
    this.message,
  });
}

class PurchasesResult {
  final bool success;
  final List<dynamic> purchases;
  final String? message;

  PurchasesResult({
    required this.success,
    this.purchases = const [],
    this.message,
  });
}

