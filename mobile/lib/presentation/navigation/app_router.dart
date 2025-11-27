import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/auth/biometric_auth_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/test/test_screen.dart';
import '../screens/test/test_results_screen.dart';
import '../screens/stats/stats_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/shop/shop_screen.dart';
import '../screens/knowledge/knowledge_base_screen.dart';
import '../screens/knowledge/article_detail_screen.dart';
import '../screens/achievements/achievements_screen.dart';
import '../screens/feedback/feedback_screen.dart';
import '../providers/auth_provider.dart';

class AppRouter {
  static GoRouter getRouter(BuildContext context, AuthProvider authProvider) {
    return GoRouter(
      initialLocation: '/',
      refreshListenable: authProvider,
      redirect: (context, state) {
        final isAuthenticated = authProvider.isAuthenticated;
        final isLoading = authProvider.isLoading;
        final isLoginRoute = state.matchedLocation == '/login';
        final isRegisterRoute = state.matchedLocation == '/register';

        // Якщо завантаження і не на сторінках логіну/реєстрації, перенаправити на login
        // (там буде показано loading screen)
        if (isLoading && !isLoginRoute && !isRegisterRoute) {
          return '/login';
        }

        // Якщо не завантаження і не авторизований, перенаправити на login
        if (!isLoading && !isAuthenticated && !isLoginRoute && !isRegisterRoute) {
          return '/login';
        }

        // Якщо авторизований і на сторінках логіну/реєстрації, перенаправити на home
        if (isAuthenticated && (isLoginRoute || isRegisterRoute)) {
          return '/';
        }

        return null;
      },
      routes: [
        GoRoute(
          path: '/biometric',
          name: 'biometric',
          builder: (context, state) => const BiometricAuthScreen(),
        ),
        GoRoute(
          path: '/login',
          name: 'login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/register',
          name: 'register',
          builder: (context, state) => const RegisterScreen(),
        ),
        GoRoute(
          path: '/',
          name: 'home',
          builder: (context, state) => const HomeScreen(),
        ),
        GoRoute(
          path: '/test/:testId',
          name: 'test',
          builder: (context, state) {
            final testId = state.pathParameters['testId']!;
            return TestScreen(testId: testId);
          },
        ),
        GoRoute(
          path: '/test-results/:testId',
          name: 'test-results',
          builder: (context, state) {
            final testId = state.pathParameters['testId']!;
            return TestResultsScreen(testId: testId);
          },
        ),
        GoRoute(
          path: '/stats',
          name: 'stats',
          builder: (context, state) => const StatsScreen(),
        ),
        GoRoute(
          path: '/profile',
          name: 'profile',
          builder: (context, state) => const ProfileScreen(),
        ),
        GoRoute(
          path: '/shop',
          name: 'shop',
          builder: (context, state) => const ShopScreen(),
        ),
        GoRoute(
          path: '/knowledge',
          name: 'knowledge',
          builder: (context, state) => const KnowledgeBaseScreen(),
        ),
        GoRoute(
          path: '/article/:articleId',
          name: 'article',
          builder: (context, state) {
            final articleId = state.pathParameters['articleId']!;
            return ArticleDetailScreen(articleId: articleId);
          },
        ),
        GoRoute(
          path: '/achievements',
          name: 'achievements',
          builder: (context, state) => const AchievementsScreen(),
        ),
        GoRoute(
          path: '/feedback',
          name: 'feedback',
          builder: (context, state) => const FeedbackScreen(),
        ),
      ],
    );
  }
}

