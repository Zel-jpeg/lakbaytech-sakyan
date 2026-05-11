// App-wide constant keys and values
class AppConstants {
  AppConstants._();

  // SharedPreferences keys
  static const String keyToken          = 'sakyan_token';
  static const String keyOnboardingSeen = 'sakyan_onboarding_seen';
  static const String keyUser           = 'sakyan_user';
  static const String keyThemeMode      = 'sakyan_theme_mode';
  static const String keyFcmToken       = 'sakyan_fcm_token';

  // Supabase config
  static const String supabaseUrl     = 'https://qmgudvzujoxfvilipjgn.supabase.co';
  static const String supabaseAnonKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.'
      'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtZ3Vkdnp1am94ZnZpbGlwamduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNDU4NzcsImV4cCI6MjA5MjkyMTg3N30.'
      '8K7szkdyOEMjCYR7IWXtiegqiWe5ne9qIbMvJlmq-4I';

  // Supabase storage buckets — must match exactly what exists in Supabase dashboard
  static const String bucketCarImages   = 'car-images';
  static const String bucketKycDocs     = 'uploads';        // KYC & partner docs go here
  static const String bucketPartnerDocs = 'uploads';        // same bucket as web app uses
  static const String bucketAvatars     = 'avatars';
  static const String bucketChatImages  = 'chat-images';

  // Polling interval for messages / notifications (ms)
  static const int pollingIntervalMs = 5000;

  // Pagination
  static const int pageSize = 20;

  // Max images per car listing
  static const int maxCarImages = 10;

  // App info
  static const String appName    = 'Sakyan';
  static const String appVersion = '1.0.0';
}