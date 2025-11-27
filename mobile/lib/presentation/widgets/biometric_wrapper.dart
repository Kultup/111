import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../screens/auth/biometric_auth_screen.dart';

/// Wrapper який показує біометричний екран якщо потрібна re-authentication
class BiometricWrapper extends StatefulWidget {
  final Widget child;

  const BiometricWrapper({
    super.key,
    required this.child,
  });

  @override
  State<BiometricWrapper> createState() => _BiometricWrapperState();
}

class _BiometricWrapperState extends State<BiometricWrapper> with WidgetsBindingObserver {
  bool _needsBiometricAuth = false;
  bool _hasChecked = false;
  bool? _lastAuthState;
  bool? _lastBiometricEnabled;
  bool? _lastBiometricVerified;
  bool _wasPaused = false; // Чи додаток був в стані paused

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Перевірити коли змінюється стан авторизації або біометрії
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    print('BiometricWrapper: didChangeDependencies - bioVerified: ${authProvider.biometricVerified}, _lastBiometricVerified: $_lastBiometricVerified');
    
    // Якщо біометрична верифікація змінилась - не робити нічого
    // це означає що користувач щойно пройшов біометрію
    if (_lastBiometricVerified != authProvider.biometricVerified) {
      print('BiometricWrapper: didChangeDependencies - biometricVerified changed from $_lastBiometricVerified to ${authProvider.biometricVerified}');
      _lastBiometricVerified = authProvider.biometricVerified;
      // Якщо тільки що верифікували - не перевіряти знову
      if (authProvider.biometricVerified) {
        print('BiometricWrapper: didChangeDependencies - biometric verified, returning early');
        return;
      }
    }
    
    // Якщо змінився стан авторизації
    if (_lastAuthState != authProvider.isAuthenticated) {
      print('BiometricWrapper: didChangeDependencies - auth state changed from $_lastAuthState to ${authProvider.isAuthenticated}');
      _lastAuthState = authProvider.isAuthenticated;
      if (authProvider.isAuthenticated && !authProvider.biometricVerified) {
        // Користувач щойно увійшов і не верифікований - перевірити чи потрібна біометрія
        print('BiometricWrapper: didChangeDependencies - user authenticated but not verified, checking biometric needed');
        _hasChecked = false; // Скинути прапорець
        _checkBiometricNeeded();
      }
    }
    
    // Якщо біометрію увімкнули/вимкнули
    if (_lastBiometricEnabled != authProvider.biometricEnabled) {
      print('BiometricWrapper: didChangeDependencies - biometric enabled changed from $_lastBiometricEnabled to ${authProvider.biometricEnabled}');
      _lastBiometricEnabled = authProvider.biometricEnabled;
      
      if (authProvider.biometricEnabled && authProvider.isAuthenticated && !authProvider.biometricVerified) {
        // Біометрію щойно увімкнули - перевірити чи потрібна біометрія
        print('BiometricWrapper: didChangeDependencies - biometric enabled, checking biometric needed');
        _hasChecked = false;
        _checkBiometricNeeded();
      }
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    print('BiometricWrapper: didChangeAppLifecycleState called with state: $state, _wasPaused: $_wasPaused');
    
    if (state == AppLifecycleState.paused) {
      // Коли додаток йде в background - позначити що був paused
      print('BiometricWrapper: App paused, marking _wasPaused = true');
      _wasPaused = true;
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      if (authProvider.isAuthenticated && authProvider.biometricEnabled) {
        // Скинути верифікацію тільки якщо додаток дійсно йде в background
        print('BiometricWrapper: Resetting biometric verification on pause');
        authProvider.resetBiometricVerification();
      }
    } else if (state == AppLifecycleState.resumed) {
      // Коли додаток повертається з background
      print('BiometricWrapper: App resumed, checking if need to reset biometric');
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      if (authProvider.isAuthenticated && authProvider.biometricEnabled) {
        // Скинути верифікацію і запитати біометрію знову ТІЛЬКИ якщо додаток дійсно був в background
        if (_wasPaused) {
          print('BiometricWrapper: App was paused, resetting biometric verification on resume');
          authProvider.resetBiometricVerification();
          setState(() {
            _needsBiometricAuth = true;
          });
        } else {
          print('BiometricWrapper: App was not paused (probably just system dialog), NOT resetting biometric verification');
        }
        // Скинути прапорець
        _wasPaused = false;
      }
    } else if (state == AppLifecycleState.inactive || state == AppLifecycleState.hidden) {
      // Це проміжні стани (наприклад, коли показується системний діалог біометрії)
      // Не робимо нічого, просто чекаємо
      print('BiometricWrapper: App in intermediate state ($state), not resetting biometric');
    }
  }

