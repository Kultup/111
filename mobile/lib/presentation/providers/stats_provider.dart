import 'package:flutter/foundation.dart';
import '../../data/models/stats_model.dart';
import '../../data/repositories/stats_repository.dart';

class StatsProvider with ChangeNotifier {
  final StatsRepository _statsRepository = StatsRepository();

  StatsModel? _stats;
  List<dynamic> _coinHistory = [];
  List<dynamic> _purchases = [];
  bool _isLoading = false;
  String? _errorMessage;

  StatsModel? get stats => _stats;
  List<dynamic> get coinHistory => _coinHistory;
  List<dynamic> get purchases => _purchases;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  /// Завантажує статистику користувача
  Future<bool> loadStats(String userId) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final result = await _statsRepository.getUserStats(userId);

      if (result.success && result.stats != null) {
        _stats = result.stats;
        _isLoading = false;
        _errorMessage = null;
        notifyListeners();
        return true;
      } else {
        _isLoading = false;
        _errorMessage = result.message ?? 'Не вдалося завантажити статистику';
        notifyListeners();
        return false;
      }
    } catch (e) {
      print('Load stats error: $e');
      _isLoading = false;
      _errorMessage = 'Помилка при завантаженні статистики';
      notifyListeners();
      return false;
    }
  }

  /// Завантажує історію монет
  Future<bool> loadCoinHistory({int limit = 50}) async {
    try {
      final result = await _statsRepository.getCoinHistory(limit: limit);

      if (result.success) {
        _coinHistory = result.history;
        notifyListeners();
        return true;
      } else {
        _errorMessage = result.message;
        notifyListeners();
        return false;
      }
    } catch (e) {
      print('Load coin history error: $e');
      _errorMessage = 'Помилка при завантаженні історії монет';
      notifyListeners();
      return false;
    }
  }

  /// Завантажує покупки
  Future<bool> loadPurchases({int limit = 50}) async {
    try {
      final result = await _statsRepository.getPurchases(limit: limit);

      if (result.success) {
        _purchases = result.purchases;
        notifyListeners();
        return true;
      } else {
        _errorMessage = result.message;
        notifyListeners();
        return false;
      }
    } catch (e) {
      print('Load purchases error: $e');
      _errorMessage = 'Помилка при завантаженні покупок';
      notifyListeners();
      return false;
    }
  }

  /// Очищає помилку
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}

