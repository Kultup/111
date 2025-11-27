import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/knowledge_base_provider.dart';
import '../../../data/models/knowledge_article_model.dart';
import '../../../core/utils/image_url_helper.dart';

class KnowledgeBaseScreen extends StatefulWidget {
  const KnowledgeBaseScreen({super.key});

  @override
  State<KnowledgeBaseScreen> createState() => _KnowledgeBaseScreenState();
}

class _KnowledgeBaseScreenState extends State<KnowledgeBaseScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    
    // Відкладаємо ініціалізацію після завершення побудови віджетів
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = Provider.of<KnowledgeBaseProvider>(context, listen: false);

      // Перевірка доступу та завантаження даних
      provider.checkAccessStatus().then((_) {
        if (provider.isAccessEnabled) {
          provider.loadCategories();
          provider.loadArticles(refresh: true);
          provider.loadBookmarks();
        }
      });
    });

    // Додавання listener для scroll для пагінації
    _scrollController.addListener(() {
      if (!_scrollController.hasClients) return;
      
      final provider = Provider.of<KnowledgeBaseProvider>(context, listen: false);
      if (_scrollController.position.pixels >=
          _scrollController.position.maxScrollExtent * 0.8) {
        if (!provider.isLoadingArticles && provider.hasMore) {
          provider.loadArticles();
        }
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _performSearch(String query) {
    final provider = Provider.of<KnowledgeBaseProvider>(context, listen: false);
    if (query.isEmpty) {
      provider.clearSearch();
    } else {
      provider.searchArticles(query);
    }
  }

  @override
  Widget build(BuildContext context) {
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
      child: Scaffold(
        appBar: AppBar(
          title: const Text('База знань'),
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () {
              if (context.canPop()) {
                context.pop();
              } else {
                context.go('/');
              }
            },
          ),
        ),
      body: Consumer<KnowledgeBaseProvider>(
        builder: (context, provider, child) {
          // Перевірка доступу
          if (provider.isCheckingAccess) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          if (!provider.isAccessEnabled) {
            return _buildAccessDeniedMessage();
          }

          return Column(
            children: [
              // Поле пошуку
              _buildSearchBar(provider),

              // Категорії (горизонтальний скрол)
              if (!provider.isSearching) _buildCategories(provider),

              // Список статей
              Expanded(
                child: _buildArticlesList(provider),
              ),
            ],
          );
        },
      ),
      ),
    );
  }

  Widget _buildSearchBar(KnowledgeBaseProvider provider) {
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: 'Пошук по базі знань...',
          prefixIcon: const Icon(Icons.search),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    _searchController.clear();
                    provider.clearSearch();
                  },
                )
              : null,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        onChanged: (value) {
          // Debounce - пошук через 500ms після останнього символу
          Future.delayed(const Duration(milliseconds: 500), () {
            if (_searchController.text == value) {
              _performSearch(value);
            }
          });
        },
      ),
    );
  }

  Widget _buildCategories(KnowledgeBaseProvider provider) {
    if (provider.isLoadingCategories) {
      return const SizedBox(
        height: 50,
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (provider.categories.isEmpty) {
      return const SizedBox.shrink();
    }

    return SizedBox(
      height: 50,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 8),
        children: [
          // Кнопка "Всі"
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: FilterChip(
              label: const Text('Всі'),
              selected: provider.selectedCategoryId == null,
              onSelected: (selected) {
                provider.setSelectedCategory(null);
              },
            ),
          ),
          // Категорії
          ...provider.categories.map((category) {
            final isSelected = provider.selectedCategoryId == category['id'];
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: FilterChip(
                label: Text(category['name'] ?? ''),
                selected: isSelected,
                onSelected: (selected) {
                  provider.setSelectedCategory(
                      selected ? category['id'] : null);
                },
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildArticlesList(KnowledgeBaseProvider provider) {
    if (provider.isSearching) {
      return _buildSearchResults(provider);
    }

    if (provider.isLoadingArticles && provider.articles.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (provider.errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text(
              provider.errorMessage!,
              style: TextStyle(color: Colors.red[700]),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => provider.loadArticles(refresh: true),
              child: const Text('Спробувати ще раз'),
            ),
          ],
        ),
      );
    }

    if (provider.articles.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.article_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'Статті не знайдено',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        await provider.loadArticles(refresh: true);
      },
      child: ListView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.all(8),
        itemCount: provider.articles.length + (provider.hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index >= provider.articles.length) {
            return const Padding(
              padding: EdgeInsets.all(16.0),
              child: Center(child: CircularProgressIndicator()),
            );
          }

          final article = provider.articles[index];
          return _buildArticleCard(article, provider);
        },
      ),
    );
  }

  Widget _buildSearchResults(KnowledgeBaseProvider provider) {
    if (provider.isSearching) {
      return const Center(child: CircularProgressIndicator());
    }

    if (provider.searchResults.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'Нічого не знайдено',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: provider.searchResults.length,
      itemBuilder: (context, index) {
        final article = provider.searchResults[index];
        return _buildArticleCard(article, provider);
      },
    );
  }

  Widget _buildArticleCard(
      KnowledgeArticleModel article, KnowledgeBaseProvider provider) {
    final isBookmarked = provider.bookmarks.contains(article.id);

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: () {
          context.go('/article/${article.id}');
        },
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Зображення статті
              if (article.image != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: CachedNetworkImage(
                    imageUrl: ImageUrlHelper.getImageUrl(article.image!) ?? '',
                    width: 80,
                    height: 80,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(
                      width: 80,
                      height: 80,
                      color: Colors.grey[200],
                      child: const Center(
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    ),
                    errorWidget: (context, url, error) => Container(
                      width: 80,
                      height: 80,
                      color: Colors.grey[300],
                      child: const Icon(Icons.image_not_supported),
                    ),
                  ),
                )
              else
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: Colors.grey[200],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.article, color: Colors.grey),
                ),
              const SizedBox(width: 12),
              // Контент
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      article.title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (article.categoryName != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        article.categoryName!,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.visibility,
                            size: 14, color: Colors.grey[600]),
                        const SizedBox(width: 4),
                        Text(
                          '${article.views}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              // Закладка
              IconButton(
                icon: Icon(
                  isBookmarked ? Icons.bookmark : Icons.bookmark_border,
                  color: isBookmarked ? Colors.amber : Colors.grey,
                ),
                onPressed: () {
                  if (isBookmarked) {
                    provider.removeBookmark(article.id);
                  } else {
                    provider.addBookmark(article.id);
                  }
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAccessDeniedMessage() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.lock_outline, size: 80, color: Colors.grey[400]),
            const SizedBox(height: 24),
            const Text(
              'Доступ до бази знань закрито',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Text(
              'Адміністратор тимчасово закрив доступ до навчальних матеріалів.',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

}
