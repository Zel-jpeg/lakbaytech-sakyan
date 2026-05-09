import '../../../core/constants/api_constants.dart';
import '../../../core/services/api_service.dart';
import '../models/public_stats_model.dart';
import '../../cars/models/car_model.dart';

class HomeRepository {
  const HomeRepository();

  Future<PublicStatsModel> getStats() async {
    final res = await ApiService.get(ApiConstants.publicStats);
    return PublicStatsModel.fromJson(res.data as Map<String, dynamic>);
  }

  /// Returns the 6 most recently added available cars for the home feed.
  Future<List<CarModel>> getFeaturedCars() async {
    final res = await ApiService.get(ApiConstants.cars, params: {'limit': 6});
    final raw = res.data;
    List list;
    if (raw is List) {
      list = raw;
    } else if (raw is Map && raw['results'] is List) {
      list = raw['results'] as List;
    } else {
      list = [];
    }

    // ── DEBUG: print first car's keys and image-related fields ──────────────
    // Remove this block once images are confirmed working.
    if (list.isNotEmpty) {
      final first = list.first as Map<String, dynamic>;
      print('=== CAR LIST DEBUG ===');
      print('All keys: ${first.keys.toList()}');
      print('images field: ${first['images']}');
      print('primary_image_url: ${first['primary_image_url']}');
      print('cover_image: ${first['cover_image']}');
      print('image_url: ${first['image_url']}');
      print('======================');
    }
    // ────────────────────────────────────────────────────────────────────────

    return list
        .map((e) => CarModel.fromJson(e as Map<String, dynamic>))
        .take(6)
        .toList();
  }
}