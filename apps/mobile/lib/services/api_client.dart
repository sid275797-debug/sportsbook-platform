import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Override via --dart-define=API_BASE=https://your-server.com at build time
// e.g. flutter run --dart-define=API_BASE=http://192.168.1.100:4000
const String kApiBase = String.fromEnvironment('API_BASE', defaultValue: 'http://10.0.2.2:4000');

class ApiClient {
  late final Dio _dio;
  static final ApiClient _instance = ApiClient._();
  factory ApiClient() => _instance;

  ApiClient._() {
    _dio = Dio(BaseOptions(
      baseUrl: kApiBase,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('accessToken');
        if (token != null) options.headers['Authorization'] = 'Bearer $token';
        handler.next(options);
      },
      onError: (err, handler) async {
        if (err.response?.statusCode == 401) {
          final refreshed = await _refreshToken();
          if (refreshed) {
            final prefs = await SharedPreferences.getInstance();
            final token = prefs.getString('accessToken');
            err.requestOptions.headers['Authorization'] = 'Bearer $token';
            final response = await _dio.request(err.requestOptions.path, options: Options(method: err.requestOptions.method, headers: err.requestOptions.headers), data: err.requestOptions.data);
            return handler.resolve(response);
          }
        }
        handler.next(err);
      },
    ));
  }

  Future<bool> _refreshToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final refreshToken = prefs.getString('refreshToken');
      if (refreshToken == null) return false;
      final response = await _dio.post('/api/auth/refresh', data: {'refreshToken': refreshToken});
      await prefs.setString('accessToken', response.data['data']['accessToken']);
      await prefs.setString('refreshToken', response.data['data']['refreshToken']);
      return true;
    } catch (_) { return false; }
  }

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) =>
      _dio.get(path, queryParameters: queryParameters);

  Future<Response> post(String path, {dynamic data}) => _dio.post(path, data: data);

  Future<Response> patch(String path, {dynamic data}) => _dio.patch(path, data: data);

  Future<Response> delete(String path) => _dio.delete(path);
}
