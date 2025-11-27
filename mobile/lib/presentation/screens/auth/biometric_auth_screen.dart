import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:local_auth/local_auth.dart';
import '../../providers/auth_provider.dart';
import '../../../data/services/biometric_service.dart';

class BiometricAuthScreen extends StatefulWidget {
  final VoidCallback? onSuccess;

  const BiometricAuthScreen({
    super.key,
    this.onSuccess,
  });

  @override
  State<BiometricAuthScreen> createState() => _BiometricAuthScreenState();
}

class _BiometricAuthScreenState extends State<BiometricAuthScreen> {
  final BiometricService _biometricService = BiometricService();
  bool _isAuthenticating = false;
  String? _errorMessage;
  List<BiometricType> _availableBiometrics = [];

  @override
  void initState() {
    super.initState();
    _checkBiometrics();
    // Автоматично почати автентифікацію
    Future.delayed(const Duration(milliseconds: 300), () {
      _authenticate();
    });
  }

  Future<void> _checkBiometrics() async {
    final biometrics = await _biometricService.getAvailableBiometrics();
    if (mounted) {
      setState(() {
        _availableBiometrics = biometrics;
      });
    }
  }

  Future<void> _authenticate() async {
    if (_isAuthenticating) return;

    setState(() {
      _isAuthenticating = true;
      _errorMessage = null;
    });

    final result = await _biometricService.authenticate(
      localizedReason: 'Підтвердіть свою особу для входу в додаток',
      useErrorDialogs: true,
      stickyAuth: true,
      biometricOnly: false,
    );

    if (!mounted) return;

    if (result.success) {
      // Успішна автентифікація
      if (widget.onSuccess != null) {
        // Якщо є callback - викликати його
        widget.onSuccess!();
      } else {
        // Інакше - перейти на головну
        context.go('/');
      }
    } else {
      setState(() {
        _isAuthenticating = false;
        _errorMessage = result.errorMessage;
      });

      // Якщо біометрія недоступна або не налаштована - показати опції
      if (result.errorCode == BiometricErrorCode.notAvailable ||
          result.errorCode == BiometricErrorCode.notEnrolled) {
        _showFallbackOptions();
      }
    }
  }

  void _showFallbackOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.password),
                title: const Text('Увійти з паролем'),
                onTap: () {
                  Navigator.pop(context);
                  context.go('/login');
                },
              ),
              ListTile(
                leading: const Icon(Icons.settings),
                title: const Text('Налаштувати біометрію'),
                subtitle: const Text('Відкрити системні налаштування'),
                onTap: () {
                  Navigator.pop(context);
                  // TODO: Відкрити системні налаштування
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Будь ласка, налаштуйте біометрію в системних налаштуваннях'),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  IconData _getBiometricIcon() {
    if (_availableBiometrics.contains(BiometricType.face)) {
      return Icons.face;
    } else if (_availableBiometrics.contains(BiometricType.fingerprint)) {
      return Icons.fingerprint;
    } else {
      return Icons.security;
    }
  }

  String _getBiometricText() {
    return _biometricService.getBiometricTypeText(_availableBiometrics);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white.withOpacity(0.95), // Напівпрозорий білий фон
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                // Іконка біометрії
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  color: Theme.of(context).primaryColor.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  _getBiometricIcon(),
                  size: 60,
                  color: Theme.of(context).primaryColor,
                ),
              ),
              
              const SizedBox(height: 32),
              
              // Заголовок
              Text(
                'Вхід через ${_getBiometricText()}',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 16),
              
              // Опис
              Text(
                'Підтвердіть свою особу для входу в додаток',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[600],
                ),
                textAlign: TextAlign.center,
              ),
              
              const SizedBox(height: 32),
              
              // Помилка (якщо є)
              if (_errorMessage != null)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.red.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Colors.red),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(color: Colors.red),
                        ),
                      ),
                    ],
                  ),
                ),
              
              const SizedBox(height: 32),
              
              // Кнопка спробувати знову
              if (!_isAuthenticating && _errorMessage != null)
                ElevatedButton.icon(
                  onPressed: _authenticate,
                  icon: Icon(_getBiometricIcon()),
                  label: const Text('Спробувати знову'),
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 56),
                    backgroundColor: Theme.of(context).primaryColor,
                    foregroundColor: Colors.white,
                  ),
                ),
              
              // Індикатор завантаження
              if (_isAuthenticating)
                const Padding(
                  padding: EdgeInsets.only(top: 24),
                  child: CircularProgressIndicator(),
                ),
              
              const SizedBox(height: 32),
              
              // Кнопка використати пароль
              TextButton(
                onPressed: () {
                  context.go('/login');
                },
                child: const Text('Увійти з паролем'),
              ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

