import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../data/models/user_model.dart';
import '../../data/repositories/auth_repository.dart';

class AuthProvider with ChangeNotifier {
  final AuthRepository _authRepository = AuthRepository();
  
  UserModel? _user;
  bool _isAuthenticated = false;
  bool _isLoading = true;
  bool _biometricEnabled = false;
  bool _biometricVerified = false; // Чи пройшов біометрію в поточній сесії

  UserModel? get user => _user;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  bool get biometricEnabled => _biometricEnabled;
  bool get biometricVerified => _biometricVerified;

  AuthProvider() {
    _checkAuth();
    _loadBiometricSettings();
  }

  Future<void> _loadBiometricSettings() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _biometricEnabled = prefs.getBool('biometric_enabled') ?? false;
      notifyListeners();
    } catch (e) {
      print('Error loading biometric settings: $e');
    }
  }

  Future<void> _checkAuth() async {
    await checkAuth();
  }

  /// Публічний метод для перевірки та оновлення авторизації
  Future<void> checkAuth() async {
    try {
      _isLoading = true;
      notifyListeners();

      // Завантажити налаштування біометрії
      await _loadBiometricSettings();

      final token = await _authRepository.getToken();
      if (token != null) {
        final result = await _authRepository.getCurrentUser();
        if (result.success && result.user != null) {
          _user = result.user;
          _isAuthenticated = true;
        } else {
          await _authRepository.logout();
          _user = null;
          _isAuthenticated = false;
        }
      } else {
        _user = null;
        _isAuthenticated = false;
      }
    } catch (e) {
      print('Auth check error: $e');
      _user = null;
      _isAuthenticated = false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Увімкнути/вимкнути біометричну автентифікацію
  Future<void> setBiometricEnabled(bool enabled) async {
    print('AuthProvider: setBiometricEnabled called with $enabled (current: $_biometricEnabled, verified: $_biometricVerified)');
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('biometric_enabled', enabled);
      _biometricEnabled = enabled;
      if (enabled) {
        print('AuthProvider: Biometric enabled, setting biometricVerified = true');
        _biometricVerified = true; // Якщо тільки що увімкнули - вважаємо що верифікували
      }
      print('AuthProvider: Calling notifyListeners() after setBiometricEnabled');
      notifyListeners();
    } catch (e) {
      print('Error setting biometric enabled: $e');
      rethrow;
    }
  }

  /// Позначити що користувач пройшов біометричну верифікацію
  void setBiometricVerified(bool verified) {
    print('AuthProvider: setBiometricVerified called with $verified (current: $_biometricVerified)');
    if (_biometricVerified != verified) {
      _biometricVerified = verified;
      print('AuthProvider: biometricVerified changed to $verified, calling notifyListeners()');
      notifyListeners();
    } else {
      print('AuthProvider: biometricVerified unchanged, skipping notifyListeners()');
    }
  }

  /// Скинути біометричну верифікацію (при logout або поверненні з background)
  void resetBiometricVerification() {
    print('AuthProvider: resetBiometricVerification called (current: $_biometricVerified)');
    if (_biometricVerified) {
      _biometricVerified = false;
      print('AuthProvider: Resetting biometricVerified to false, calling notifyListeners()');
      notifyListeners();
    } else {
      print('AuthProvider: biometricVerified already false, skipping notifyListeners()');
    }
  }

  Future<bool> login(String login, String password, {bool rememberMe = false}) async {
    try {
      _isLoading = true;
      notifyListeners();

      final result = await _authRepository.login(login, password, rememberMe: rememberMe);
      
      if (result.success && result.user != null) {
        _user = result.user;
        _isAuthenticated = true;
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      print('Login error: $e');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String firstName,
    required String lastName,
    required String login,
    required String password,
    required String city,
    required String position,
  }) async {
    try {
      _isLoading = true;
      notifyListeners();

      final result = await _authRepository.register(
        firstName: firstName,
        lastName: lastName,
        login: login,
        password: password,
        city: city,
        position: position,
      );
      
      if (result.success && result.user != null) {
        _user = result.user;
        _isAuthenticated = true;
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      print('Register error: $e');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _authRepository.logout();
    _user = null;
    _isAuthenticated = false;
    _biometricVerified = false; // Скинути біометричну верифікацію при logout
    notifyListeners();
  }

  void updateUser(UserModel user) {
    _user = user;
    notifyListeners();
  }

  Future<String?> getRememberedLogin() async {
    return await _authRepository.getRememberedLogin();
  }

  Future<bool> checkLoginAvailability(String login) async {
    return await _authRepository.checkLoginAvailability(login);
  }
}

