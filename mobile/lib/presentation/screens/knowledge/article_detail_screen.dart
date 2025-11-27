import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:share_plus/share_plus.dart';
import '../../providers/knowledge_base_provider.dart';
import '../../providers/auth_provider.dart';
import '../../../data/repositories/knowledge_base_repository.dart';
import '../../../core/utils/image_url_helper.dart';

class ArticleDetailScreen extends StatefulWidget {
  final String articleId;

  const ArticleDetailScreen({
    super.key,
    required this.articleId,
  });

  @override
  State<ArticleDetailScreen> createState() => _ArticleDetailScreenState();
}

class _ArticleDetailScreenState extends State<ArticleDetailScreen> {
  final KnowledgeBaseRepository _repository = KnowledgeBaseRepository();
  final TextEditingController _commentController = TextEditingController();
  bool _isLoading = true;
  Map<String, dynamic>? _article;
  bool _isBookmarked = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadArticle();
    });
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _loadArticle() async {
    if (!mounted) return;

    setState(() {
      _isLoading = true;
    });

    if (!mounted) return;

    KnowledgeBaseProvider? provider;
    try {
      provider = Provider.of<KnowledgeBaseProvider>(context, listen: false);
    } catch (e) {
      debugPrint('Error getting provider: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
      return;
    }

    try {
      final article = await _repository.getArticle(widget.articleId);
      if (!mounted) return;

      if (article != null) {
        _article = {
          'id': article.id,
          'title': article.title,
          'content': article.content,
          'categoryName': article.categoryName,
          'image': article.image,
          'views': article.views,
          'createdAt': article.createdAt,
          'updatedAt': article.updatedAt,
          'positions': article.positions,
        };

        if (mounted) {
          try {
            _isBookmarked = await provider.isBookmarked(article.id);
          } catch (e) {
            debugPrint('Error checking bookmark: $e');
            _isBookmarked = false;
          }
        }

        if (mounted) {
          try {
            await provider.loadComments(article.id);
          } catch (e) {
            debugPrint('Error loading comments: $e');
          }
        }
      }
    } catch (e, stackTrace) {
      debugPrint('Error loading article: $e');
      debugPrint('Stack trace: $stackTrace');
      if (mounted) {
        try {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Помилка завантаження статті: $e'),
              backgroundColor: Colors.red,
            ),
          );
        } catch (_) {
          // Ігноруємо помилки при показі SnackBar під час навігації
        }
      }
    }

    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _addComment() async {
    if (_commentController.text.trim().isEmpty) return;

    final provider = Provider.of<KnowledgeBaseProvider>(context, listen: false);
    final success = await provider.addComment(
      widget.articleId,
      _commentController.text.trim(),
    );

    if (success) {
      _commentController.clear();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Коментар додано')),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Помилка додавання коментаря'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _handleBackNavigation() {
    if (context.canPop()) {
      context.pop();
    } else {
      context.go('/knowledge');
    }
  }

  Future<void> _handleBookmarkToggle() async {
    if (!mounted) return;
    final provider = Provider.of<KnowledgeBaseProvider>(context, listen: false);
    try {
      if (_isBookmarked) {
        await provider.removeBookmark(widget.articleId);
      } else {
        await provider.addBookmark(widget.articleId);
      }
      if (mounted) {
        setState(() {
          _isBookmarked = !_isBookmarked;
        });
      }
    } catch (e) {
      debugPrint('Error updating bookmark: $e');
    }
  }

  Future<void> _handleShare() async {
    if (_article != null) {
      Share.share('${_article!['title']}\n\nПереглянути статтю в додатку');
    }
  }

  Future<void> _handleRefresh() async {
    if (!mounted) return;
    try {
      await _loadArticle();
      if (mounted) {
        final provider = Provider.of<KnowledgeBaseProvider>(context, listen: false);
        await provider.loadComments(widget.articleId);
      }
    } catch (e) {
      debugPrint('Error refreshing article: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: true,
      onPopInvoked: (didPop) {
        if (didPop) {
          // Якщо pop відбувся, перевіряємо, чи є куди повертатися
          // Якщо немає - переходимо на базу знань
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              try {
                final navigator = Navigator.of(context, rootNavigator: false);
                if (!navigator.canPop()) {
                  context.go('/knowledge');
                }
              } catch (e) {
                debugPrint('Error in onPopInvoked: $e');
                // Якщо виникла помилка, спробуємо перейти на базу знань
                if (mounted) {
                  try {
                    context.go('/knowledge');
                  } catch (_) {
                    // Ігноруємо помилки навігації
                  }
                }
              }
            }
          });
        }
      },
      child: Scaffold(
        appBar: _buildAppBar(),
        body: _buildBody(),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      title: const Text('Стаття'),
      leading: IconButton(
        icon: const Icon(Icons.arrow_back),
        onPressed: _handleBackNavigation,
      ),
      actions: _article != null ? _buildAppBarActions() : null,
    );
  }

  List<Widget> _buildAppBarActions() {
    return [
      IconButton(
        icon: const Icon(Icons.share),
        onPressed: _handleShare,
      ),
      IconButton(
        icon: Icon(
          _isBookmarked ? Icons.bookmark : Icons.bookmark_border,
          color: _isBookmarked ? Colors.amber : null,
        ),
        onPressed: _handleBookmarkToggle,
      ),
    ];
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_article == null) {
      return _buildErrorState();
    }

    return RefreshIndicator(
      onRefresh: _handleRefresh,
      child: _buildArticleContent(),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
          const SizedBox(height: 16),
          const Text('Статтю не знайдено'),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => context.go('/knowledge'),
            child: const Text('Повернутися до бази знань'),
          ),
        ],
      ),
    );
  }

  Widget _buildArticleContent() {
    final provider = Provider.of<KnowledgeBaseProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);
    final comments = provider.getComments(widget.articleId);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildArticleHeader(),
          const SizedBox(height: 16),
          if (_article!['image'] != null) ...[
            _buildArticleImage(),
            const SizedBox(height: 16),
          ],
          _buildArticleHtmlContent(),
          const SizedBox(height: 24),
          _buildCommentsSection(provider, authProvider, comments),
        ],
      ),
    );
  }

  Widget _buildArticleHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _article!['title'],
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        _buildArticleMeta(),
      ],
    );
  }

  Widget _buildArticleMeta() {
    return Row(
      children: [
        if (_article!['categoryName'] != null) ...[
          Chip(
            label: Text(_article!['categoryName']),
            labelStyle: const TextStyle(fontSize: 12),
          ),
          const SizedBox(width: 8),
        ],
        Icon(Icons.visibility, size: 16, color: Colors.grey[600]),
        const SizedBox(width: 4),
        Text(
          '${_article!['views']}',
          style: TextStyle(color: Colors.grey[600]),
        ),
        const SizedBox(width: 16),
        Text(
          DateFormat('dd.MM.yyyy').format(_article!['createdAt']),
          style: TextStyle(color: Colors.grey[600]),
        ),
      ],
    );
  }

  Widget _buildArticleImage() {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: GestureDetector(
        onTap: () => _showImageDialog(),
        child: CachedNetworkImage(
          imageUrl: ImageUrlHelper.getImageUrl(_article!['image']) ?? '',
          width: double.infinity,
          fit: BoxFit.cover,
          placeholder: (context, url) => Container(
            height: 200,
            color: Colors.grey[200],
            child: const Center(child: CircularProgressIndicator()),
          ),
          errorWidget: (context, url, error) => Container(
            height: 200,
            color: Colors.grey[300],
            child: const Icon(Icons.image_not_supported),
          ),
        ),
      ),
    );
  }

  void _showImageDialog() {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: Stack(
          children: [
            Center(
              child: CachedNetworkImage(
                imageUrl: ImageUrlHelper.getImageUrl(_article!['image']) ?? '',
                fit: BoxFit.contain,
              ),
            ),
            Positioned(
              top: 40,
              right: 20,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white, size: 30),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildArticleHtmlContent() {
    if (_article!['content'] == null || _article!['content'].toString().isEmpty) {
      return const SizedBox.shrink();
    }

    return RepaintBoundary(
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: BorderRadius.circular(12),
        ),
        child: _SafeHtmlWidget(htmlContent: _article!['content'] ?? ''),
      ),
    );
  }

  Widget _buildCommentsSection(
    KnowledgeBaseProvider provider,
    AuthProvider authProvider,
    List<Map<String, dynamic>> comments,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Divider(),
        const SizedBox(height: 8),
        const Text(
          'Коментарі',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        _buildCommentInput(),
        const SizedBox(height: 16),
        _buildCommentsList(provider, authProvider, comments),
      ],
    );
  }

  Widget _buildCommentInput() {
    return TextField(
      controller: _commentController,
      decoration: InputDecoration(
        hintText: 'Написати коментар...',
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        suffixIcon: IconButton(
          icon: const Icon(Icons.send),
          onPressed: _addComment,
        ),
      ),
      maxLines: 3,
    );
  }

  Widget _buildCommentsList(
    KnowledgeBaseProvider provider,
    AuthProvider authProvider,
    List<Map<String, dynamic>> comments,
  ) {
    if (provider.isLoadingComments(widget.articleId)) {
      return const Center(child: CircularProgressIndicator());
    }

    if (comments.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Text(
            'Ще немає коментарів',
            style: TextStyle(color: Colors.grey[600]),
          ),
        ),
      );
    }

    return Column(
      children: comments
          .map((comment) => _buildCommentCard(comment, provider, authProvider.user?.id))
          .toList(),
    );
  }

  Widget _buildCommentCard(
    Map<String, dynamic> comment,
    KnowledgeBaseProvider provider,
    String? currentUserId,
  ) {
    final isOwner = comment['user']?['_id'] == currentUserId ||
        comment['user']?['id'] == currentUserId;
    final likes = (comment['likes'] as List?)?.length ?? 0;
    final isLiked = (comment['likes'] as List?)?.contains(currentUserId) ?? false;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  child: Text(
                    (comment['user']?['firstName']?[0] ?? 'U').toUpperCase(),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${comment['user']?['firstName'] ?? ''} ${comment['user']?['lastName'] ?? ''}',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        DateFormat('dd.MM.yyyy HH:mm').format(
                          DateTime.parse(comment['createdAt']),
                        ),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                if (isOwner) _buildCommentMenu(comment, provider),
              ],
            ),
            const SizedBox(height: 8),
            Text(comment['text'] ?? ''),
            const SizedBox(height: 8),
            Row(
              children: [
                IconButton(
                  icon: Icon(
                    isLiked ? Icons.thumb_up : Icons.thumb_up_outlined,
                    color: isLiked ? Colors.blue : null,
                  ),
                  onPressed: () => provider.likeComment(comment['_id'], widget.articleId),
                ),
                Text('$likes'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCommentMenu(Map<String, dynamic> comment, KnowledgeBaseProvider provider) {
    return PopupMenuButton(
      itemBuilder: (context) => [
        const PopupMenuItem(
          value: 'edit',
          child: Row(
            children: [
              Icon(Icons.edit, size: 20),
              SizedBox(width: 8),
              Text('Редагувати'),
            ],
          ),
        ),
        const PopupMenuItem(
          value: 'delete',
          child: Row(
            children: [
              Icon(Icons.delete, size: 20, color: Colors.red),
              SizedBox(width: 8),
              Text('Видалити', style: TextStyle(color: Colors.red)),
            ],
          ),
        ),
      ],
      onSelected: (value) {
        if (value == 'edit') {
          _showEditCommentDialog(comment['_id'], comment['text'], provider);
        } else if (value == 'delete') {
          _deleteComment(comment['_id'], provider);
        }
      },
    );
  }

  void _showEditCommentDialog(
    String commentId,
    String currentText,
    KnowledgeBaseProvider provider,
  ) {
    final controller = TextEditingController(text: currentText);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Редагувати коментар'),
        content: TextField(
          controller: controller,
          maxLines: 3,
          decoration: const InputDecoration(
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Скасувати'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (controller.text.trim().isNotEmpty) {
                await provider.updateComment(
                  commentId,
                  widget.articleId,
                  controller.text.trim(),
                );
                if (mounted) {
                  Navigator.pop(context);
                }
              }
            },
            child: const Text('Зберегти'),
          ),
        ],
      ),
    );
  }

  void _deleteComment(String commentId, KnowledgeBaseProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Видалити коментар?'),
        content: const Text('Цю дію неможливо скасувати.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Скасувати'),
          ),
          ElevatedButton(
            onPressed: () async {
              await provider.deleteComment(commentId, widget.articleId);
              if (mounted) {
                Navigator.pop(context);
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Видалити'),
          ),
        ],
      ),
    );
  }
}

