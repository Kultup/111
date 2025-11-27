class TestHistoryModel {
  final String id;
  final DateTime date;
  final int score;
  final int coinsEarned;

  TestHistoryModel({
    required this.id,
    required this.date,
    required this.score,
    required this.coinsEarned,
  });

  factory TestHistoryModel.fromJson(Map<String, dynamic> json) {
    return TestHistoryModel(
      id: json['_id'] ?? json['id'] ?? '',
      date: json['date'] != null
          ? DateTime.parse(json['date'])
          : json['completedAt'] != null
              ? DateTime.parse(json['completedAt'])
              : json['createdAt'] != null
                  ? DateTime.parse(json['createdAt'])
                  : DateTime.now(),
      score: json['score'] ?? 0,
      coinsEarned: json['coinsEarned'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'id': id,
      'date': date.toIso8601String(),
      'score': score,
      'coinsEarned': coinsEarned,
    };
  }
}

