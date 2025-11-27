import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import '../../providers/auth_provider.dart';
import '../../../core/validators/login_validator.dart';
import '../../../data/services/api_service.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _loginController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  String? _selectedCity;
  String? _selectedPosition;
  bool _isLoading = false;
  bool _loginChecking = false;
  bool? _loginAvailable;
  Timer? _loginCheckTimer;

  List<Map<String, dynamic>> _cities = [];
  List<Map<String, dynamic>> _positions = [];

  @override
  void initState() {
    super.initState();
    _loadCitiesAndPositions();
    _loginController.addListener(_onLoginChanged);
  }

  void _onLoginChanged() {
    _loginCheckTimer?.cancel();
    _loginCheckTimer = Timer(const Duration(milliseconds: 500), () {
      _checkLoginAvailability();
    });
  }

  Future<void> _loadCitiesAndPositions() async {
    try {
      final apiService = ApiService();
      final citiesResponse = await apiService.get('/cities');
      final positionsResponse = await apiService.get('/positions');

      if (mounted) {
        setState(() {
          _cities = List<Map<String, dynamic>>.from(
            citiesResponse.data['data'] ?? [],
          );
          _positions = List<Map<String, dynamic>>.from(
            positionsResponse.data['data'] ?? [],
          );
        });
      }
    } catch (e) {
      print('Error loading cities/positions: $e');
    }
  }

  Future<void> _checkLoginAvailability() async {
    final login = _loginController.text.trim();
    
    if (login.isEmpty || login.length < 3) {
      setState(() {
        _loginAvailable = null;
      });
      return;
    }

    final validation = LoginValidator.validate(login);
    if (!validation.isValid) {
      setState(() {
        _loginAvailable = false;
      });
      return;
    }

    setState(() {
      _loginChecking = true;
      _loginAvailable = null;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final available = await authProvider.checkLoginAvailability(login);
      
      if (mounted) {
        setState(() {
          _loginAvailable = available;
          _loginChecking = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loginAvailable = null;
          _loginChecking = false;
        });
      }
    }
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_selectedCity == null || _selectedPosition == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Виберіть місто та посаду'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (_loginAvailable == false) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Логін вже зайнятий'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.register(
      firstName: _firstNameController.text.trim(),
      lastName: _lastNameController.text.trim(),
      login: _loginController.text.trim(),
      password: _passwordController.text.trim(),
      city: _selectedCity!,
      position: _selectedPosition!,
    );

    setState(() {
      _isLoading = false;
    });

    if (!mounted) return;

    if (!success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Помилка при реєстрації. Спробуйте ще раз.'),
          backgroundColor: Colors.red,
        ),
      );
    }
    // Навігація буде виконана автоматично через AuthProvider
  }

  @override
  void dispose() {
    _loginCheckTimer?.cancel();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _loginController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Реєстрація'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextFormField(
                  controller: _firstNameController,
                  decoration: const InputDecoration(
                    labelText: 'Ім\'я',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.person),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Введіть ім\'я';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _lastNameController,
                  decoration: const InputDecoration(
                    labelText: 'Прізвище',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Введіть прізвище';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _loginController,
                  decoration: const InputDecoration(
                    labelText: 'Логін',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.alternate_email),
                  ),
                  textCapitalization: TextCapitalization.none,
                  autocorrect: false,
                  validator: (value) {
                    final result = LoginValidator.validate(value);
                    return result.isValid ? null : result.message;
                  },
                ),
                if (_loginController.text.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  _buildLoginStatus(),
                ],
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  decoration: const InputDecoration(
                    labelText: 'Пароль',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.lock),
                  ),
                  obscureText: true,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Введіть пароль';
                    }
                    if (value.length < 6) {
                      return 'Пароль має містити мінімум 6 символів';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _confirmPasswordController,
                  decoration: const InputDecoration(
                    labelText: 'Підтвердження пароля',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.lock_outline),
                  ),
                  obscureText: true,
                  validator: (value) {
                    if (value != _passwordController.text) {
                      return 'Паролі не співпадають';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _selectedCity,
                  decoration: const InputDecoration(
                    labelText: 'Місто *',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.location_city),
                  ),
                  items: _cities.map((city) {
                    final cityId = (city['_id'] ?? city['id'] ?? '').toString();
                    return DropdownMenuItem<String>(
                      value: cityId,
                      child: Text(city['name'] ?? ''),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedCity = value;
                    });
                  },
                  validator: (value) {
                    if (value == null) {
                      return 'Виберіть місто';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _selectedPosition,
                  decoration: const InputDecoration(
                    labelText: 'Посада *',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.work),
                  ),
                  items: _positions.map((position) {
                    final positionId = (position['_id'] ?? position['id'] ?? '').toString();
                    return DropdownMenuItem<String>(
                      value: positionId,
                      child: Text(position['name'] ?? ''),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedPosition = value;
                    });
                  },
                  validator: (value) {
                    if (value == null) {
                      return 'Виберіть посаду';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _isLoading ? null : _handleRegister,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text(
                          'Зареєструватися',
                          style: TextStyle(fontSize: 16),
                        ),
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () {
                    Navigator.pushReplacementNamed(context, '/login');
                  },
                  child: const Text('Вже є акаунт? Увійти'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoginStatus() {
    if (_loginChecking) {
      return const Row(
        children: [
          SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
          SizedBox(width: 8),
          Text(
            'Перевірка...',
            style: TextStyle(fontSize: 12, color: Colors.grey),
          ),
        ],
      );
    }

    if (_loginAvailable == true) {
      return const Row(
        children: [
          Icon(Icons.check_circle, color: Colors.green, size: 16),
          SizedBox(width: 8),
          Text(
            'Логін доступний',
            style: TextStyle(fontSize: 12, color: Colors.green),
          ),
        ],
      );
    }

    if (_loginAvailable == false) {
      return const Row(
        children: [
          Icon(Icons.cancel, color: Colors.red, size: 16),
          SizedBox(width: 8),
          Text(
            'Логін вже зайнятий',
            style: TextStyle(fontSize: 12, color: Colors.red),
          ),
        ],
      );
    }

    return const SizedBox.shrink();
  }
}

