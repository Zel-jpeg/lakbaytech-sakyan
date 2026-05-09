import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/storage_service.dart';
import '../models/user_model.dart';

class AuthRepository {
  const AuthRepository();

  /// Sign in with Google via Supabase OAuth, then sync the user
  /// with the Django backend via POST /auth/register.
  Future<UserModel> signInWithGoogle() async {
    // 1. Trigger Supabase Google OAuth
    await Supabase.instance.client.auth.signInWithOAuth(
      OAuthProvider.google,
      redirectTo: 'com.sakyan.app://login-callback',
    );

    // 2. Wait for session (the deep link callback updates the session)
    final session = Supabase.instance.client.auth.currentSession;
    if (session == null) {
      throw Exception('Google sign-in was cancelled or failed.');
    }

    // 3. Save Supabase access token — ApiService interceptor will attach it
    await StorageService.saveToken(session.accessToken);

    // 4. Sync / register user with Django backend
    final response = await ApiService.post('/auth/register', data: {});
    return UserModel.fromJson(response.data as Map<String, dynamic>);
  }

  /// Fetch the current authenticated user from Django /auth/me
  Future<UserModel> getMe() async {
    final response = await ApiService.get('/auth/me');
    return UserModel.fromJson(response.data as Map<String, dynamic>);
  }

  /// Sign out from Supabase ONLY (local storage is handled by AuthNotifier
  /// before this is called, so it's cleared regardless of network errors).
  Future<void> signOutSupabaseOnly() async {
    await Supabase.instance.client.auth.signOut();
  }

  /// Full sign out — clears Supabase session AND local storage.
  /// Use signOutSupabaseOnly() + StorageService.clearAuth() separately
  /// when you need ordering control (see AuthNotifier.signOut).
  Future<void> signOut() async {
    await Supabase.instance.client.auth.signOut();
    await StorageService.clearAuth();
  }
}