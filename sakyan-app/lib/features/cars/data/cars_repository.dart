import '../../../core/constants/api_constants.dart';
import '../../../core/services/api_service.dart';
import '../models/car_model.dart';
import '../models/partner_model.dart';
class CarsRepository {
  const CarsRepository();
  /// Fetch all public cars with optional filters.
  Future<List<CarModel>> getCars({
    String? search,
    String? transmission,
    String? fuelType,
    double? maxPrice,
    int? minSeats,
    String? partnerId,
  }) async {
    final params = <String, dynamic>{};
    if (search != null && search.isNotEmpty) params['search'] = search;
    if (transmission != null)               params['transmission'] = transmission;
    if (fuelType != null)                   params['fuel_type'] = fuelType;
    if (maxPrice != null)                   params['max_price'] = maxPrice;
    if (minSeats != null)                   params['min_seats'] = minSeats;
    if (partnerId != null)                  params['partner_id'] = partnerId;
    final res = await ApiService.get(ApiConstants.cars, params: params);
    final raw = res.data;
    // Backend may return paginated {results:[]} or plain list
    List list;
    if (raw is List) {
      list = raw;
    } else if (raw is Map && raw['results'] is List) {
      list = raw['results'] as List;
    } else {
      list = [];
    }
    return list.map((e) => CarModel.fromJson(e as Map<String, dynamic>)).toList();
  }
  /// Fetch a single car by id.
  Future<CarModel> getCarById(String id) async {
    final res = await ApiService.get(ApiConstants.carDetail(id));
    return CarModel.fromJson(res.data as Map<String, dynamic>);
  }
  /// Fetch booked date ranges for a car.
  /// Returns list of maps with keys: start_date, end_date.
  Future<List<Map<String, String>>> getBookedDates(String carId) async {
    final res = await ApiService.get(ApiConstants.carBookedDates(carId));
    final raw = res.data;
    if (raw is List) {
      return raw.map((e) => Map<String, String>.from(e as Map)).toList();
    }
    return [];
  }

  /// Fetch all approved partners (for filter sheet).
  Future<List<ApprovedPartnerModel>> getApprovedPartners() async {
    try {
      final res = await ApiService.get(ApiConstants.approvedPartners);
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
          .map((e) => ApprovedPartnerModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }
}
