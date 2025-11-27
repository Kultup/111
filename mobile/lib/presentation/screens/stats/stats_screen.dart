import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../providers/stats_provider.dart';
import '../../providers/auth_provider.dart';
import '../../../data/models/stats_model.dart';

class StatsScreen extends StatefulWidget {
  const StatsScreen({super.key});

  @override
  State<StatsScreen> createState() => _StatsScreenState();
}

class _StatsScreenState extends State<StatsScreen>
    with SingleTickerProviderStateMixin {
  int _activeTab = 0; // 0: Загальна, 1: Графіки, 2: Категорії, 3: Монети, 4: Покупки

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadStats();
    });
  }

  Future<void> _loadStats() async {
    final statsProvider = Provider.of<StatsProvider>(context, listen: false);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final userId = authProvider.user?.id;

    if (userId != null) {
      await statsProvider.loadStats(userId);
      await statsProvider.loadCoinHistory();
      await statsProvider.loadPurchases();
    }
  }

  List<Map<String, dynamic>> _prepareTestHistoryData(
      List<Map<String, dynamic>> testHistory) {
    final last30Days = <Map<String, dynamic>>[];
    final today = DateTime.now();

    for (int i = 29; i >= 0; i--) {
      final date = DateTime(today.year, today.month, today.day - i);
      final dateStr = DateFormat('dd.MM', 'uk_UA').format(date);

      Map<String, dynamic>? test;
      try {
        test = testHistory.firstWhere(
          (t) {
            final testDateStr = t['date'] as String?;
            if (testDateStr == null) return false;
            final testDate = DateTime.parse(testDateStr);
            return testDate.year == date.year &&
                testDate.month == date.month &&
                testDate.day == date.day;
          },
          orElse: () => <String, dynamic>{},
        );
        if (test.isEmpty) test = null;
      } catch (e) {
        test = null;
      }

      last30Days.add({
        'date': dateStr,
        'score': test != null ? (test['score'] as int? ?? 0) : 0,
        'hasTest': test != null,
      });
    }

    return last30Days;
  }

  String _formatDate(String? dateString) {
    if (dateString == null) return '';
    try {
      final date = DateTime.parse(dateString);
      return DateFormat('dd.MM.yyyy, HH:mm', 'uk_UA').format(date);
    } catch (e) {
      return dateString;
    }
  }

  Color _getStatusColor(String? status) {
    switch (status) {
      case 'approved':
      case 'completed':
        return Colors.green;
      case 'pending':
        return Colors.orange;
      case 'rejected':
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String? status) {
    switch (status) {
      case 'approved':
        return 'Підтверджено';
      case 'pending':
        return 'Очікує підтвердження';
      case 'rejected':
        return 'Відхилено';
      case 'completed':
        return 'Завершено';
      case 'cancelled':
        return 'Скасовано';
      default:
        return status ?? '';
    }
  }

  Color _getScoreColor(int score) {
    if (score >= 4) return Colors.green;
    if (score >= 3) return Colors.orange;
    return Colors.red;
  }

  @override
  Widget build(BuildContext context) {
    final statsProvider = Provider.of<StatsProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);
    final stats = statsProvider.stats;
    final user = authProvider.user;

    return PopScope(
      canPop: true,
      onPopInvoked: (didPop) async {
        if (didPop) {
          // Якщо pop відбувся, перевіряємо, чи є куди повертатися
          // Якщо немає - переходимо на головний екран
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted && !context.canPop()) {
              context.go('/');
            }
          });
        }
      },
      child: statsProvider.isLoading
          ? Scaffold(
              appBar: AppBar(
                title: const Text('Статистика'),
              ),
              body: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const CircularProgressIndicator(),
                    const SizedBox(height: 16),
                    Text(
                      'Завантаження статистики...',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
            )
          : Scaffold(
      appBar: AppBar(
        title: const Text('Статистика'),
      ),
      body: RefreshIndicator(
        onRefresh: _loadStats,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Заголовок
              Text(
                '${user?.firstName ?? ''} ${user?.lastName ?? ''}',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 20),
              // Таби
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildTab('Загальна', 0),
                    const SizedBox(width: 8),
                    _buildTab('Графіки', 1),
                    const SizedBox(width: 8),
                    _buildTab('Категорії', 2),
                    const SizedBox(width: 8),
                    _buildTab('Монети', 3),
                    const SizedBox(width: 8),
                    _buildTab('Покупки', 4),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              // Контент вкладок
              if (_activeTab == 0) _buildGeneralTab(stats),
              if (_activeTab == 1) _buildChartsTab(stats),
              if (_activeTab == 2) _buildCategoriesTab(stats),
              if (_activeTab == 3) _buildCoinsTab(),
              if (_activeTab == 4) _buildPurchasesTab(),
            ],
          ),
        ),
      ),
      ),
    );
  }

  Widget _buildTab(String label, int index) {
    final isActive = _activeTab == index;
    return GestureDetector(
      onTap: () => setState(() => _activeTab = index),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? Colors.blue : Colors.grey[200],
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isActive ? Colors.white : Colors.black87,
            fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildGeneralTab(StatsModel? stats) {
    if (stats == null) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32.0),
          child: Text('Немає даних для відображення'),
        ),
      );
    }

    final testHistory = stats.testHistory;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Статистичні карточки
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            _buildStatCard('Пройдено тестів', '${stats.totalTests}'),
            _buildStatCard('Точність', '${stats.accuracy.toStringAsFixed(1)}%'),
            _buildStatCard(
              'Правильних відповідей',
              '${stats.correctAnswers} / ${stats.totalAnswers}',
            ),
            _buildStatCard('Монети', '${stats.coins} 🪙'),
            if (stats.rank > 0)
              _buildStatCard('Позиція в рейтингу', '#${stats.rank}'),
          ],
        ),
        const SizedBox(height: 24),
        // Останні результати
        if (testHistory.isNotEmpty) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Останні результати',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (testHistory.length > 5)
                TextButton(
                  onPressed: () {
                    // TODO: Показати всі тести (можна додати окремий екран)
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Показуються останні 5 тестів'),
                      ),
                    );
                  },
                  child: Text('Показати всі (${testHistory.length})'),
                ),
            ],
          ),
          const SizedBox(height: 12),
          ...testHistory.take(5).map((test) => Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  onTap: () {
                    // Перехід до результатів тесту
                    context.push('/test-results/${test.id}');
                  },
                  leading: Icon(
                    Icons.quiz,
                    color: Theme.of(context).primaryColor,
                  ),
                  title: Text(
                    DateFormat('dd.MM.yyyy', 'uk_UA').format(test.date),
                    style: const TextStyle(fontSize: 14),
                  ),
                  subtitle: Text(
                    'Результат: ${test.score}/5',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: _getScoreColor(test.score).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '${((test.score / 5) * 100).toStringAsFixed(0)}%',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: _getScoreColor(test.score),
                          ),
                        ),
                      ),
                      if (test.coinsEarned > 0) ...[
                        const SizedBox(width: 8),
                        Text(
                          '+${test.coinsEarned} 🪙',
                          style: const TextStyle(
                            fontSize: 14,
                            color: Colors.amber,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                      const SizedBox(width: 4),
                      Icon(
                        Icons.chevron_right,
                        color: Colors.grey[400],
                      ),
                    ],
                  ),
                ),
              )),
        ],
      ],
    );
  }

  Widget _buildStatCard(String label, String value) {
    return SizedBox(
      width: (MediaQuery.of(context).size.width - 44) / 2,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 8),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildChartsTab(StatsModel? stats) {
    if (stats == null || stats.testHistory.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32.0),
          child: Text('Немає даних для відображення графіка'),
        ),
      );
    }

    final testHistoryData = _prepareTestHistoryData(
      stats.testHistory.map((t) => {
        'date': t.date.toIso8601String(),
        'score': t.score,
      }).toList(),
    );

    final hasData = testHistoryData.any((d) => d['hasTest'] == true);

    if (!hasData) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32.0),
          child: Text('Немає даних для відображення графіка'),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Результати по днях (останні 30 днів)',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 220,
          child: LineChart(
            LineChartData(
              gridData: FlGridData(show: true),
              titlesData: FlTitlesData(
                leftTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 40,
                    getTitlesWidget: (value, meta) {
                      return Text(
                        value.toInt().toString(),
                        style: const TextStyle(fontSize: 10),
                      );
                    },
                  ),
                ),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 30,
                    getTitlesWidget: (value, meta) {
                      if (value.toInt() % 5 == 0) {
                        final index = value.toInt();
                        if (index >= 0 && index < testHistoryData.length) {
                          return Text(
                            testHistoryData[index]['date'],
                            style: const TextStyle(fontSize: 10),
                          );
                        }
                      }
                      return const Text('');
                    },
                  ),
                ),
                topTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
                rightTitles: const AxisTitles(
                  sideTitles: SideTitles(showTitles: false),
                ),
              ),
              borderData: FlBorderData(show: true),
              lineBarsData: [
                LineChartBarData(
                  spots: testHistoryData.asMap().entries.map((entry) {
                    return FlSpot(
                      entry.key.toDouble(),
                      (entry.value['score'] as int).toDouble(),
                    );
                  }).toList(),
                  isCurved: true,
                  color: Colors.blue,
                  barWidth: 2,
                  dotData: const FlDotData(show: true),
                  belowBarData: BarAreaData(show: false),
                ),
              ],
              minY: 0,
              maxY: 5,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCategoriesTab(StatsModel? stats) {
    if (stats == null || stats.categoryStats.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32.0),
          child: Text('Немає даних по категоріях'),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Точність по категоріях',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 220,
          child: PieChart(
            PieChartData(
              sectionsSpace: 2,
              centerSpaceRadius: 40,
              sections: stats.categoryStats.asMap().entries.map((entry) {
                final index = entry.key;
                final cat = entry.value;
                final color = Colors.primaries[index % Colors.primaries.length];
                return PieChartSectionData(
                  value: cat.accuracy,
                  title: '${cat.accuracy.toStringAsFixed(1)}%',
                  color: color,
                  radius: 50,
                  titleStyle: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                );
              }).toList(),
            ),
          ),
        ),
        const SizedBox(height: 16),
        ...stats.categoryStats.asMap().entries.map((entry) {
          final index = entry.key;
          final cat = entry.value;
          final color = Colors.primaries[index % Colors.primaries.length];
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                ),
              ),
              title: Text(cat.name),
              trailing: Text(
                '${cat.accuracy.toStringAsFixed(1)}% (${cat.correct}/${cat.total})',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildCoinsTab() {
    final statsProvider = Provider.of<StatsProvider>(context);
    final coinHistory = statsProvider.coinHistory;

    if (coinHistory.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32.0),
          child: Text('Немає історії монет'),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Історія монет',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        ...coinHistory.map((transaction) {
          final isEarned = transaction['type'] == 'earned';
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: Icon(
                isEarned ? Icons.add_circle : Icons.remove_circle,
                color: isEarned ? Colors.green : Colors.red,
              ),
              title: Text(
                isEarned ? 'Нарахування' : 'Витрата',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              subtitle: Text(
                _formatDate(transaction['createdAt']),
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              ),
              trailing: Text(
                '${isEarned ? '+' : '-'}${transaction['amount'] ?? 0} 🪙',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: isEarned ? Colors.green : Colors.red,
                ),
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildPurchasesTab() {
    final statsProvider = Provider.of<StatsProvider>(context);
    final purchases = statsProvider.purchases;

    if (purchases.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(32.0),
          child: Text('Немає покупок'),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Історія покупок',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        ...purchases.map((purchase) {
          final status = purchase['status'];
          final statusColor = _getStatusColor(status);
          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            child: ListTile(
              leading: Icon(
                Icons.shopping_bag,
                color: statusColor,
              ),
              title: Text(
                purchase['itemName'] ?? purchase['item']?['name'] ?? 'Товар',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _formatDate(purchase['createdAt']),
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      _getStatusText(status),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: statusColor,
                      ),
                    ),
                  ),
                ],
              ),
              trailing: Text(
                '-${purchase['price'] ?? 0} 🪙',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.red,
                ),
              ),
            ),
          );
        }),
      ],
    );
  }
}

