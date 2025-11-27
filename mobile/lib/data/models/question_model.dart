import 'answer_model.dart';

class QuestionModel {
  final String id;
  final String text;
  final String? image;
  final List<AnswerModel> answers;
  final String? explanation;

  QuestionModel({
    required this.id,
    required this.text,
    this.image,
    required this.answers,
    this.explanation,
  });

  factory QuestionModel.fromJson(Map<String, dynamic> json) {
    return QuestionModel(
      id: json['_id'] ?? json['id'] ?? '',
      text: json['text'] ?? '',
      image: json['image'],
      answers: (json['answers'] as List<dynamic>?)
              ?.map((answer) => AnswerModel.fromJson(answer as Map<String, dynamic>))
              .toList() ??
          [],
      explanation: json['explanation'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'id': id,
      'text': text,
      'image': image,
      'answers': answers.map((answer) => answer.toJson()).toList(),
      'explanation': explanation,
    };
  }
}

