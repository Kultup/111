import 'test_question_model.dart';

class TestModel {
  final String id;
  final DateTime date;
  final String status; // 'pending' | 'completed'
  final List<TestQuestionModel> questions;
  final int score;
  final int coinsEarned;

  TestModel({
    required this.id,
    required this.date,
    required this.status,
    required this.questions,
    this.score = 0,
    this.coinsEarned = 0,
  });

  factory TestModel.fromJson(Map<String, dynamic> json) {
    return TestModel(
      id: json['_id'] ?? json['id'] ?? '',
      date: json['date'] != null
          ? DateTime.parse(json['date'])
          : DateTime.now(),
      status: json['status'] ?? 'pending',
      questions: (json['questions'] as List<dynamic>?)
              ?.map((q) => TestQuestionModel.fromJson(q as Map<String, dynamic>))
              .toList() ??
          [],
      score: json['score'] ?? 0,
      coinsEarned: json['coinsEarned'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'id': id,
      'date': date.toIso8601String(),
      'status': status,
      'questions': questions.map((q) => q.toJson()).toList(),
      'score': score,
      'coinsEarned': coinsEarned,
    };
  }

  TestModel copyWith({
    String? id,
    DateTime? date,
    String? status,
    List<TestQuestionModel>? questions,
    int? score,
    int? coinsEarned,
  }) {
    return TestModel(
      id: id ?? this.id,
      date: date ?? this.date,
      status: status ?? this.status,
      questions: questions ?? this.questions,
      score: score ?? this.score,
      coinsEarned: coinsEarned ?? this.coinsEarned,
    );
  }
}

