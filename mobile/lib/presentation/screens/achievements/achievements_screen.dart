import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../../data/models/user_achievement_model.dart';
import '../../providers/achievements_provider.dart';
import '../../providers/auth_provider.dart';
import 'package:intl/intl.dart';

class AchievementsScreen extends StatefulWidget {
  const AchievementsScreen({super.key});

  @override
  State<AchievementsScreen> createState() => _AchievementsScreenState();
}

class _AchievementsScreenState extends State<AchievementsScreen> {
  final List<Map<String, String>> _rarityFilters = [
    {'value': '', 'label': 'Всі'},
    {'value': 'common', 'label': 'Звичайні'},
    {'value': 'rare', 'label': 'Рідкісні'},
    {'value': 'epic', 'label': 'Епічні'},
    {'value': 'legendary', 'label': 'Легендарні'},
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final achievementsProvider = Provider.of<AchievementsProvider>(context, listen: false);
    final user = authProvider.user;

    if (user != null) {
      await achievementsProvider.loadUserAchievements(user.id);
    }
  }

  Color _getRarityColor(String rarity) {
    switch (rarity.toLowerCase()) {
      case 'common':
        return Colors.grey;
      case 'rare':
        return Colors.blue;
      case 'epic':
        return Colors.purple;
      case 'legendary':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  IconData _getAchievementIcon(String? icon) {
    if (icon == null || icon.isEmpty) {
      return Icons.emoji_events;
    }
    // Якщо це emoji, повертаємо стандартну іконку
    if (icon.length <= 2) {
      return Icons.emoji_events;
    }
    // Можна додати маппінг для інших типів іконок
    return Icons.emoji_events;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ачівки'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/'),
        ),
      ),
      body: Consumer2<AchievementsProvider, AuthProvider>(
        builder: (context, achievementsProvider, authProvider, child) {
          if (achievementsProvider.isLoading) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          if (achievementsProvider.errorMessage != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
                  const SizedBox(height: 16),
                  Text(
                    achievementsProvider.errorMessage ?? 'Помилка',
                    style: TextStyle(color: Colors.red[700]),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => _loadData(),
                    child: const Text('Спробувати ще раз'),
                  ),
                ],
              ),
            );
          }

          final userAchievements = achievementsProvider.filteredUserAchievements;
          final stats = {
            'total': achievementsProvider.totalAchievements,
            'earned': achievementsProvider.earnedAchievements,
            'percentage': achievementsProvider.earnedPercentage,
          };

          return RefreshIndicator(
            onRefresh: _loadData,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Статистика
                  _buildStatsCard(stats),
                  
                  // Фільтри
                  _buildFilterBar(achievementsProvider),
                  
                  // Сітка ачівок
                  if (userAchievements.isEmpty)
                    Padding(
                      padding: const EdgeInsets.all(32.0),
                      child: Center(
                        child: Column(
                          children: [
                            Icon(Icons.emoji_events_outlined, size: 64, color: Colors.grey[400]),
                            const SizedBox(height: 16),
                            Text(
                              'Ачівок поки немає',
                              style: TextStyle(
                                fontSize: 18,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 16,
                          mainAxisSpacing: 16,
                          childAspectRatio: 0.85,
                        ),
                        itemCount: userAchievements.length,
                        itemBuilder: (context, index) {
                          return _buildAchievementCard(userAchievements[index]);
                        },
                      ),
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatsCard(Map<String, dynamic> stats) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.blue[400]!, Colors.purple[400]!],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Ваші досягнення',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatItem(
                '${stats['earned']}',
                'Отримано',
                Icons.check_circle_outline,
              ),
              Container(
                width: 1,
                height: 40,
                color: Colors.white.withOpacity(0.3),
              ),
              _buildStatItem(
                '${stats['total']}',
                'Всього',
                Icons.emoji_events_outlined,
              ),
              Container(
                width: 1,
                height: 40,
                color: Colors.white.withOpacity(0.3),
              ),
              _buildStatItem(
                '${stats['percentage'].toStringAsFixed(0)}%',
                'Прогрес',
                Icons.trending_up,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String value, String label, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: Colors.white, size: 28),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withOpacity(0.9),
            fontSize: 12,
          ),
        ),
      ],
    );
  }

  Widget _buildFilterBar(AchievementsProvider provider) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: _rarityFilters.map((filter) {
            final isSelected = provider.selectedRarity == filter['value'] ||
                (provider.selectedRarity == null && filter['value']!.isEmpty);
            return Padding(
              padding: const EdgeInsets.only(right: 8.0),
              child: FilterChip(
                label: Text(filter['label']!),
                selected: isSelected,
                onSelected: (selected) {
                  provider.setSelectedRarity(
                    selected ? (filter['value']!.isEmpty ? null : filter['value']) : null,
                  );
                },
                selectedColor: Colors.blue[100],
                checkmarkColor: Colors.blue,
              ),
            );
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildAchievementCard(UserAchievementModel userAchievement) {
    final achievement = userAchievement.achievement;
    final isEarned = userAchievement.isEarned;
    final rarityColor = _getRarityColor(achievement.rarity);

    return InkWell(
      onTap: () => _showAchievementDetails(userAchievement),
      borderRadius: BorderRadius.circular(12),
      child: Card(
        elevation: isEarned ? 4 : 1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: isEarned
              ? BorderSide(color: rarityColor, width: 2)
              : BorderSide(color: Colors.grey[300]!, width: 1),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Іконка ачівки
            Stack(
              alignment: Alignment.center,
              children: [
                Icon(
                  _getAchievementIcon(achievement.icon),
                  size: 48,
                  color: isEarned ? rarityColor : Colors.grey[400],
                ),
                if (!isEarned)
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.3),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.lock,
                      size: 24,
                      color: Colors.white,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            
            // Назва
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8.0),
              child: Text(
                achievement.name,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: isEarned ? Colors.black87 : Colors.grey[600],
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
              ),
            ),
            
            // Прогрес
            if (!isEarned)
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: Column(
                  children: [
                    LinearProgressIndicator(
                      value: userAchievement.progressPercentage / 100,
                      backgroundColor: Colors.grey[200],
                      valueColor: AlwaysStoppedAnimation<Color>(rarityColor),
                      minHeight: 4,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${userAchievement.progress}/${userAchievement.target}',
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              )
            else if (userAchievement.earnedAt != null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8.0),
                child: Text(
                  DateFormat('dd.MM.yyyy').format(userAchievement.earnedAt!),
                  style: TextStyle(
                    fontSize: 10,
                    color: Colors.grey[600],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _showAchievementDetails(UserAchievementModel userAchievement) {
    final achievement = userAchievement.achievement;
    final rarityColor = _getRarityColor(achievement.rarity);
    final isEarned = userAchievement.isEarned;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: Row(
          children: [
            Icon(
              _getAchievementIcon(achievement.icon),
              color: isEarned ? rarityColor : Colors.grey[400],
              size: 32,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                achievement.name,
                style: const TextStyle(fontSize: 20),
              ),
            ),
          ],
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Рідкісність
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: rarityColor.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  _getRarityLabel(achievement.rarity),
                  style: TextStyle(
                    color: rarityColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              
              // Опис
              Text(
                achievement.description,
                style: const TextStyle(fontSize: 14, height: 1.5),
              ),
              const SizedBox(height: 16),
              
              // Статус
              if (isEarned)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.green[50],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.check_circle, color: Colors.green[700], size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Отримано',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                            if (userAchievement.earnedAt != null)
                              Text(
                                DateFormat('dd MMMM yyyy').format(userAchievement.earnedAt!),
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.grey[600],
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                )
              else
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.orange[50],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(Icons.track_changes, color: Colors.orange[700], size: 20),
                          const SizedBox(width: 8),
                          const Text(
                            'Прогрес',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      LinearProgressIndicator(
                        value: userAchievement.progressPercentage / 100,
                        backgroundColor: Colors.grey[200],
                        valueColor: AlwaysStoppedAnimation<Color>(rarityColor),
                        minHeight: 6,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${userAchievement.progress} / ${userAchievement.target}',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[700],
                        ),
                      ),
                    ],
                  ),
                ),
              
              // Нагорода
              if (achievement.reward != null && achievement.reward!.coins != null)
                Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.amber[50],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.monetization_on, color: Colors.amber[700], size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'Нагорода: ${achievement.reward!.coins} 🪙',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.amber[900],
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Закрити'),
          ),
        ],
      ),
    );
  }

  String _getRarityLabel(String rarity) {
    switch (rarity.toLowerCase()) {
      case 'common':
        return 'Звичайна';
      case 'rare':
        return 'Рідкісна';
      case 'epic':
        return 'Епічна';
      case 'legendary':
        return 'Легендарна';
      default:
        return rarity;
    }
  }
}
