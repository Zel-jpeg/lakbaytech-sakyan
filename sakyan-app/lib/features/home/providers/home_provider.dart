import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/home_repository.dart';
import '../models/public_stats_model.dart';
import '../../cars/models/car_model.dart';

final homeRepositoryProvider =
    Provider<HomeRepository>((_) => const HomeRepository());

final publicStatsProvider = FutureProvider<PublicStatsModel>((ref) async {
  return ref.read(homeRepositoryProvider).getStats();
});

final featuredCarsProvider = FutureProvider<List<CarModel>>((ref) async {
  return ref.read(homeRepositoryProvider).getFeaturedCars();
});

// ── Session greeting ──────────────────────────────────────────────────────────
//
// A non-autoDispose Provider is computed ONCE per ProviderScope lifetime
// (i.e. once per app launch). It will NOT change between widget rebuilds —
// only when the user fully closes the app (removes from recents) and reopens,
// causing the ProviderScope to be recreated.
//
// This gives us the behaviour requested:
//   • Greeting is random but stable for an entire "session"
//   • A different greeting CAN appear on the next cold start
//   • NEVER changes mid-session (no minute-based recalculation)
// ─────────────────────────────────────────────────────────────────────────────

/// Greeting record returned by [sessionGreetingProvider].
typedef SessionGreeting = ({String greeting, String subtitle});

final sessionGreetingProvider = Provider<SessionGreeting>((ref) {
  final hour = DateTime.now().hour;
  // Use millisecondsSinceEpoch divided into ~10-second buckets for variety
  // while still being stable within any single session.
  final seed = (DateTime.now().millisecondsSinceEpoch ~/ 10000);

  final List<String> greetings;
  final String subtitle;

  if (hour >= 5 && hour < 12) {
    greetings = [
      'Good morning',
      'Rise and shine',
      'Morning, ready to roll',
      'Good morning, let\'s drive',
    ];
    subtitle = 'Start your day with the perfect ride';
  } else if (hour >= 12 && hour < 17) {
    greetings = [
      'Good afternoon',
      'Afternoon, need a ride?',
      'Hope your day is going well',
      'Good afternoon, let\'s go',
    ];
    subtitle = 'Find your perfect car for the afternoon';
  } else if (hour >= 17 && hour < 21) {
    greetings = [
      'Good evening',
      'Evening, where to next?',
      'Great evening for a drive',
      'Good evening, let\'s ride',
    ];
    subtitle = 'Evening plans? We have you covered';
  } else {
    greetings = [
      'Working late?',
      'Up late? We have cars',
      'Night owl mode',
      'Burning the midnight oil',
    ];
    subtitle = 'Browse cars anytime, anywhere';
  }

  return (
    greeting: greetings[seed % greetings.length],
    subtitle: subtitle,
  );
});