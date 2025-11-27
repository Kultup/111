import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';

class AuthRepository {
  final ApiService _apiService = ApiService();
  static const String _tokenKey = 'token';
  static const String _userKey = 'user';
  static const String _rememberedLoginKey = 'remembered_login';

  Future<AuthResult> login(String login, String password, {bool rememberMe = false}) async {
    try {
      final response = await _apiService.post(
        '/auth/login',
        data: {
          'login': login.trim(),
          'password': password.trim(),
        },
      );

      if (response.data['success'] == true) {
        final token = response.data['token'];
        final userJson = response.data['user'];
        
        if (token == null || userJson == null) {
          return AuthResult(
            success: false,
            message: 'Помилка: відсутній токен або дані користувача',
          );
        }

        // Переконатися, що token є String
        final tokenString = token is String ? token : token.toString();
        
        // Обробити userJson - переконатися, що це Map
        Map<String, dynamic> processedUserJson;
        if (userJson is Map<String, dynamic>) {
          processedUserJson = Map<String, dynamic>.from(userJson);
          // UserModel.fromJson сам обробить city та position правильно (взяти name з об'єктів)
        } else {
          return AuthResult(
            success: false,
            message: 'Помилка: некоректний формат даних користувача',
          );
        }

        final user = UserModel.fromJson(processedUserJson);
        
        // Зберегти токен та користувача
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_tokenKey, tokenString);
        // Зберегти user як JSON string (з обробленими city та position як назви)
        final userJsonForStorage = {
          'id': user.id,
          'firstName': user.firstName,
          'lastName': user.lastName,
          'login': user.login,
          'city': user.city,
          'position': user.position,
          'coins': user.coins,
          'role': user.role,
        };
        await prefs.setString(_userKey, jsonEncode(userJsonForStorage));
        
        // Зберегти час закриття додатку
        await prefs.setString('last_app_close_time', DateTime.now().millisecondsSinceEpoch.toString());
        
        // Зберегти логін якщо вибрано "Запам'ятати мене"
        if (rememberMe) {
          await prefs.setString(_rememberedLoginKey, login);
        } else {
          await prefs.remove(_rememberedLoginKey);
        }

        return AuthResult(
          success: true,
          token: tokenString,
          user: user,
        );
      } else {
        return AuthResult(
          success: false,
          message: response.data['message'] ?? 'Помилка при вході',
        );
      }
    } catch (e) {
      print('Login error: $e');
      return AuthResult(
        success: false,
        message: 'Помилка при вході. Спробуйте ще раз.',
      );
    }
  }

  Future<AuthResult> register({
    required String firstName,
    required String lastName,
    required String login,
    required String password,
    required String city,
    required String position,
  }) async {
    try {
      final response = await _apiService.post(
        '/auth/register',
        data: {
          'firstName': firstName.trim(),
          'lastName': lastName.trim(),
          'login': login.trim(),
          'password': password.trim(),
          'city': city,
          'position': position,
        },
      );

      if (response.data['success'] == true) {
        final token = response.data['token'];
        final userJson = response.data['user'];
        
        if (token == null || userJson == null) {
          return AuthResult(
            success: false,
            message: 'Помилка: відсутній токен або дані користувача',
          );
        }

        // Переконатися, що token є String
        final tokenString = token is String ? token : token.toString();
        
        // Обробити userJson - переконатися, що це Map
        Map<String, dynamic> processedUserJson;
        if (userJson is Map<String, dynamic>) {
          processedUserJson = Map<String, dynamic>.from(userJson);
          // UserModel.fromJson сам обробить city та position правильно (взяти name з об'єктів)
        } else {
          return AuthResult(
            success: false,
            message: 'Помилка: некоректний формат даних користувача',
          );
        }

        final user = UserModel.fromJson(processedUserJson);
        
        // Зберегти токен та користувача
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_tokenKey, tokenString);
        // Зберегти user як JSON string (з обробленими city та position як назви)
        final userJsonForStorage = {
          'id': user.id,
          'firstName': user.firstName,
          'lastName': user.lastName,
          'login': user.login,
          'city': user.city,
          'position': user.position,
          'coins': user.coins,
          'role': user.role,
        };
        await prefs.setString(_userKey, jsonEncode(userJsonForStorage));

        return AuthResult(
          success: true,
          token: tokenString,
          user: user,
        );
      } else {
        return AuthResult(
          success: false,
          message: response.data['message'] ?? 'Помилка при реєстрації',
        );
      }
    } catch (e) {
      print('Register error: $e');
      String message = 'Помилка при реєстрації';
      if (e.toString().contains('login')) {
        message = 'Логін вже зайнятий';
      }
      return AuthResult(
        success: false,
        message: message,
      );
    }
  }

  Future<AuthResult> getCurrentUser() async {
    try {
      final response = await _apiService.get('/auth/me');
      if (response.data['success'] == true) {
        final userJson = response.data['user'];
        
        // Обробити userJson - переконатися, що це Map
        Map<String, dynamic> processedUserJson;
        if (userJson is Map<String, dynamic>) {
          processedUserJson = Map<String, dynamic>.from(userJson);
          // UserModel.fromJson сам обробить city та position правильно
        } else {
          return AuthResult(
            success: false,
            message: 'Помилка: некоректний формат даних користувача',
          );
        }
        
        final user = UserModel.fromJson(processedUserJson);
        return AuthResult(
          success: true,
          user: user,
        );
      } else {
        return AuthResult(
          success: false,
          message: response.data['message'] ?? 'Помилка при отриманні даних',
        );
      }
    } catch (e) {
      return AuthResult(
        success: false,
        message: 'Помилка при отриманні даних',
      );
    }
  }

  Future<bool> checkLoginAvailability(String login) async {
    try {
      final response = await _apiService.get(
        '/auth/check-login',
        queryParameters: {'login': login},
      );
      return response.data['available'] ?? false;
    } catch (e) {
      return false;
    }
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  Future<String?> getRememberedLogin() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_rememberedLoginKey);
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }
}

class AuthResult {
  final bool success;
  final String? token;
  final UserModel? user;
  final String? message;

  AuthResult({
    required this.success,
    this.token,
    this.user,
    this.message,
  });
}

