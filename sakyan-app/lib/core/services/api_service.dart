import 'package:dio/dio.dart';
import '../constants/api_constants.dart';
import 'storage_service.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Singleton Dio HTTP client with JWT interceptor.
/// Mirrors the web's axios.js config:
///   - Attaches Bearer token from storage on every request
///   - Clears auth and redirects on 401
class ApiService {
  ApiService._();

  static final Dio _dio = Dio(
    BaseOptions(
      baseUrl:         ApiConstants.baseUrl,
      connectTimeout:  const Duration(seconds: 15),
      receiveTimeout:  const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ),
  );

  static Dio get dio => _dio;

  /// Call once in main() before app starts.
  static void init() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        // REPLACE WITH:
        onRequest: (options, handler) {
          final token = Supabase.instance.client.auth.currentSession?.accessToken
              ?? StorageService.getToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (DioException error, handler) async {
          if (error.response?.statusCode == 401) {
            await StorageService.clearAuth();
            // Navigation happens via GoRouter redirect — no BuildContext needed here.
            // The auth state change triggers a redirect in app_router.dart.
          }
          handler.next(error);
        },
      ),
    );
  }

  // ── Convenience methods ────────────────────────────────────────────────────
  static Future<Response<T>> get<T>(String path, {Map<String, dynamic>? params}) =>
      _dio.get<T>(path, queryParameters: params);

  static Future<Response<T>> post<T>(String path, {dynamic data}) =>
      _dio.post<T>(path, data: data);

  static Future<Response<T>> patch<T>(String path, {dynamic data}) =>
      _dio.patch<T>(path, data: data);

  static Future<Response<T>> put<T>(String path, {dynamic data}) =>
      _dio.put<T>(path, data: data);

  static Future<Response<T>> delete<T>(String path) =>
      _dio.delete<T>(path);

  /// Multipart upload — for images and documents.
  static Future<Response<T>> upload<T>(String path, FormData formData) =>
      _dio.post<T>(path, data: formData);
}
