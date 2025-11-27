import 'package:flutter/foundation.dart';
import '../../data/models/shop_item_model.dart';
import '../../data/models/purchase_model.dart';
import '../../data/repositories/shop_repository.dart';

class ShopProvider with ChangeNotifier {
  final ShopRepository _shopRepository = ShopRepository();

  List<ShopItemModel> _items = [];
  List<ShopItemModel> _filteredItems = [];
  List<PurchaseModel> _purchases = [];
  bool _isLoading = false;
  bool _isPurchasing = false;
  String? _errorMessage;
  String _selectedType = 'all';
  String? _searchQuery;

  List<ShopItemModel> get items => _filteredItems;
  List<PurchaseModel> get purchases => _purchases;
  bool get isLoading => _isLoading;
  bool get isPurchasing => _isPurchasing;
  String? get errorMessage => _errorMessage;
  String get selectedType => _selectedType;
  String? get searchQuery => _searchQuery;

  /// Завантажує список товарів
  Future<void> loadItems({String? type, bool? active, String? search}) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final result = await _shopRepository.getItems(
        type: type ?? (_selectedType != 'all' ? _selectedType : null),
        active: active ?? true,
        search: search ?? _searchQuery,
      );

      if (result.success) {
        _items = result.items;
        _filterItems();
      } else {
        _errorMessage = result.message;
      }
    } catch (e) {
      print('Load items error: $e');
      _errorMessage = 'Помилка при завантаженні товарів';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Фільтрує товари за типом та пошуком
  void _filterItems() {
    _filteredItems = _items.where((item) {
      // Фільтр по типу
      if (_selectedType != 'all' && item.type != _selectedType) {
        return false;
      }

      // Фільтр по пошуку
      if (_searchQuery != null && _searchQuery!.isNotEmpty) {
        final query = _searchQuery!.toLowerCase();
        final nameMatch = item.name.toLowerCase().contains(query);
        final descMatch = item.description?.toLowerCase().contains(query) ?? false;
        if (!nameMatch && !descMatch) {
          return false;
        }
      }

      return true;
    }).toList();
  }

  /// Встановлює вибраний тип товарів
  void setSelectedType(String type) {
    _selectedType = type;
    _filterItems();
    notifyListeners();
  }

  /// Встановлює пошуковий запит
  void setSearchQuery(String? query) {
    _searchQuery = query;
    _filterItems();
    notifyListeners();
  }

  /// Купує товар
  Future<ShopPurchaseResult> purchaseItem(String itemId) async {
    try {
      _isPurchasing = true;
      _errorMessage = null;
      notifyListeners();

      final result = await _shopRepository.purchaseItem(itemId);

      if (result.success) {
        // Оновити список товарів
        await loadItems();
      } else {
        _errorMessage = result.message;
      }

      return ShopPurchaseResult(
        success: result.success,
        purchase: result.purchase,
        message: result.message,
      );
    } catch (e) {
      print('Purchase item error: $e');
      return ShopPurchaseResult(
        success: false,
        message: 'Помилка при покупці товару',
      );
    } finally {
      _isPurchasing = false;
      notifyListeners();
    }
  }

  /// Завантажує історію покупок (використовує StatsRepository)
  Future<void> loadPurchases() async {
    // Це буде використовувати StatsRepository.getPurchases()
    // який вже реалізований
    notifyListeners();
  }

  /// Очищує помилки
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}

class ShopPurchaseResult {
  final bool success;
  final PurchaseModel? purchase;
  final String? message;

  ShopPurchaseResult({
    required this.success,
    this.purchase,
    this.message,
  });
}

