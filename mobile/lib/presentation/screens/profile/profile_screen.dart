import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../../data/services/biometric_service.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final BiometricService _biometricService = BiometricService();
  bool _biometricAvailable = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _checkBiometric();
  }

  Future<void> _checkBiometric() async {
    final available = await _biometricService.isBiometricAvailable();
    if (mounted) {
      setState(() {
        _biometricAvailable = available;
      });
    }
  }

  Future<void> _toggleBiometric(bool value) async {
    if (!_biometricAvailable) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Біометрична автентифікація недоступна на цьому пристрої'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (value) {
      // Увімкнути - спершу перевірити біометрію
      setState(() {
        _isLoading = true;
      });

      final result = await _biometricService.authenticate(
        localizedReason: 'Підтвердіть свою особу для увімкнення біометричного входу',
        biometricOnly: false,
      );

      setState(() {
        _isLoading = false;
      });

      if (result.success) {
        final authProvider = Provider.of<AuthProvider>(context, listen: false);
        await authProvider.setBiometricEnabled(true);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Біометричний вхід увімкнено'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result.errorMessage ?? 'Помилка автентифікації'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } else {
      // Вимкнути
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      await authProvider.setBiometricEnabled(false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Біометричний вхід вимкнено'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Профіль'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/'),
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Інформація про користувача
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Інформація профілю',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildInfoRow('Ім\'я', '${user?.firstName ?? ''} ${user?.lastName ?? ''}'),
                    _buildInfoRow('Логін', user?.login ?? ''),
                    _buildInfoRow('Місто', user?.city ?? 'Не вказано'),
                    _buildInfoRow('Посада', user?.position ?? 'Не вказано'),
                    _buildInfoRow('Монети', '${user?.coins ?? 0} 🪙'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Налаштування безпеки
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Безпека',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // Біометрична автентифікація
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Біометричний вхід'),
                      subtitle: Text(
                        _biometricAvailable
                            ? 'Використовувати Face ID/Touch ID/Fingerprint для входу'
                            : 'Біометрія недоступна на цьому пристрої',
                      ),
                      value: authProvider.biometricEnabled,
                      onChanged: _biometricAvailable && !_isLoading ? _toggleBiometric : null,
                      secondary: _isLoading
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Icon(
                              _biometricAvailable ? Icons.fingerprint : Icons.fingerprint_outlined,
                              color: _biometricAvailable ? Theme.of(context).primaryColor : Colors.grey,
                            ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Кнопка виходу
            ElevatedButton.icon(
              onPressed: () async {
                await authProvider.logout();
                if (context.mounted) {
                  context.go('/login');
                }
              },
              icon: const Icon(Icons.logout),
              label: const Text('Вийти'),
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(double.infinity, 56),
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: Colors.grey[700],
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 16),
            ),
          ),
        ],
      ),
    );
  }
}

