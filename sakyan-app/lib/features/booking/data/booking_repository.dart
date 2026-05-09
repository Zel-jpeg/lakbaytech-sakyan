import '../../../core/constants/api_constants.dart';
import '../../../core/services/api_service.dart';
import '../models/booking_model.dart';
class BookingRepository {
  const BookingRepository();
  /// Create a new booking.
  Future<BookingModel> createBooking(Map<String, dynamic> data) async {
    final res = await ApiService.post(ApiConstants.createBooking, data: data);
    return BookingModel.fromJson(res.data as Map<String, dynamic>);
  }
  /// Get all bookings for the current customer.
  Future<List<BookingModel>> getMyBookings() async {
    final res = await ApiService.get(ApiConstants.myBookings);
    final raw = res.data;
    List list = raw is List ? raw : (raw is Map && raw['results'] is List ? raw['results'] as List : []);
    return list.map((e) => BookingModel.fromJson(e as Map<String, dynamic>)).toList();
  }
  /// Get a single booking by id.
  Future<BookingModel> getBookingById(String id) async {
    final res = await ApiService.get(ApiConstants.bookingDetail(id));
    return BookingModel.fromJson(res.data as Map<String, dynamic>);
  }
  /// Cancel a booking.
  Future<void> cancelBooking(String id) async {
    await ApiService.post(ApiConstants.bookingAction(id, 'cancel'));
  }
}