class CategoryStatModel {
  final String name;
  final int correct;
  final int total;
  final double accuracy;

  CategoryStatModel({
    required this.name,
    required this.correct,
    required this.total,
    required this.accuracy,
  });

  factory CategoryStatModel.fromJson(Map<String, dynamic> json) {
    return CategoryStatModel(
      name: json['name'] ?? json['categoryName'] ?? json['category'] ?? 'Інше',
      correct: json['correct'] ?? json['correctAnswers'] ?? 0,
      total: json['total'] ?? json['totalQuestions'] ?? 0,
      accuracy: (json['accuracy'] is num)
          ? (json['accuracy'] as num).toDouble()
          : double.tryParse(json['accuracy']?.toString() ?? '0') ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'correct': correct,
      'total': total,
      'accuracy': accuracy,
    };
  }
}

