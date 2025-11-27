import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'presentation/providers/auth_provider.dart';
import 'presentation/providers/test_provider.dart';
import 'presentation/providers/stats_provider.dart';
import 'presentation/providers/shop_provider.dart';
import 'presentation/providers/achievements_provider.dart';
import 'presentation/providers/knowledge_base_provider.dart';
import 'presentation/navigation/app_router.dart';
import 'presentation/widgets/biometric_wrapper.dart';

void main() {
  // Глобальна обробка помилок Flutter
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    debugPrint('Flutter Error: ${details.exception}');
    debugPrint('Stack trace: ${details.stack}');
  };

  // Обробка помилок у зонах
  runZonedGuarded(() {
    runApp(const MyApp());
  }, (error, stack) {
    debugPrint('Zone Error: $error');
    debugPrint('Stack trace: $stack');
  });
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProxyProvider<AuthProvider, KnowledgeBaseProvider>(
          create: (_) => KnowledgeBaseProvider(null),
          update: (_, authProvider, previous) {
            previous ??= KnowledgeBaseProvider(authProvider);
            previous.setAuthProvider(authProvider);
            return previous;
          },
        ),
        ChangeNotifierProvider(create: (_) => TestProvider()),
        ChangeNotifierProvider(create: (_) => StatsProvider()),
        ChangeNotifierProvider(create: (_) => ShopProvider()),
        ChangeNotifierProvider(create: (_) => AchievementsProvider()),
      ],
      child: Builder(
        builder: (context) {
          final authProvider = Provider.of<AuthProvider>(context);
          return BiometricWrapper(
            child: MaterialApp.router(
              title: 'Навчальна система',
              debugShowCheckedModeBanner: false,
              theme: ThemeData(
                colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
                useMaterial3: true,
              ),
              routerConfig: AppRouter.getRouter(context, authProvider),
              localizationsDelegates: const [
                GlobalMaterialLocalizations.delegate,
                GlobalWidgetsLocalizations.delegate,
                GlobalCupertinoLocalizations.delegate,
              ],
              supportedLocales: const [
                Locale('uk', 'UA'),
                Locale('en', 'US'),
              ],
            ),
          );
        },
      ),
    );
  }
}
