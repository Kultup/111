import '../models/shop_item_model.dart';
import '../models/purchase_model.dart';
import '../services/api_service.dart';
import '../../config/app_config.dart';

class ShopRepository {
  final ApiService _apiService = ApiService();

  /// Завантажує список товарів
  Future<ShopItemsResult> getItems({
    String? type,
    bool? active,
    String? search,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (type != null && type != 'all') {
        queryParams['type'] = type;
      }
      if (active != null) {
        queryParams['active'] = active.toString();
      }
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }

      final response = await _apiService.get(
        '/shop/items',
        queryParameters: queryParams,
      );

      if (response.data['success'] == true) {
        final itemsData = response.data['data'] as List<dynamic>? ?? [];
        final items = itemsData
            .map((item) => ShopItemModel.fromJson(item as Map<String, dynamic>))
            .toList();

        return ShopItemsResult(
          success: true,
          items: items,
        );
      } else {
        return ShopItemsResult(
          success: false,
          message: response.data['message'] ?? 'Не вдалося завантажити товари',
        );
      }
    } catch (e) {
      print('Get shop items error: $e');
      return ShopItemsResult(
        success: false,
        message: 'Помилка при завантаженні товарів',
      );
    }
  }

  /// Отримує товар по ID
  Future<ShopItemResult> getItem(String itemId) async {
    try {
      final response = await _apiService.get('/shop/items/$itemId');

      if (response.data['success'] == true) {
        final itemData = response.data['data'] as Map<String, dynamic>;
        final item = ShopItemModel.fromJson(itemData);

        return ShopItemResult(
          success: true,
          item: item,
        );
      } else {
        return ShopItemResult(
          success: false,
          message: response.data['message'] ?? 'Товар не знайдено',
        );
      }
    } catch (e) {
      print('Get shop item error: $e');
      return ShopItemResult(
        success: false,
        message: 'Помилка при завантаженні товару',
      );
    }
  }

  /// Купує товар
  Future<PurchaseResult> purchaseItem(String itemId) async {
    try {
      final response = await _apiService.post(
        '/shop/purchase',
        data: {'itemId': itemId},
      );

      if (response.data['success'] == true) {
        final purchaseData = response.data['data'] as Map<String, dynamic>;
        final purchase = PurchaseModel.fromJson(purchaseData);

        return PurchaseResult(
          success: true,
          purchase: purchase,
          message: response.data['message'],
        );
      } else {
        return PurchaseResult(
          success: false,
          message: response.data['message'] ?? 'Не вдалося купити товар',
        );
      }
    } catch (e) {
      print('Purchase item error: $e');
      String errorMessage = 'Помилка при покупці товару';
      
      if (e.toString().contains('Недостатньо монет')) {
        errorMessage = 'Недостатньо монет для покупки';
      } else if (e.toString().contains('Товар закінчився')) {
        errorMessage = 'Товар закінчився';
      } else if (e.toString().contains('Товар недоступний')) {
        errorMessage = 'Товар недоступний';
      }

      return PurchaseResult(
        success: false,
        message: errorMessage,
      );
    }
  }

  /// Отримує URL зображення товару
  static String? getImageUrl(String? imagePath) {
    if (imagePath == null || imagePath.isEmpty) return null;
    if (imagePath.startsWith('http')) return imagePath;
    // Видаляємо /api з baseUrl, бо imagePath вже містить повний шлях
    final baseUrl = AppConfig.apiUrl.replaceAll('/api', '');
    return '$baseUrl$imagePath';
  }
}

class ShopItemsResult {
  final bool success;
  final List<ShopItemModel> items;
  final String? message;

  ShopItemsResult({
    required this.success,
    this.items = const [],
    this.message,
  });
}

class ShopItemResult {
  final bool success;
  final ShopItemModel? item;
  final String? message;

  ShopItemResult({
    required this.success,
    this.item,
    this.message,
  });
}

class PurchaseResult {
  final bool success;
  final PurchaseModel? purchase;
  final String? message;

  PurchaseResult({
    required this.success,
    this.purchase,
    this.message,
  });
}

