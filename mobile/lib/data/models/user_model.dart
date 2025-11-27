class UserModel {
  final String id;
  final String firstName;
  final String lastName;
  final String login;
  final String? city;
  final String? position; // Назва посади (для відображення)
  final String? positionId; // ID посади (для запитів)
  final int coins;
  final String? role;

  UserModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.login,
    this.city,
    this.position,
    this.positionId,
    this.coins = 0,
    this.role,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    // Обробити city - якщо це об'єкт, взяти name, інакше взяти як є
    String? cityName;
    if (json['city'] != null) {
      if (json['city'] is Map) {
        cityName = json['city']['name'] ?? json['city']['_id'] ?? json['city']['id'];
      } else {
        cityName = json['city'] is String ? json['city'] : json['city'].toString();
      }
    }
    
    // Обробити position - якщо це об'єкт, взяти name для відображення та _id для запитів
    String? positionName;
    String? positionIdValue;
    if (json['position'] != null) {
      if (json['position'] is Map) {
        positionName = json['position']['name'];
        positionIdValue = json['position']['_id']?.toString() ?? json['position']['id']?.toString();
      } else {
        // Якщо це просто рядок, це може бути ID або назва
        final positionStr = json['position'] is String ? json['position'] : json['position'].toString();
        // Перевірити, чи це схоже на ObjectId (24 символи hex)
        if (positionStr.length == 24 && RegExp(r'^[a-fA-F0-9]+$').hasMatch(positionStr)) {
          positionIdValue = positionStr;
        } else {
          positionName = positionStr;
        }
      }
    }
    
    return UserModel(
      id: json['_id'] ?? json['id'] ?? '',
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      login: json['login'] ?? '',
      city: cityName,
      position: positionName,
      positionId: positionIdValue,
      coins: json['coins'] ?? 0,
      role: json['role'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'id': id,
      'firstName': firstName,
      'lastName': lastName,
      'login': login,
      'city': city,
      'position': position,
      'coins': coins,
      'role': role,
    };
  }

  UserModel copyWith({
    String? id,
    String? firstName,
    String? lastName,
    String? login,
    String? city,
    String? position,
    String? positionId,
    int? coins,
    String? role,
  }) {
    return UserModel(
      id: id ?? this.id,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      login: login ?? this.login,
      city: city ?? this.city,
      position: position ?? this.position,
      positionId: positionId ?? this.positionId,
      coins: coins ?? this.coins,
      role: role ?? this.role,
    );
  }
}

