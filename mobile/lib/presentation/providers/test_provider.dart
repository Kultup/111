import 'package:flutter/foundation.dart';
import '../../data/models/test_model.dart';
import '../../data/repositories/test_repository.dart';

class TestProvider with ChangeNotifier {
  final TestRepository _testRepository = TestRepository();

  TestModel? _currentTest;
  bool _isLoading = false;
  String? _errorMessage;

  TestModel? get currentTest => _currentTest;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  /// Завантажує поточний тест
  Future<bool> loadCurrentTest() async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final result = await _testRepository.getCurrentTest();

      if (result.success) {
        _currentTest = result.test;
        _isLoading = false;
        _errorMessage = null;
        notifyListeners();
        return true;
      } else {
        _isLoading = false;
        _errorMessage = result.message;
        notifyListeners();
        return false;
      }
    } catch (e) {
      print('Load current test error: $e');
      _isLoading = false;
      _errorMessage = 'Помилка при завантаженні тесту';
      notifyListeners();
      return false;
    }
  }

  /// Генерує новий тест
  Future<bool> generateTest() async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final result = await _testRepository.generateTest();

      if (result.success && result.test != null) {
        _currentTest = result.test;
        _isLoading = false;
        _errorMessage = null;
        notifyListeners();
        return true;
      } else {
        _isLoading = false;
        _errorMessage = result.message ?? 'Не вдалося згенерувати тест';
        notifyListeners();
        return false;
      }
    } catch (e) {
      print('Generate test error: $e');
      _isLoading = false;
      _errorMessage = 'Помилка при генерації тесту';
      notifyListeners();
      return false;
    }
  }

  /// Завантажує тест
  Future<bool> loadTest(String testId) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final result = await _testRepository.getTest(testId);

      if (result.success && result.test != null) {
        _currentTest = result.test;
        _isLoading = false;
        _errorMessage = null;
        notifyListeners();
        return true;
      } else {
        _isLoading = false;
        _errorMessage = result.message ?? 'Не вдалося завантажити тест';
        notifyListeners();
        return false;
      }
    } catch (e) {
      print('Load test error: $e');
      _isLoading = false;
      _errorMessage = 'Помилка при завантаженні тесту';
      notifyListeners();
      return false;
    }
  }

  /// Відправляє відповідь
  Future<AnswerResult?> submitAnswer({
    required String testId,
    required int questionIndex,
    required int answerIndex,
  }) async {
    try {
      final result = await _testRepository.submitAnswer(
        testId: testId,
        questionIndex: questionIndex,
        answerIndex: answerIndex,
      );

      if (result.success) {
        // Оновити тест після відповіді
        await loadTest(testId);
        return result;
      } else {
        _errorMessage = result.message;
        notifyListeners();
        return null;
      }
    } catch (e) {
      print('Submit answer error: $e');
      _errorMessage = 'Помилка при збереженні відповіді';
      notifyListeners();
      return null;
    }
  }

  /// Очищає поточний тест
  void clearTest() {
    _currentTest = null;
    _errorMessage = null;
    notifyListeners();
  }

  /// Очищає помилку
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}

