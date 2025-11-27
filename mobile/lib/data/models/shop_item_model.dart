class ShopItemModel {
  final String id;
  final String name;
  final String? description;
  final int price;
  final String type; // 'physical', 'digital', 'service', 'badge', 'other'
  final String? image;
  final int stock; // -1 означає необмежена кількість
  final bool isActive;
  final bool requiresApproval;
  final DateTime createdAt;
  final DateTime updatedAt;

  ShopItemModel({
    required this.id,
    required this.name,
    this.description,
    required this.price,
    required this.type,
    this.image,
    required this.stock,
    required this.isActive,
    required this.requiresApproval,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ShopItemModel.fromJson(Map<String, dynamic> json) {
    return ShopItemModel(
      id: json['_id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      price: (json['price'] ?? 0).toInt(),
      type: json['type'] ?? 'other',
      image: json['image'],
      stock: (json['stock'] ?? -1).toInt(),
      isActive: json['isActive'] ?? true,
      requiresApproval: json['requiresApproval'] ?? true,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'description': description,
      'price': price,
      'type': type,
      'image': image,
      'stock': stock,
      'isActive': isActive,
      'requiresApproval': requiresApproval,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  bool get isInStock => stock == -1 || stock > 0;

  String get typeLabel {
    switch (type) {
      case 'physical':
        return 'Фізичний';
      case 'digital':
        return 'Цифровий';
      case 'service':
        return 'Послуга';
      case 'badge':
        return 'Бейдж';
      case 'other':
      default:
        return 'Інше';
    }
  }
}

