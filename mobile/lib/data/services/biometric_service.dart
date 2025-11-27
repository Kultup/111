import 'package:local_auth/local_auth.dart';
import 'package:local_auth/error_codes.dart' as auth_error;
import 'package:flutter/services.dart';

/// Сервіс для роботи з біометричною автентифікацією
/// Підтримує Face ID, Touch ID, Fingerprint
class BiometricService {
  final LocalAuthentication _auth = LocalAuthentication();

  /// Перевірити чи доступна біометрична автентифікація на пристрої
  Future<bool> canCheckBiometrics() async {
    try {
      return await _auth.canCheckBiometrics;
    } catch (e) {
      print('Error checking biometrics: $e');
      return false;
    }
  }

  /// Перевірити чи пристрій підтримує біометрію взагалі
  Future<bool> isDeviceSupported() async {
    try {
      return await _auth.isDeviceSupported();
    } catch (e) {
      print('Error checking device support: $e');
      return false;
    }
  }

  /// Отримати список доступних типів біометрії
  /// Може повернути: face, fingerprint, iris, weak, strong
  Future<List<BiometricType>> getAvailableBiometrics() async {
    try {
      return await _auth.getAvailableBiometrics();
    } catch (e) {
      print('Error getting available biometrics: $e');
      return [];
    }
  }

  /// Перевірити чи налаштована біометрія на пристрої
  Future<bool> isBiometricAvailable() async {
    try {
      final canCheck = await canCheckBiometrics();
      final isSupported = await isDeviceSupported();
      
      if (!canCheck || !isSupported) {
        return false;
      }

      final availableBiometrics = await getAvailableBiometrics();
      return availableBiometrics.isNotEmpty;
    } catch (e) {
      print('Error checking biometric availability: $e');
      return false;
    }
  }

  /// Отримати текст для діалогу біометричної автентифікації
  String getBiometricTypeText(List<BiometricType> types) {
    if (types.contains(BiometricType.face)) {
      return 'Face ID';
    } else if (types.contains(BiometricType.fingerprint)) {
      return 'Fingerprint';
    } else if (types.contains(BiometricType.iris)) {
      return 'Iris';
    } else {
      return 'Біометрія';
    }
  }

  /// Виконати біометричну автентифікацію
  /// 
  /// [localizedReason] - текст, який буде показано користувачу
  /// [useErrorDialogs] - показувати системні діалоги помилок
  /// [stickyAuth] - зберігати автентифікацію при переході додатку в background
  /// [biometricOnly] - використовувати тільки біометрію (без PIN/Pattern fallback)
  Future<BiometricAuthResult> authenticate({
    String localizedReason = 'Підтвердіть свою особу',
    bool useErrorDialogs = true,
    bool stickyAuth = true,
    bool biometricOnly = false,
  }) async {
    try {
      // Перевірити доступність
      final isAvailable = await isBiometricAvailable();
      if (!isAvailable) {
        return BiometricAuthResult(
          success: false,
          errorMessage: 'Біометрична автентифікація недоступна на цьому пристрої',
          errorCode: BiometricErrorCode.notAvailable,
        );
      }

      // Виконати автентифікацію
      final authenticated = await _auth.authenticate(
        localizedReason: localizedReason,
        options: AuthenticationOptions(
          useErrorDialogs: useErrorDialogs,
          stickyAuth: stickyAuth,
          biometricOnly: biometricOnly,
        ),
      );

      if (authenticated) {
        return BiometricAuthResult(success: true);
      } else {
        return BiometricAuthResult(
          success: false,
          errorMessage: 'Автентифікація скасована користувачем',
          errorCode: BiometricErrorCode.userCanceled,
        );
      }
    } on PlatformException catch (e) {
      print('Biometric authentication error: ${e.code} - ${e.message}');
      
      // Обробити різні типи помилок
      BiometricErrorCode errorCode;
      String errorMessage;

      switch (e.code) {
        case auth_error.notAvailable:
          errorCode = BiometricErrorCode.notAvailable;
          errorMessage = 'Біометрична автентифікація недоступна';
          break;
        case auth_error.notEnrolled:
          errorCode = BiometricErrorCode.notEnrolled;
          errorMessage = 'Біометрія не налаштована. Будь ласка, налаштуйте її в системних налаштуваннях';
          break;
        case auth_error.lockedOut:
          errorCode = BiometricErrorCode.lockedOut;
          errorMessage = 'Забагато невдалих спроб. Спробуйте пізніше';
          break;
        case auth_error.permanentlyLockedOut:
          errorCode = BiometricErrorCode.permanentlyLockedOut;
          errorMessage = 'Біометрична автентифікація заблокована. Використайте PIN або пароль';
          break;
        case 'PasscodeNotSet':
          errorCode = BiometricErrorCode.passcodeNotSet;
          errorMessage = 'PIN-код не встановлено на пристрої';
          break;
        default:
          errorCode = BiometricErrorCode.unknown;
          errorMessage = e.message ?? 'Помилка автентифікації';
      }

      return BiometricAuthResult(
        success: false,
        errorMessage: errorMessage,
        errorCode: errorCode,
      );
    } catch (e) {
      print('Unexpected biometric error: $e');
      return BiometricAuthResult(
        success: false,
        errorMessage: 'Несподівана помилка: $e',
        errorCode: BiometricErrorCode.unknown,
      );
    }
  }

  /// Зупинити автентифікацію (якщо вона в процесі)
  Future<void> stopAuthentication() async {
    try {
      await _auth.stopAuthentication();
    } catch (e) {
      print('Error stopping authentication: $e');
    }
  }
}

/// Результат біометричної автентифікації
class BiometricAuthResult {
  final bool success;
  final String? errorMessage;
  final BiometricErrorCode? errorCode;

  BiometricAuthResult({
    required this.success,
    this.errorMessage,
    this.errorCode,
  });
}

/// Коди помилок біометричної автентифікації
enum BiometricErrorCode {
  notAvailable,
  notEnrolled,
  lockedOut,
  permanentlyLockedOut,
  passcodeNotSet,
  userCanceled,
  unknown,
}

