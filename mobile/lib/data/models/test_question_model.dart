import 'question_model.dart';

class TestQuestionModel {
  final QuestionModel question;
  final int? userAnswer; // індекс відповіді користувача
  final bool? isCorrect; // чи правильна відповідь

  TestQuestionModel({
    required this.question,
    this.userAnswer,
    this.isCorrect,
  });

  factory TestQuestionModel.fromJson(Map<String, dynamic> json) {
    return TestQuestionModel(
      question: QuestionModel.fromJson(
        json['question'] as Map<String, dynamic>,
      ),
      userAnswer: json['userAnswer'],
      isCorrect: json['isCorrect'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'question': question.toJson(),
      'userAnswer': userAnswer,
      'isCorrect': isCorrect,
    };
  }
}

