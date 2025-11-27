import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../providers/test_provider.dart';
import '../../providers/auth_provider.dart';
import '../../../data/repositories/test_repository.dart';

class TestResultsScreen extends StatefulWidget {
  final String testId;

  const TestResultsScreen({
    super.key,
    required this.testId,
  });

  @override
  State<TestResultsScreen> createState() => _TestResultsScreenState();
}

class _TestResultsScreenState extends State<TestResultsScreen> {
  final TestRepository _testRepository = TestRepository();
  List<dynamic>? _ratingUsers;
  int? _userRatingPosition;

  @override
  void initState() {
    super.initState();
    // Викликаємо після побудови віджета, щоб уникнути помилки setState під час build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadTest();
      _loadRating();
    });
  }

  Future<void> _loadTest() async {
    final testProvider = Provider.of<TestProvider>(context, listen: false);
    await testProvider.loadTest(widget.testId);
  }

  Future<void> _loadRating() async {
    final testProvider = Provider.of<TestProvider>(context, listen: false);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final test = testProvider.currentTest;
    final user = authProvider.user;

    if (test?.status == 'completed' && user?.position != null) {
      try {
        // Отримати positionId (може бути об'єктом або рядком)
        String? positionId;
        
        // Якщо position - це Map (об'єкт з _id та name)
        if (user!.position is Map) {
          positionId = (user.position as Map<String, dynamic>)['_id'];
        } 
        // Якщо position - це String і це валідний ObjectId (24 hex символи)
        else if (user.position is String) {
          final posStr = user.position as String;
          // Перевіряємо чи це ObjectId (24 hex символи)
          if (RegExp(r'^[0-9a-fA-F]{24}$').hasMatch(posStr)) {
            positionId = posStr;
          }
          // Інакше це назва посади, не ObjectId - пропускаємо запит
          else {
            print('Position is a name, not ObjectId: $posStr. Skipping rating request.');
            return;
          }
        }

        if (positionId != null) {
          final ratingResult = await _testRepository.getRating(positionId);
          if (ratingResult.success) {
            final userIndex = ratingResult.users.indexWhere(
              (u) => (u['_id'] ?? u['id']) == user.id,
            );
            if (userIndex != -1) {
              setState(() {
                _ratingUsers = ratingResult.users;
                _userRatingPosition = userIndex + 1;
              });
            }
          }
        }
      } catch (e) {
        print('Error loading rating: $e');
      }
    }
  }

  Color _getScoreColor(int score) {
    if (score >= 4) return Colors.green;
    if (score >= 3) return Colors.orange;
    return Colors.red;
  }

  String _getScoreLabel(int score) {
    if (score == 5) return 'Відмінно!';
    if (score == 4) return 'Добре!';
    if (score == 3) return 'Задовільно';
    return 'Потрібно покращити';
  }

  String _formatDate(DateTime? date) {
    if (date == null) return '';
    return DateFormat('EEEE, d MMMM, yyyy, HH:mm', 'uk_UA').format(date);
  }

  @override
  Widget build(BuildContext context) {
    final testProvider = Provider.of<TestProvider>(context);
    final test = testProvider.currentTest;

    if (testProvider.isLoading || test == null) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const CircularProgressIndicator(),
              const SizedBox(height: 16),
              Text(
                'Завантаження результатів...',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
      );
    }

    final score = test.score;
    final percentage = (score / 5) * 100;
    final correctAnswers = test.questions.where((q) => q.isCorrect == true).length;
    final scoreColor = _getScoreColor(score);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Результати тесту'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Заголовок з датою
              Text(
                _formatDate(test.date),
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 24),
              // Основний результат
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      // Круговий індикатор
                      Container(
                        width: 120,
                        height: 120,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: scoreColor,
                            width: 4,
                          ),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              '$score/5',
                              style: TextStyle(
                                fontSize: 36,
                                fontWeight: FontWeight.bold,
                                color: scoreColor,
                              ),
                            ),
                            Text(
                              '${percentage.toInt()}%',
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _getScoreLabel(score),
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: scoreColor,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Правильних відповідей: $correctAnswers з 5',
                        style: const TextStyle(fontSize: 16),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              // Статистика
              Row(
                children: [
                  if (test.coinsEarned > 0)
                    Expanded(
                      child: Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            children: [
                              const Text(
                                'Монети',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '+${test.coinsEarned} 🪙',
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  if (_userRatingPosition != null && _ratingUsers != null) ...[
                    const SizedBox(width: 8),
                    Expanded(
                      child: Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            children: [
                              const Text(
                                'Позиція в рейтингу',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '$_userRatingPosition з ${_ratingUsers!.length}',
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 24),
              // Детальна інформація
              const Text(
                'Детальна інформація',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              ...test.questions.asMap().entries.map((entry) {
                final index = entry.key;
                final testQuestion = entry.value;
                final question = testQuestion.question;
                final isCorrect = testQuestion.isCorrect ?? false;
                final userAnswerIndex = testQuestion.userAnswer;
                final correctAnswerIndex = question.answers.indexWhere((a) => a.isCorrect);

                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: BorderSide(
                      color: isCorrect ? Colors.green : Colors.red,
                      width: 2,
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Заголовок питання
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Питання ${index + 1}',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: Colors.grey,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: isCorrect
                                    ? Colors.green.withOpacity(0.2)
                                    : Colors.red.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                isCorrect ? '✓ Правильно' : '✗ Неправильно',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: isCorrect ? Colors.green[700] : Colors.red[700],
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        // Текст питання
                        Text(
                          question.text,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        // Зображення (якщо є)
                        if (question.image != null) ...[
                          const SizedBox(height: 12),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              question.image!,
                              width: double.infinity,
                              height: 200,
                              fit: BoxFit.contain,
                            ),
                          ),
                        ],
                        const SizedBox(height: 12),
                        // Варіанти відповідей
                        ...question.answers.asMap().entries.map((answerEntry) {
                          final answerIndex = answerEntry.key;
                          final answer = answerEntry.value;
                          final isUserAnswer = answerIndex == userAnswerIndex;
                          final isCorrectAnswer = answerIndex == correctAnswerIndex;

                          return Container(
                            margin: const EdgeInsets.only(bottom: 8),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: isUserAnswer && !isCorrect
                                  ? Colors.red.withOpacity(0.1)
                                  : isCorrectAnswer
                                      ? Colors.green.withOpacity(0.1)
                                      : Colors.grey[100],
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isUserAnswer && !isCorrect
                                    ? Colors.red
                                    : isCorrectAnswer
                                        ? Colors.green
                                        : Colors.transparent,
                                width: 2,
                              ),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    answer.text,
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: isUserAnswer || isCorrectAnswer
                                          ? FontWeight.w600
                                          : FontWeight.normal,
                                      color: isUserAnswer && !isCorrect
                                          ? Colors.red[700]
                                          : isCorrectAnswer
                                              ? Colors.green[700]
                                              : null,
                                    ),
                                  ),
                                ),
                                if (isUserAnswer)
                                  const Padding(
                                    padding: EdgeInsets.only(left: 8),
                                    child: Text(
                                      'Ваша відповідь',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                if (isCorrectAnswer && !isUserAnswer)
                                  const Padding(
                                    padding: EdgeInsets.only(left: 8),
                                    child: Text(
                                      'Правильна відповідь',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.green,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          );
                        }),
                        // Пояснення (якщо неправильно)
                        if (!isCorrect && question.explanation != null) ...[
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.orange.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Пояснення:',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.grey,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  question.explanation!,
                                  style: const TextStyle(fontSize: 14),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              }),
              const SizedBox(height: 24),
              // Кнопки дій
              ElevatedButton(
                onPressed: () => context.go('/'),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 48),
                ),
                child: const Text('На головну'),
              ),
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: () {
                  context.push('/stats');
                },
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 48),
                ),
                child: const Text('Переглянути статистику'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

