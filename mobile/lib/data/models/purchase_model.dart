class PurchaseModel {
  final String id;
  final String userId;
  final String itemId;
  final String itemName;
  final String? itemImage;
  final int price;
  final String status; // 'pending', 'approved', 'rejected', 'completed'
  final DateTime createdAt;
  final DateTime? completedAt;
  final DateTime? rejectedAt;
  final String? rejectionReason;

  PurchaseModel({
    required this.id,
    required this.userId,
    required this.itemId,
    required this.itemName,
    this.itemImage,
    required this.price,
    required this.status,
    required this.createdAt,
    this.completedAt,
    this.rejectedAt,
    this.rejectionReason,
  });

  factory PurchaseModel.fromJson(Map<String, dynamic> json) {
    // Обробка item як об'єкта або ID
    String itemName = '';
    String? itemImage;
    String itemId = '';

    if (json['item'] != null) {
      if (json['item'] is Map) {
        final itemData = json['item'] as Map<String, dynamic>;
        itemName = itemData['name'] ?? '';
        itemImage = itemData['image'];
        itemId = itemData['_id'] ?? itemData['id'] ?? '';
      } else {
        itemId = json['item'].toString();
      }
    }

    return PurchaseModel(
      id: json['_id'] ?? json['id'] ?? '',
      userId: json['user'] is Map
          ? (json['user'] as Map<String, dynamic>)['_id'] ?? ''
          : json['user']?.toString() ?? '',
      itemId: itemId,
      itemName: itemName.isNotEmpty ? itemName : (json['itemName'] ?? ''),
      itemImage: itemImage ?? json['itemImage'],
      price: (json['price'] ?? 0).toInt(),
      status: json['status'] ?? 'pending',
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      completedAt: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'])
          : null,
      rejectedAt: json['rejectedAt'] != null
          ? DateTime.parse(json['rejectedAt'])
          : null,
      rejectionReason: json['rejectionReason'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'user': userId,
      'item': itemId,
      'itemName': itemName,
      'itemImage': itemImage,
      'price': price,
      'status': status,
      'createdAt': createdAt.toIso8601String(),
      'completedAt': completedAt?.toIso8601String(),
      'rejectedAt': rejectedAt?.toIso8601String(),
      'rejectionReason': rejectionReason,
    };
  }

  String get statusLabel {
    switch (status) {
      case 'pending':
        return 'Очікує підтвердження';
      case 'approved':
        return 'Підтверджено';
      case 'rejected':
        return 'Відхилено';
      case 'completed':
        return 'Завершено';
      default:
        return status;
    }
  }

  bool get isPending => status == 'pending';
  bool get isApproved => status == 'approved';
  bool get isRejected => status == 'rejected';
  bool get isCompleted => status == 'completed';
}

