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
    return list
        .map((e) => CarModel.fromJson(e as Map<String, dynamic>))
        .take(6)
        .toList();
  }
}