  Future<void> _checkBiometricNeeded() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    print('BiometricWrapper: _checkBiometricNeeded - isAuth: ${authProvider.isAuthenticated}, bioEnabled: ${authProvider.biometricEnabled}, bioVerified: ${authProvider.biometricVerified}, hasChecked: $_hasChecked');
    
    // Перевірити чи потрібна біометрія
    // Якщо користувач авторизований, біометрія увімкнена і ще не верифікована
    if (authProvider.isAuthenticated && 
        authProvider.biometricEnabled && 
        !authProvider.biometricVerified &&
        !_hasChecked) {
      print('BiometricWrapper: _checkBiometricNeeded - Setting _needsBiometricAuth = true');
      setState(() {
        _needsBiometricAuth = true;
        _hasChecked = true;
      });
    } else {
      print('BiometricWrapper: _checkBiometricNeeded - NOT setting _needsBiometricAuth (conditions not met)');
    }
  }

  void _onBiometricSuccess() {
    if (!mounted) return;
    
    print('BiometricWrapper: _onBiometricSuccess called');
    
    // Позначити що верифікували
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    print('BiometricWrapper: Setting biometricVerified = true');
    authProvider.setBiometricVerified(true);
    
    // Встановити _needsBiometricAuth = false одразу, синхронно
    // Це приховає біометричний екран і покаже головний екран
    print('BiometricWrapper: Setting _needsBiometricAuth = false');
    setState(() {
      _needsBiometricAuth = false;
    });
    
    print('BiometricWrapper: State updated, should show main content now');
  }

  @override
  Widget build(BuildContext context) {
    // Використовуємо Selector щоб слухати тільки потрібні зміни
    return Selector<AuthProvider, ({bool isAuth, bool bioEnabled, bool bioVerified})>(
      selector: (context, auth) => (
        isAuth: auth.isAuthenticated,
        bioEnabled: auth.biometricEnabled,
        bioVerified: auth.biometricVerified,
      ),
      builder: (context, authState, child) {
        print('BiometricWrapper: build - isAuth: ${authState.isAuth}, bioEnabled: ${authState.bioEnabled}, bioVerified: ${authState.bioVerified}, needsBiometricAuth: $_needsBiometricAuth');
        
        // Якщо не авторизований, показати child (LoginScreen тощо)
        if (!authState.isAuth) {
          print('BiometricWrapper: Not authenticated, showing child');
          return widget.child;
        }

        // Якщо біометрія не увімкнена або вже верифікована, показати child
        if (!authState.bioEnabled || authState.bioVerified) {
          print('BiometricWrapper: Biometric not enabled or verified, showing main content');
          return widget.child;
        }

        // Якщо потрібна біометрична автентифікація
        if (_needsBiometricAuth) {
          print('BiometricWrapper: Showing biometric auth screen');
          return BiometricAuthWidget(
            onSuccess: _onBiometricSuccess,
            child: widget.child,
          );
        }

        // Показати основний контент
        print('BiometricWrapper: Showing main content (fallback)');
        return widget.child;
      },
    );
  }
}

/// Простий віджет для біометричної автентифікації поверх контенту
class BiometricAuthWidget extends StatefulWidget {
  final VoidCallback onSuccess;
  final Widget child;

  const BiometricAuthWidget({
    super.key,
    required this.onSuccess,
    required this.child,
  });

  @override
  State<BiometricAuthWidget> createState() => _BiometricAuthWidgetState();
}

class _BiometricAuthWidgetState extends State<BiometricAuthWidget> {
  @override
  Widget build(BuildContext context) {
    return Directionality(
      textDirection: TextDirection.ltr,
      child: Stack(
        children: [
          // Основний контент (розмитий)
          Positioned.fill(
            child: AbsorbPointer(
              child: widget.child,
            ),
          ),
          // Біометричний екран поверх
          Positioned.fill(
            child: BiometricAuthScreen(
              onSuccess: widget.onSuccess,
            ),
          ),
        ],
      ),
    );
  }
}

