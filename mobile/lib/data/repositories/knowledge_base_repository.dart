import 'package:shared_preferences/shared_preferences.dart';
import '../models/knowledge_article_model.dart';
import '../services/api_service.dart';
import 'dart:convert';

class KnowledgeBaseRepository {
  final ApiService _apiService = ApiService();
  static const String _bookmarksKey = 'knowledge_base_bookmarks';

  // Перевірка статусу доступу до бази знань
  Future<bool> getAccessStatus() async {
    try {
      final response = await _apiService.get('/knowledge-base/access-status');
      if (response.data['success'] == true) {
        // Backend повертає data: { isAccessEnabled: bool, accessStatus: string }
        final data = response.data['data'];
        if (data != null) {
          return data['isAccessEnabled'] ?? true;
        }
        return true;
      }
      return true; // За замовчуванням доступ відкритий
    } catch (e) {
      // Якщо endpoint не існує, повертаємо true (за замовчуванням доступ відкритий)
      return true;
    }
  }

  // Отримання категорій
  Future<List<Map<String, dynamic>>> getCategories() async {
    try {
      final response = await _apiService.get('/categories?active=true');
      if (response.data['success'] == true) {
        final categories = response.data['data'] as List<dynamic>? ?? [];
        return categories
            .map((cat) => {
                  'id': cat['_id'] ?? cat['id'] ?? '',
                  'name': cat['name'] ?? '',
                })
            .toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  // Отримання статей з фільтрацією
  Future<List<KnowledgeArticleModel>> getArticles({
    String? categoryId,
    String? searchQuery,
    int page = 1,
    int limit = 20,
    String? userPositionId,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
        'active': 'true', // Тільки активні статті
      };

      if (categoryId != null) {
        queryParams['category'] = categoryId;
      }

      if (searchQuery != null && searchQuery.isNotEmpty) {
        queryParams['search'] = searchQuery;
      }
      
      // Передаємо позицію користувача для фільтрації на backend
      if (userPositionId != null) {
        queryParams['position'] = userPositionId;
      }

      final response = await _apiService.get(
        '/knowledge-base',
        queryParameters: queryParams,
      );

      if (response.data['success'] == true) {
        final articlesData = response.data['data'] as List<dynamic>? ?? [];
        final articles = articlesData
            .map((article) =>
                KnowledgeArticleModel.fromJson(article as Map<String, dynamic>))
            .toList();

        // Backend вже фільтрує по позиції, тому додаткова фільтрація не потрібна
        // Але якщо користувач без позиції - показуємо всі статті
        return articles;
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  // Отримання статей по категорії
  Future<List<KnowledgeArticleModel>> getArticlesByCategory(
    String categoryId, {
    String? userPositionId,
  }) async {
    return getArticles(
      categoryId: categoryId,
      userPositionId: userPositionId,
    );
  }

  // Пошук статей
  Future<List<KnowledgeArticleModel>> searchArticles(
    String query, {
    String? userPositionId,
  }) async {
    return getArticles(
      searchQuery: query,
      userPositionId: userPositionId,
    );
  }

  // Отримання детальної інформації про статтю
  Future<KnowledgeArticleModel?> getArticle(String articleId) async {
    try {
      final response = await _apiService.get('/knowledge-base/$articleId');
      if (response.data['success'] == true) {
        final articleData = response.data['data'];
        return KnowledgeArticleModel.fromJson(
            articleData as Map<String, dynamic>);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // Робота з закладками
  Future<List<String>> getBookmarks() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final bookmarksJson = prefs.getString(_bookmarksKey);
      if (bookmarksJson != null) {
        final List<dynamic> bookmarks = json.decode(bookmarksJson);
        return bookmarks.map((id) => id.toString()).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<bool> addBookmark(String articleId) async {
    try {
      final bookmarks = await getBookmarks();
      if (!bookmarks.contains(articleId)) {
        bookmarks.add(articleId);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_bookmarksKey, json.encode(bookmarks));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<bool> removeBookmark(String articleId) async {
    try {
      final bookmarks = await getBookmarks();
      bookmarks.remove(articleId);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_bookmarksKey, json.encode(bookmarks));
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> isBookmarked(String articleId) async {
    final bookmarks = await getBookmarks();
    return bookmarks.contains(articleId);
  }

  // Коментарі до статей
  Future<List<Map<String, dynamic>>> getComments(String articleId) async {
    try {
      final response =
          await _apiService.get('/knowledge-base/$articleId/comments');
      if (response.data['success'] == true) {
        return (response.data['data'] as List<dynamic>? ?? [])
            .map((comment) => comment as Map<String, dynamic>)
            .toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  Future<bool> addComment(String articleId, String text,
      {String? parentCommentId}) async {
    try {
      final data = <String, dynamic>{
        'text': text,
      };
      if (parentCommentId != null) {
        data['parentComment'] = parentCommentId;
      }

      final response = await _apiService.post(
        '/knowledge-base/$articleId/comments',
        data: data,
      );

      return response.data['success'] == true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> updateComment(String commentId, String text) async {
    try {
      final response = await _apiService.put(
        '/knowledge-base/comments/$commentId',
        data: {'text': text},
      );

      return response.data['success'] == true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> deleteComment(String commentId) async {
    try {
      final response =
          await _apiService.delete('/knowledge-base/comments/$commentId');

      return response.data['success'] == true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> likeComment(String commentId) async {
    try {
      final response =
          await _apiService.post('/knowledge-base/comments/$commentId/like');

      return response.data['success'] == true;
    } catch (e) {
      return false;
    }
  }
}

