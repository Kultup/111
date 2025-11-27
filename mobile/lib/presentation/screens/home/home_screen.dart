import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../providers/test_provider.dart';
import 'package:intl/intl.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with WidgetsBindingObserver {
  bool _isGenerating = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadCurrentTest();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    if (state == AppLifecycleState.resumed) {
      _loadCurrentTest();
    }
  }

  Future<void> _loadCurrentTest() async {
    final testProvider = Provider.of<TestProvider>(context, listen: false);
    await testProvider.loadCurrentTest();
  }

  Future<void> _handleStartTest() async {
    final testProvider = Provider.of<TestProvider>(context, listen: false);
    final test = testProvider.currentTest;

    if (test != null && test.status != 'completed') {
      if (mounted) {
        context.push('/test/${test.id}');
      }
    } else {
      await _generateTest();
    }
  }

  Future<void> _generateTest() async {
    setState(() {
      _isGenerating = true;
    });

    final testProvider = Provider.of<TestProvider>(context, listen: false);
    final success = await testProvider.generateTest();

    setState(() {
      _isGenerating = false;
    });

    if (success && testProvider.currentTest != null && mounted) {
      context.push('/test/${testProvider.currentTest!.id}');
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            testProvider.errorMessage ?? 'Не вдалося згенерувати тест',
          ),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final testProvider = Provider.of<TestProvider>(context);
    final user = authProvider.user;
    final isLoading = authProvider.isLoading;
    final isAuthenticated = authProvider.isAuthenticated;
    final currentTest = testProvider.currentTest;

    if (isLoading || !isAuthenticated) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Головна'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadCurrentTest,
            tooltip: 'Оновити',
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await authProvider.logout();
              if (context.mounted) {
                context.go('/login');
              }
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadCurrentTest,
        child: SafeArea(
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Привітання
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Вітаємо, ${user?.firstName ?? ''} ${user?.lastName ?? ''}!',
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          DateFormat('EEEE, d MMMM', 'uk_UA').format(DateTime.now()),
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                
                // Баланс монет
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Мрійчики',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          '${user?.coins ?? 0} 🪙',
                          style: Theme.of(context).textTheme.displayMedium,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                
                // Поточний тест
                if (currentTest != null && currentTest.status != 'completed')
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.quiz),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'Щоденний тест',
                                  style: Theme.of(context).textTheme.titleLarge,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Пройдіть щоденний тест, щоб отримати монети та покращити свої знання!',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                          const SizedBox(height: 12),
                          Chip(
                            label: const Text('Статус: В процесі'),
                            backgroundColor: Colors.orange.shade100,
                          ),
                          const SizedBox(height: 20),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: _isGenerating ? null : _handleStartTest,
                              child: _isGenerating
                                  ? const SizedBox(
                                      height: 24,
                                      width: 24,
                                      child: CircularProgressIndicator(strokeWidth: 3),
                                    )
                                  : const Text('Почати тест'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                else if (currentTest == null)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.play_circle_outline),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'Щоденний тест',
                                  style: Theme.of(context).textTheme.titleLarge,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Згенеруйте новий щоденний тест, щоб почати навчання!',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                          const SizedBox(height: 20),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: _isGenerating ? null : _generateTest,
                              child: _isGenerating
                                  ? const SizedBox(
                                      height: 24,
                                      width: 24,
                                      child: CircularProgressIndicator(strokeWidth: 3),
                                    )
                                  : const Text('Згенерувати тест'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 16),
                
                // Інформація про користувача
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Інформація профілю',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 20),
                        _buildInfoRow('Логін', user?.login ?? ''),
                        _buildInfoRow('Місто', user?.city ?? 'Не вказано'),
                        _buildInfoRow('Посада', user?.position ?? 'Не вказано'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                
                // Швидкі дії
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(20.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Швидкі дії',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        const SizedBox(height: 20),
                        // Перший ряд швидких дій
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildQuickAction(
                              context,
                              icon: Icons.bar_chart,
                              label: 'Статистика',
                              onTap: () {
                                context.push('/stats');
                              },
                            ),
                            _buildQuickAction(
                              context,
                              icon: Icons.book,
                              label: 'База знань',
                              onTap: () {
                                context.push('/knowledge');
                              },
                            ),
                            _buildQuickAction(
                              context,
                              icon: Icons.person,
                              label: 'Профіль',
                              onTap: () {
                                context.push('/profile');
                              },
                            ),
                            _buildQuickAction(
                              context,
                              icon: Icons.shopping_bag,
                              label: 'Магазин',
                              onTap: () {
                                context.push('/shop');
                              },
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        // Другий ряд швидких дій
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildQuickAction(
                              context,
                              icon: Icons.emoji_events,
                              label: 'Ачівки',
                              onTap: () {
                                context.push('/achievements');
                              },
                            ),
                            _buildQuickAction(
                              context,
                              icon: Icons.feedback,
                              label: 'Зворотний зв\'язок',
                              onTap: () {
                                context.push('/feedback');
                              },
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickAction(
    BuildContext context, {
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16.0, horizontal: 8.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 32),
              const SizedBox(height: 8),
              Text(
                label,
                style: Theme.of(context).textTheme.bodySmall,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}