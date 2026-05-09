import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/constants/app_constants.dart';
import 'core/services/api_service.dart';
import 'core/services/storage_service.dart';
import 'app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 1. Local storage (must come first — used by ApiService interceptor)
  await StorageService.init();

  // 2. Supabase (auth + file storage)
  await Supabase.initialize(
    url:    AppConstants.supabaseUrl,
    anonKey: AppConstants.supabaseAnonKey,
  );

  // 3. Dio HTTP client with JWT interceptor
  ApiService.init();

  // 4. TODO (Phase 7): Firebase.initializeApp() for FCM push notifications
  // await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  runApp(
    const ProviderScope(
      child: SakyanApp(),
    ),
  );
}
