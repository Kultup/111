class LoginValidator {
  // Уніфікована валідація логіну (така ж як на backend)
  static ValidationResult validate(String? login) {
    if (login == null || login.isEmpty) {
      return ValidationResult(
        isValid: false,
        message: 'Логін обов\'язковий',
      );
    }

    final trimmedLogin = login.trim();

    if (trimmedLogin.length < 3) {
      return ValidationResult(
        isValid: false,
        message: 'Логін має містити мінімум 3 символи',
      );
    }

    if (trimmedLogin.length > 30) {
      return ValidationResult(
        isValid: false,
        message: 'Логін має містити максимум 30 символів',
      );
    }

    final loginRegex = RegExp(r'^[a-zA-Z0-9_]{3,30}$');
    if (!loginRegex.hasMatch(trimmedLogin)) {
      return ValidationResult(
        isValid: false,
        message: 'Логін може містити тільки латинські літери, цифри та підкреслення',
      );
    }

    return ValidationResult(isValid: true);
  }
}

class ValidationResult {
  final bool isValid;
  final String? message;

  ValidationResult({
    required this.isValid,
    this.message,
  });
}

