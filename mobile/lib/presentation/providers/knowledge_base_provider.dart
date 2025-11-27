import 'package:flutter/foundation.dart';
import '../../data/models/knowledge_article_model.dart';
import '../../data/repositories/knowledge_base_repository.dart';
import 'auth_provider.dart';

class KnowledgeBaseProvider with ChangeNotifier {
  final KnowledgeBaseRepository _repository = KnowledgeBaseRepository();
  AuthProvider? _authProvider;

  KnowledgeBaseProvider(this._authProvider);

  void setAuthProvider(AuthProvider authProvider) {
    _authProvider = authProvider;
  }

  // Стан доступу до бази знань
  bool _isAccessEnabled = true;
  bool _isCheckingAccess = false;

  // Статті та категорії
  List<KnowledgeArticleModel> _articles = [];
  List<Map<String, dynamic>> _categories = [];
  String? _selectedCategoryId;
  bool _isLoadingArticles = false;
  bool _isLoadingCategories = false;
  String? _errorMessage;

  // Пошук
  String _searchQuery = '';
  List<KnowledgeArticleModel> _searchResults = [];
  bool _isSearching = false;

  // Закладки
  List<String> _bookmarks = [];
  bool _isLoadingBookmarks = false;

  // Коментарі
  Map<String, List<Map<String, dynamic>>> _comments = {}; // articleId -> comments
  Map<String, bool> _isLoadingComments = {}; // articleId -> isLoading

  // Пагінація
  int _currentPage = 1;
  bool _hasMore = true;

  // Getters
  bool get isAccessEnabled => _isAccessEnabled;
  bool get isCheckingAccess => _isCheckingAccess;
  List<KnowledgeArticleModel> get articles => _articles;
  List<Map<String, dynamic>> get categories => _categories;
  String? get selectedCategoryId => _selectedCategoryId;
  bool get isLoadingArticles => _isLoadingArticles;
  bool get isLoadingCategories => _isLoadingCategories;
  String? get errorMessage => _errorMessage;
  String get searchQuery => _searchQuery;
  List<KnowledgeArticleModel> get searchResults => _searchResults;
  bool get isSearching => _isSearching;
  List<String> get bookmarks => _bookmarks;
  bool get isLoadingBookmarks => _isLoadingBookmarks;
  bool get hasMore => _hasMore;

  // Перевірка доступу до бази знань
  Future<void> checkAccessStatus() async {
    if (_isCheckingAccess) return; // Вже перевіряється
    
    _isCheckingAccess = true;
    if (hasListeners) {
      notifyListeners();
    }

    try {
      _isAccessEnabled = await _repository.getAccessStatus();
    } catch (e) {
      // За замовчуванням доступ відкритий
      _isAccessEnabled = true;
    } finally {
      _isCheckingAccess = false;
      if (hasListeners) {
        notifyListeners();
      }
    }
  }

  // Завантаження категорій
  Future<void> loadCategories() async {
    _isLoadingCategories = true;
    _errorMessage = null;
    if (hasListeners) {
      notifyListeners();
    }

    try {
      _categories = await _repository.getCategories();
    } catch (e) {
      _errorMessage = 'Помилка завантаження категорій';
    }

    _isLoadingCategories = false;
    if (hasListeners) {
      notifyListeners();
    }
  }

  // Встановлення вибраної категорії
  void setSelectedCategory(String? categoryId) {
    _selectedCategoryId = categoryId;
    _currentPage = 1;
    _hasMore = true;
    loadArticles();
  }

  // Завантаження статей
  Future<void> loadArticles({bool refresh = false}) async {
    if (refresh) {
      _currentPage = 1;
      _hasMore = true;
      _articles = [];
    }

    if (!_hasMore && !refresh) return;

    _isLoadingArticles = true;
    _errorMessage = null;
    if (hasListeners) {
      notifyListeners();
    }

    try {
      // Використовуємо positionId замість position (назви)
      final userPositionId = _authProvider?.user?.positionId;
      final newArticles = await _repository.getArticles(
        categoryId: _selectedCategoryId,
        searchQuery: _searchQuery.isNotEmpty ? _searchQuery : null,
        page: _currentPage,
        userPositionId: userPositionId,
      );

      if (refresh) {
        _articles = newArticles;
      } else {
        _articles.addAll(newArticles);
      }

      _hasMore = newArticles.length >= 20; // Якщо менше 20 - більше немає
      if (_hasMore) {
        _currentPage++;
      }
    } catch (e) {
      _errorMessage = 'Помилка завантаження статей';
    }

    _isLoadingArticles = false;
    if (hasListeners) {
      notifyListeners();
    }
  }

