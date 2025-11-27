import 'package:flutter/foundation.dart';
import '../../data/models/achievement_model.dart';
import '../../data/models/user_achievement_model.dart';
import '../../data/repositories/achievements_repository.dart';

class AchievementsProvider with ChangeNotifier {
  final AchievementsRepository _achievementsRepository = AchievementsRepository();

  List<UserAchievementModel> _userAchievements = [];
  List<AchievementModel> _allAchievements = [];
  bool _isLoading = false;
  String? _errorMessage;
  String? _selectedType;
  String? _selectedRarity;

  List<UserAchievementModel> get userAchievements => _userAchievements;
  List<AchievementModel> get allAchievements => _allAchievements;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  String? get selectedType => _selectedType;
  String? get selectedRarity => _selectedRarity;

  /// Фільтровані ачівки користувача
  List<UserAchievementModel> get filteredUserAchievements {
    var filtered = _userAchievements;

    if (_selectedType != null && _selectedType!.isNotEmpty) {
      filtered = filtered.where((ua) => ua.achievement.type == _selectedType).toList();
    }

    if (_selectedRarity != null && _selectedRarity!.isNotEmpty) {
      filtered = filtered.where((ua) => ua.achievement.rarity == _selectedRarity).toList();
    }

    return filtered;
  }

  /// Статистика ачівок
  int get totalAchievements => _userAchievements.length;
  int get earnedAchievements => _userAchievements.where((ua) => ua.isEarned).length;
  double get earnedPercentage => totalAchievements > 0 ? (earnedAchievements / totalAchievements * 100) : 0.0;

  /// Завантажує ачівки користувача
  Future<void> loadUserAchievements(String userId) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final result = await _achievementsRepository.getUserAchievements(userId);

      if (result.success) {
        _userAchievements = result.userAchievements;
      } else {
        _errorMessage = result.message;
      }
    } catch (e) {
      print('Load user achievements error: $e');
      _errorMessage = 'Помилка при завантаженні ачівок';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Завантажує всі доступні ачівки
  Future<void> loadAllAchievements() async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final result = await _achievementsRepository.getAllAchievements();

      if (result.success) {
        _allAchievements = result.achievements;
      } else {
        _errorMessage = result.message;
      }
    } catch (e) {
      print('Load all achievements error: $e');
      _errorMessage = 'Помилка при завантаженні ачівок';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Встановлює фільтр по типу
  void setSelectedType(String? type) {
    _selectedType = type;
    notifyListeners();
  }

  /// Встановлює фільтр по рідкості
  void setSelectedRarity(String? rarity) {
    _selectedRarity = rarity;
    notifyListeners();
  }

  /// Очищує всі фільтри
  void clearFilters() {
    _selectedType = null;
    _selectedRarity = null;
    notifyListeners();
  }

  /// Очищує помилки
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}

