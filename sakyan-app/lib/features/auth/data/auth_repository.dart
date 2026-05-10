import 'package:google_sign_in/google_sign_in.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/storage_service.dart';
import '../models/user_model.dart';

class AuthRepository {
  const AuthRepository();

  /// Sync / register user with Django backend. If the user is new, Django creates them.
  Future<UserModel> syncGoogleUser() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) {
      throw Exception('Not authenticated with Supabase');
    }

    final fullName = user.userMetadata?['full_name'] ?? user.userMetadata?['name'] ?? '';
    final avatarUrl = user.userMetadata?['avatar_url'] ?? '';

    final response = await ApiService.post('/auth/register', data: {
      'user_id': user.id,
      'full_name': fullName,
      'email': user.email ?? '',
      'avatar_url': avatarUrl,
    });
    return UserModel.fromJson(response.data as Map<String, dynamic>);
  }

  /// Sign in with Google via Native Google Sign-In, then sync the user
  /// with the Django backend via POST /auth/register.
  Future<UserModel> signInWithGoogle() async {
    // 1. Native Google Sign In
    // TODO: Replace with your actual Web Client ID from Google Cloud Console
    const webClientId = '821173562207-hojortifpp1nh88t7jh6uri41luce0mi.apps.googleusercontent.com';
    // const iosClientId = 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com'; // Optionally configure for iOS
    
    final GoogleSignIn googleSignIn = GoogleSignIn(
      serverClientId: webClientId,
      // clientId: iosClientId,
    );
    
    final GoogleSignInAccount? googleUser = await googleSignIn.signIn();
    if (googleUser == null) {
      throw Exception('Google sign-in was cancelled.');
    }
    
    final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
    final accessToken = googleAuth.accessToken;
    final idToken = googleAuth.idToken;

    if (idToken == null) {
      throw Exception('No ID Token found. Web Client ID might be missing or incorrect.');
    }

    // 2. Pass the tokens to Supabase
    final authResponse = await Supabase.instance.client.auth.signInWithIdToken(
      provider: OAuthProvider.google,
      idToken: idToken,
      accessToken: accessToken,
    );

    // 3. Save Supabase access token — ApiService interceptor will attach it
    final session = authResponse.session;
    if (session == null) {
      throw Exception('Supabase session is null after sign-in. Try again.');
    }
    await StorageService.saveToken(session.accessToken);

    // 4. Register user in Django backend (get_or_create — safe for both new and existing users)
    await syncGoogleUser();

    // 5. Fetch the FULL user profile from /auth/me so the app always has
    //    complete data (name, email, role, avatar, etc.) regardless of what
    //    /auth/register returns for brand-new accounts.
    return await getMe();
  }

  /// Fetch the current authenticated user from Django /auth/me
  Future<UserModel> getMe() async {
    final response = await ApiService.get('/auth/me');
    return UserModel.fromJson(response.data as Map<String, dynamic>);
  }

  /// Sign out from Supabase AND Google (local storage is handled by AuthNotifier
  /// before this is called, so it's cleared regardless of network errors).
  Future<void> signOutSupabaseOnly() async {
    try {
      await GoogleSignIn().signOut();
    } catch (_) {}
    await Supabase.instance.client.auth.signOut();
  }

  /// Full sign out — clears Supabase, Google session, AND local storage.
  /// Use signOutSupabaseOnly() + StorageService.clearAuth() separately
  /// when you need ordering control (see AuthNotifier.signOut).
  Future<void> signOut() async {
    try {
      await GoogleSignIn().signOut();
    } catch (_) {}
    await Supabase.instance.client.auth.signOut();
    await StorageService.clearAuth();
  }
}