  // Пошук статей
  Future<void> searchArticles(String query) async {
    _searchQuery = query;
    _isSearching = true;
    _errorMessage = null;
    if (hasListeners) {
      notifyListeners();
    }

    try {
      // Використовуємо positionId замість position (назви)
      final userPositionId = _authProvider?.user?.positionId;
      _searchResults = await _repository.searchArticles(
        query,
        userPositionId: userPositionId,
      );
    } catch (e) {
      _errorMessage = 'Помилка пошуку статей';
      _searchResults = [];
    }

    _isSearching = false;
    if (hasListeners) {
      notifyListeners();
    }
  }

  // Очищення пошуку
  void clearSearch() {
    _searchQuery = '';
    _searchResults = [];
    _isSearching = false;
    _currentPage = 1;
    _hasMore = true;
    loadArticles(refresh: true);
  }

  // Завантаження закладок
  Future<void> loadBookmarks() async {
    _isLoadingBookmarks = true;
    if (hasListeners) {
      notifyListeners();
    }

    try {
      _bookmarks = await _repository.getBookmarks();
    } catch (e) {
      _bookmarks = [];
    }

    _isLoadingBookmarks = false;
    if (hasListeners) {
      notifyListeners();
    }
  }

  // Додавання в закладки
  Future<bool> addBookmark(String articleId) async {
    try {
      final success = await _repository.addBookmark(articleId);
      if (success) {
        if (!_bookmarks.contains(articleId)) {
          _bookmarks.add(articleId);
        }
        if (hasListeners) {
          notifyListeners();
        }
      }
      return success;
    } catch (e) {
      return false;
    }
  }

  // Видалення з закладок
  Future<bool> removeBookmark(String articleId) async {
    try {
      final success = await _repository.removeBookmark(articleId);
      if (success) {
        _bookmarks.remove(articleId);
        if (hasListeners) {
          notifyListeners();
        }
      }
      return success;
    } catch (e) {
      return false;
    }
  }

  // Перевірка, чи є стаття в закладках
  Future<bool> isBookmarked(String articleId) async {
    return await _repository.isBookmarked(articleId);
  }

  // Завантаження коментарів
  Future<void> loadComments(String articleId) async {
    try {
      _isLoadingComments[articleId] = true;
      if (hasListeners) {
        notifyListeners();
      }
    } catch (e) {
      // Ігноруємо помилки при оновленні стану під час навігації
      return;
    }

    try {
      final comments = await _repository.getComments(articleId);
      _comments[articleId] = comments;
    } catch (e) {
      _comments[articleId] = [];
    }

    try {
      _isLoadingComments[articleId] = false;
      if (hasListeners) {
        notifyListeners();
      }
    } catch (e) {
      // Ігноруємо помилки при оновленні стану під час навігації
    }
  }

  // Перевірка чи завантажуються коментарі для статті
  bool isLoadingComments(String articleId) {
    return _isLoadingComments[articleId] ?? false;
  }

  // Отримання коментарів для статті
  List<Map<String, dynamic>> getComments(String articleId) {
    return _comments[articleId] ?? [];
  }

  // Додавання коментаря
  Future<bool> addComment(String articleId, String text,
      {String? parentCommentId}) async {
    try {
      final success = await _repository.addComment(
        articleId,
        text,
        parentCommentId: parentCommentId,
      );
      if (success) {
        await loadComments(articleId);
      }
      return success;
    } catch (e) {
      return false;
    }
  }

  // Оновлення коментаря
  Future<bool> updateComment(String commentId, String articleId, String text) async {
    try {
      final success = await _repository.updateComment(commentId, text);
      if (success) {
        await loadComments(articleId);
      }
      return success;
    } catch (e) {
      return false;
    }
  }

  // Видалення коментаря
  Future<bool> deleteComment(String commentId, String articleId) async {
    try {
      final success = await _repository.deleteComment(commentId);
      if (success) {
        await loadComments(articleId);
      }
      return success;
    } catch (e) {
      return false;
    }
  }

  // Лайк коментаря
  Future<bool> likeComment(String commentId, String articleId) async {
    try {
      final success = await _repository.likeComment(commentId);
      if (success) {
        try {
          await loadComments(articleId);
        } catch (e) {
          // Ігноруємо помилки при оновленні коментарів під час навігації
          return success;
        }
      }
      return success;
    } catch (e) {
      return false;
    }
  }

  // Очищення стану
  void clear() {
    _articles = [];
    _searchResults = [];
    _searchQuery = '';
    _selectedCategoryId = null;
    _currentPage = 1;
    _hasMore = true;
    _errorMessage = null;
    if (hasListeners) {
      notifyListeners();
    }
  }
}

