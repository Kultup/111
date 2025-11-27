import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'dart:async';
import '../../providers/test_provider.dart';
import '../../../data/repositories/test_repository.dart' show AnswerResult;

class TestScreen extends StatefulWidget {
  final String testId;

  const TestScreen({
    super.key,
    required this.testId,
  });

  @override
  State<TestScreen> createState() => _TestScreenState();
}

class _TestScreenState extends State<TestScreen>
    with TickerProviderStateMixin {
  int _currentQuestionIndex = 0;
  int? _selectedAnswer;
  bool _showResult = false;
  AnswerResult? _resultData;
  DateTime? _deadline;
  String? _timeRemaining;
  Timer? _timer;
  bool _imageZoomVisible = false;
  String? _zoomedImageUri;
  late AnimationController _fadeController;
  late AnimationController _slideController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _slideController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _fadeAnimation = Tween<double>(begin: 1.0, end: 0.5).animate(
      CurvedAnimation(parent: _fadeController, curve: Curves.easeInOut),
    );
    _slideAnimation = Tween<Offset>(
      begin: Offset.zero,
      end: const Offset(-1.0, 0),
    ).animate(CurvedAnimation(parent: _slideController, curve: Curves.easeInOut));

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadTest();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _fadeController.dispose();
    _slideController.dispose();
    super.dispose();
  }

  void _moveToNextQuestion() {
    final testProvider = Provider.of<TestProvider>(context, listen: false);
    final test = testProvider.currentTest;

    if (test == null) return;

    // Перевіряємо, чи це останнє питання
    final isLastQuestion = _currentQuestionIndex >= test.questions.length - 1;

    if (isLastQuestion) {
      // Тест завершено - перехід на екран результатів
      if (mounted) {
        context.pushReplacement('/test-results/${widget.testId}');
      }
    } else {
      // Перехід до наступного питання
      setState(() {
        _currentQuestionIndex++;
        _selectedAnswer = null;
        _showResult = false;
        _resultData = null;
      });
    }
  }

  Future<void> _loadTest() async {
    final testProvider = Provider.of<TestProvider>(context, listen: false);

    final success = await testProvider.loadTest(widget.testId);
    if (success && testProvider.currentTest != null) {
      final test = testProvider.currentTest!;

      // Знайти перше питання без відповіді (якщо є)
      if (test.status != 'completed') {
        for (int i = 0; i < test.questions.length; i++) {
          if (test.questions[i].userAnswer == null) {
            setState(() {
              _currentQuestionIndex = i;
            });
            break;
          }
        }
      }

      // Встановити дедлайн (23:59:59 дня тесту)
      if (test.date != null) {
        final testDate = test.date;
        // Дедлайн - кінець дня тесту (23:59:59)
        final deadlineDate = DateTime(
          testDate.year,
          testDate.month,
          testDate.day,
          23,
          59,
          59,
        );
        
        // Перевірити, чи не прострочений вже тест
        final now = DateTime.now();
        if (now.isBefore(deadlineDate)) {
          setState(() {
            _deadline = deadlineDate;
          });
          _startTimer();
        } else {
          // Тест прострочений - не показувати таймер
          // Користувач все ще може завершити тест якщо він в процесі
          print('Test is expired, deadline was: $deadlineDate, now: $now');
        }
      }
    }
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_deadline == null) {
        timer.cancel();
        return;
      }

      final now = DateTime.now();
      final remaining = _deadline!.difference(now);

      if (remaining.isNegative) {
        setState(() {
          _timeRemaining = null;
        });
        timer.cancel();

        if (mounted) {
          showDialog(
            context: context,
            barrierDismissible: false,
            builder: (context) => AlertDialog(
              title: const Text('Час вийшов'),
              content: const Text('Час на проходження тесту вийшов'),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    context.pop();
                  },
                  child: const Text('OK'),
                ),
              ],
            ),
          );
        }
      } else {
        final hours = remaining.inHours;
        final minutes = remaining.inMinutes % 60;
        final seconds = remaining.inSeconds % 60;
        setState(() {
          _timeRemaining =
              '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
        });
      }
    });
  }

  Future<void> _handleAnswer(int answerIndex) async {
    final testProvider = Provider.of<TestProvider>(context, listen: false);
    final test = testProvider.currentTest;

    if (test == null || _selectedAnswer != null) return;

    setState(() {
      _selectedAnswer = answerIndex;
    });

    final result = await testProvider.submitAnswer(
      testId: widget.testId,
      questionIndex: _currentQuestionIndex,
      answerIndex: answerIndex,
    );

    if (result != null && result.success) {
      setState(() {
        _resultData = result;
        _showResult = true;
      });

      // Анімація показу результату
      _fadeController.forward().then((_) {
        _fadeController.reverse();
      });

      // Перехід до наступного питання через 3 секунди
      Future.delayed(const Duration(seconds: 3), () {
        if (!mounted) return;
        _moveToNextQuestion();
      });
    } else {
      setState(() {
        _selectedAnswer = null;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result?.message ?? 'Помилка при збереженні відповіді'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _handleImagePress(String imageUri) {
    setState(() {
      _zoomedImageUri = imageUri;
      _imageZoomVisible = true;
    });
  }

  Future<bool> _handleBackPress() async {
    final shouldPop = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Вийти з тесту?'),
        content: const Text('Ви впевнені, що хочете вийти? Прогрес не буде збережено.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Скасувати'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Вийти'),
          ),
        ],
      ),
    );
    return shouldPop ?? false;
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
                'Завантаження тесту...',
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

    if (_currentQuestionIndex >= test.questions.length) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Питання не знайдено'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => context.pop(),
                child: const Text('Назад'),
              ),
            ],
          ),
        ),
      );
    }

    final currentQuestion = test.questions[_currentQuestionIndex].question;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final shouldPop = await _handleBackPress();
        if (shouldPop && mounted) {
          context.pop();
        }
      },
      child: Stack(
        children: [
          Scaffold(
            body: SafeArea(
              child: Column(
                children: [
                  // Заголовок з прогресом та таймером
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Theme.of(context).scaffoldBackgroundColor,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        // Прогрес-бар
                        Row(
                          children: [
                            Expanded(
                              child: LinearProgressIndicator(
                                value: (_currentQuestionIndex + 1) / test.questions.length,
                                backgroundColor: Colors.grey[300],
                                minHeight: 10,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Text(
                              '${_currentQuestionIndex + 1} / ${test.questions.length}',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        // Таймер
                        if (_timeRemaining != null) ...[
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.orange.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Text('⏰'),
                                const SizedBox(width: 8),
                                Text(
                                  _timeRemaining!,
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'monospace',
                                    color: Colors.orange,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  // Контент
                  Expanded(
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 300),
                      transitionBuilder: (Widget child, Animation<double> animation) {
                        return SlideTransition(
                          position: Tween<Offset>(
                            begin: const Offset(1.0, 0.0),
                            end: Offset.zero,
                          ).animate(animation),
                          child: FadeTransition(
                            opacity: animation,
                            child: child,
                          ),
                        );
                      },
                      child: SingleChildScrollView(
                        key: ValueKey<int>(_currentQuestionIndex),
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Текст питання
                            Text(
                              currentQuestion.text,
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 24),
                            // Зображення (якщо є)
                            if (currentQuestion.image != null)
                              GestureDetector(
                                onTap: () => _handleImagePress(currentQuestion.image!),
                                child: Container(
                                  margin: const EdgeInsets.only(bottom: 24),
                                  decoration: BoxDecoration(
                                    borderRadius: BorderRadius.circular(12),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.1),
                                        blurRadius: 4,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: Stack(
                                    children: [
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(12),
                                        child: Image.network(
                                          currentQuestion.image!,
                                          width: double.infinity,
                                          height: 250,
                                          fit: BoxFit.contain,
                                          loadingBuilder: (context, child, loadingProgress) {
                                            if (loadingProgress == null) return child;
                                            return Container(
                                              height: 250,
                                              color: Colors.grey[200],
                                              child: Center(
                                                child: CircularProgressIndicator(
                                                  value: loadingProgress.expectedTotalBytes != null
                                                      ? loadingProgress.cumulativeBytesLoaded /
                                                          loadingProgress.expectedTotalBytes!
                                                      : null,
                                                ),
                                              ),
                                            );
                                          },
                                          errorBuilder: (context, error, stackTrace) {
                                            return Container(
                                              height: 250,
                                              color: Colors.grey[200],
                                              child: const Center(
                                                child: Icon(Icons.error, size: 48),
                                              ),
                                            );
                                          },
                                        ),
                                      ),
                                      Positioned(
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        child: Container(
                                          padding: const EdgeInsets.all(8),
                                          decoration: BoxDecoration(
                                            color: Colors.black.withOpacity(0.6),
                                            borderRadius: const BorderRadius.only(
                                              bottomLeft: Radius.circular(12),
                                              bottomRight: Radius.circular(12),
                                            ),
                                          ),
                                          child: const Text(
                                            '👆 Натисніть для збільшення',
                                            style: TextStyle(
                                              color: Colors.white,
                                              fontSize: 12,
                                            ),
                                            textAlign: TextAlign.center,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            // Варіанти відповідей
                            ...currentQuestion.answers.asMap().entries.map((entry) {
                              final index = entry.key;
                              final answer = entry.value;
                              final isSelected = _selectedAnswer == index;
                              final isCorrect = _resultData != null && _resultData!.isCorrect && isSelected;
                              final isWrong = _resultData != null && !_resultData!.isCorrect && isSelected;

                              final canAnswer = _selectedAnswer == null;

                              return Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: InkWell(
                                  onTap: canAnswer ? () => _handleAnswer(index) : null,
                                  borderRadius: BorderRadius.circular(12),
                                  child: Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: isCorrect
                                          ? Colors.green.withOpacity(0.2)
                                          : isWrong
                                              ? Colors.red.withOpacity(0.2)
                                              : isSelected
                                                  ? Colors.blue.withOpacity(0.2)
                                                  : Colors.white,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(
                                        color: isCorrect
                                            ? Colors.green
                                            : isWrong
                                                ? Colors.red
                                                : isSelected
                                                    ? Colors.blue
                                                    : Colors.grey[300]!,
                                        width: 2,
                                      ),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withOpacity(0.05),
                                          blurRadius: 4,
                                          offset: const Offset(0, 2),
                                        ),
                                      ],
                                    ),
                                    child: Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            answer.text,
                                            style: TextStyle(
                                              fontSize: 16,
                                              fontWeight: isSelected
                                                  ? FontWeight.w600
                                                  : FontWeight.normal,
                                              color: isCorrect
                                                  ? Colors.green[700]
                                                  : isWrong
                                                      ? Colors.red[700]
                                                      : null,
                                            ),
                                          ),
                                        ),
                                        if (isCorrect)
                                          const Text(
                                            '✓',
                                            style: TextStyle(
                                              fontSize: 24,
                                              color: Colors.green,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        if (isWrong)
                                          const Text(
                                            '✗',
                                            style: TextStyle(
                                              fontSize: 24,
                                              color: Colors.red,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            }),
                            // Результат відповіді
                            if (_showResult && _resultData != null) ...[
                              const SizedBox(height: 24),
                              Container(
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(
                                  color: _resultData!.isCorrect
                                      ? Colors.green.withOpacity(0.2)
                                      : Colors.red.withOpacity(0.2),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: _resultData!.isCorrect
                                        ? Colors.green
                                        : Colors.red,
                                    width: 2,
                                  ),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      _resultData!.isCorrect
                                          ? '✅ Правильно!'
                                          : '❌ Неправильно',
                                      style: const TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    if (_resultData!.isCorrect &&
                                        _resultData!.coinsEarned > 0) ...[
                                      const SizedBox(height: 8),
                                      Text(
                                        '+${_resultData!.coinsEarned} 🪙 Мрійчиків',
                                        style: const TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.amber,
                                        ),
                                      ),
                                    ],
                                    if (!_resultData!.isCorrect &&
                                        _resultData!.explanation != null) ...[
                                      const SizedBox(height: 12),
                                      const Text(
                                        'Пояснення:',
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        _resultData!.explanation!,
                                        style: const TextStyle(fontSize: 14),
                                      ),
                                      const SizedBox(height: 8),
                                      TextButton(
                                        onPressed: () {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            const SnackBar(
                                              content: Text('База знань буде додана пізніше'),
                                            ),
                                          );
                                        },
                                        child: const Text('Перейти до бази знань →'),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          _buildImageZoomModal(),
        ],
      ),
    );
  }

  Widget _buildImageZoomModal() {
    if (!_imageZoomVisible || _zoomedImageUri == null) {
      return const SizedBox.shrink();
    }

    return GestureDetector(
      onTap: () {
        setState(() {
          _imageZoomVisible = false;
          _zoomedImageUri = null;
        });
      },
      child: Container(
        color: Colors.black.withOpacity(0.9),
        child: Stack(
          children: [
            Center(
              child: Image.network(
                _zoomedImageUri!,
                fit: BoxFit.contain,
              ),
            ),
            Positioned(
              top: 40,
              right: 20,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white, size: 32),
                onPressed: () {
                  setState(() {
                    _imageZoomVisible = false;
                    _zoomedImageUri = null;
                  });
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
