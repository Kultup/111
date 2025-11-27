import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../config/app_config.dart';

class ApiService {
  late Dio _dio;
  static final ApiService _instance = ApiService._internal();

  factory ApiService() => _instance;

  ApiService._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {
          'Content-Type': 'application/json',
        },
      ),
    );

    _setupInterceptors();
  }

  void _setupInterceptors() {
    // Request Interceptor - додавання токену
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Публічні маршрути, які не потребують токену
          final publicRoutes = ['/auth/login', '/auth/register', '/auth/check-login'];
          final isPublicRoute = publicRoutes.any((route) => options.path.contains(route));
          
          // Додавати токен тільки для захищених маршрутів
          if (!isPublicRoute) {
            try {
              final prefs = await SharedPreferences.getInstance();
              final token = prefs.getString('token');
              if (token != null) {
                options.headers['Authorization'] = 'Bearer $token';
              }
            } catch (e) {
              print('Error getting token: $e');
            }
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          // Retry логіка для невдалих запитів
          if (_shouldRetry(error)) {
            try {
              final response = await _retryRequest(error);
              handler.resolve(response);
              return;
            } catch (e) {
              // Якщо retry не вдався, продовжуємо з помилкою
            }
          }

          // Обробка 401 (unauthorized)
          if (error.response?.statusCode == 401) {
            final prefs = await SharedPreferences.getInstance();
            await prefs.remove('token');
            await prefs.remove('user');
          }

          handler.next(error);
        },
      ),
    );
  }

  bool _shouldRetry(DioException error) {
    final retryableStatuses = [408, 429, 500, 502, 503, 504];
    final retryableErrors = [
      DioExceptionType.connectionTimeout,
      DioExceptionType.receiveTimeout,
      DioExceptionType.sendTimeout,
    ];

    if (error.response != null) {
      return retryableStatuses.contains(error.response?.statusCode);
    }

    return retryableErrors.contains(error.type);
  }

  Future<Response> _retryRequest(DioException error, {int retryCount = 0}) async {
    const maxRetries = 3;
    if (retryCount >= maxRetries) {
      throw error;
    }

    final delay = Duration(
      milliseconds: (1000 * (1 << retryCount)).clamp(1000, 5000),
    );
    await Future.delayed(delay);

    try {
      return await _dio.request(
        error.requestOptions.path,
        options: Options(
          method: error.requestOptions.method,
          headers: error.requestOptions.headers,
        ),
        data: error.requestOptions.data,
        queryParameters: error.requestOptions.queryParameters,
      );
    } catch (e) {
      return _retryRequest(error, retryCount: retryCount + 1);
    }
  }

  Dio get dio => _dio;

  // Helper методи
  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) {
    return _dio.get(path, queryParameters: queryParameters);
  }

  Future<Response> post(String path, {dynamic data}) {
    return _dio.post(path, data: data);
  }

  Future<Response> put(String path, {dynamic data}) {
    return _dio.put(path, data: data);
  }

  Future<Response> delete(String path) {
    return _dio.delete(path);
  }
}

