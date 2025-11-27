import '../models/test_model.dart';
import '../services/api_service.dart';

class TestRepository {
  final ApiService _apiService = ApiService();

  /// Отримує поточний тест користувача
  Future<TestResult> getCurrentTest() async {
    try {
      final response = await _apiService.get('/daily-tests/current');
      
      if (response.data['success'] == true) {
        final testData = response.data['data'];
        if (testData != null && testData is Map<String, dynamic>) {
          final test = TestModel.fromJson(testData);
          return TestResult(
            success: true,
            test: test,
          );
        } else {
          // Тесту немає
          return TestResult(
            success: true,
            test: null,
          );
        }
      } else {
        return TestResult(
          success: false,
          message: response.data['message'] ?? 'Не вдалося завантажити тест',
        );
      }
    } catch (e) {
      print('Get current test error: $e');
      return TestResult(
        success: false,
        message: 'Помилка при завантаженні тесту',
      );
    }
  }

  /// Генерує новий щоденний тест для користувача
  Future<TestResult> generateTest() async {
    try {
      final response = await _apiService.post('/daily-tests/generate');
      
      if (response.data['success'] == true) {
        final testData = response.data['data'];
        if (testData != null && testData is Map<String, dynamic>) {
          final test = TestModel.fromJson(testData);
          return TestResult(
            success: true,
            test: test,
          );
        } else {
          return TestResult(
            success: false,
            message: 'Некоректний формат даних тесту',
          );
        }
      } else {
        return TestResult(
          success: false,
          message: response.data['message'] ?? 'Не вдалося згенерувати тест',
        );
      }
    } catch (e) {
      print('Generate test error: $e');
      return TestResult(
        success: false,
        message: 'Помилка при генерації тесту. Спробуйте ще раз.',
      );
    }
  }

  /// Завантажує тест з результатами
  Future<TestResult> getTest(String testId) async {
    try {
      final response = await _apiService.get('/daily-tests/$testId/results');
      
      if (response.data['success'] == true) {
        final testData = response.data['data'];
        if (testData != null && testData is Map<String, dynamic>) {
          final test = TestModel.fromJson(testData);
          return TestResult(
            success: true,
            test: test,
          );
        } else {
          return TestResult(
            success: false,
            message: 'Некоректний формат даних тесту',
          );
        }
      } else {
        return TestResult(
          success: false,
          message: response.data['message'] ?? 'Не вдалося завантажити тест',
        );
      }
    } catch (e) {
      print('Get test error: $e');
      return TestResult(
        success: false,
        message: 'Помилка при завантаженні тесту. Спробуйте ще раз.',
      );
    }
  }

  /// Відправляє відповідь на питання
  Future<AnswerResult> submitAnswer({
    required String testId,
    required int questionIndex,
    required int answerIndex,
  }) async {
    try {
      print('Submitting answer: testId=$testId, questionIndex=$questionIndex, answerIndex=$answerIndex');
      final response = await _apiService.post(
        '/daily-tests/$testId/answer',
        data: {
          'questionIndex': questionIndex,
          'answerIndex': answerIndex,
        },
      );
      print('Submit answer response: ${response.data}');

      if (response.data['success'] == true) {
        final data = response.data['data'];
        return AnswerResult(
          success: true,
          isCorrect: data['isCorrect'] ?? false,
          coinsEarned: data['coinsEarned'] ?? 0,
          explanation: data['explanation'],
          allAnswered: data['allAnswered'] ?? false,
        );
      } else {
        return AnswerResult(
          success: false,
          message: response.data['message'] ?? 'Помилка при збереженні відповіді',
        );
      }
    } catch (e) {
      print('Submit answer error: $e');
      return AnswerResult(
        success: false,
        message: 'Помилка при збереженні відповіді. Спробуйте ще раз.',
      );
    }
  }

  /// Отримує рейтинг користувачів по посаді
  Future<RatingResult> getRating(String positionId) async {
    try {
      final response = await _apiService.get(
        '/stats/rating',
        queryParameters: {'position': positionId},
      );

      if (response.data['success'] == true) {
        final users = response.data['data'] as List<dynamic>? ?? [];
        return RatingResult(
          success: true,
          users: users,
        );
      } else {
        return RatingResult(
          success: false,
          message: response.data['message'] ?? 'Не вдалося завантажити рейтинг',
        );
      }
    } catch (e) {
      print('Get rating error: $e');
      return RatingResult(
        success: false,
        message: 'Помилка при завантаженні рейтингу',
      );
    }
  }
}

class TestResult {
  final bool success;
  final TestModel? test;
  final String? message;

  TestResult({
    required this.success,
    this.test,
    this.message,
  });
}

class AnswerResult {
  final bool success;
  final bool isCorrect;
  final int coinsEarned;
  final String? explanation;
  final bool allAnswered;
  final String? message;

  AnswerResult({
    required this.success,
    this.isCorrect = false,
    this.coinsEarned = 0,
    this.explanation,
    this.allAnswered = false,
    this.message,
  });
}

class RatingResult {
  final bool success;
  final List<dynamic> users;
  final String? message;

  RatingResult({
    required this.success,
    this.users = const [],
    this.message,
  });
}