// Безпечний віджет для рендерингу HTML з обробкою помилок
class _SafeHtmlWidget extends StatefulWidget {
  final String htmlContent;

  const _SafeHtmlWidget({
    required this.htmlContent,
  });

  @override
  State<_SafeHtmlWidget> createState() => _SafeHtmlWidgetState();
}

class _SafeHtmlWidgetState extends State<_SafeHtmlWidget> with AutomaticKeepAliveClientMixin {
  bool _hasError = false;

  @override
  bool get wantKeepAlive => true;

  @override
  void dispose() {
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    
    if (!mounted) {
      return const SizedBox.shrink();
    }

    if (_hasError) {
      return SelectableText(
        widget.htmlContent,
        style: const TextStyle(fontSize: 16.0),
      );
    }

    return Builder(
      builder: (context) {
        if (!mounted) {
          return const SizedBox.shrink();
        }
        try {
          return Html(
            data: widget.htmlContent,
            style: {
              "body": Style(
                fontSize: FontSize(16.0),
                lineHeight: LineHeight(1.5),
              ),
            },
          );
        } catch (e, stackTrace) {
          debugPrint('Error rendering HTML: $e');
          debugPrint('Stack trace: $stackTrace');
          if (mounted) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) {
                setState(() {
                  _hasError = true;
                });
              }
            });
          }
          return SelectableText(
            widget.htmlContent,
            style: const TextStyle(fontSize: 16.0),
          );
        }
      },
    );
  }
}
