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
