import 'package:dio/dio.dart';
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
    try {
      final res = await ApiService.get(ApiConstants.myBookings);
      final raw = res.data;

      // ── DEBUG ────────────────────────────────────────────────────────────
      print('=== BOOKINGS DEBUG ===');
      print('Status code: ${res.statusCode}');
      print('Response type: ${raw.runtimeType}');
      if (raw is List && raw.isNotEmpty) {
        print('First booking keys: ${(raw.first as Map).keys.toList()}');
      } else if (raw is Map) {
        print('Response keys: ${raw.keys.toList()}');
        if (raw['results'] is List && (raw['results'] as List).isNotEmpty) {
          print('First booking keys: ${((raw['results'] as List).first as Map).keys.toList()}');
        }
      }
      print('======================');
      // ─────────────────────────────────────────────────────────────────────

      List list = raw is List
          ? raw
          : (raw is Map && raw['results'] is List ? raw['results'] as List : []);
      return list
          .map((e) => BookingModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e, st) {
      print('=== BOOKINGS ERROR ===');
      print('Error: $e');
      print('Stack: $st');
      print('======================');
      rethrow;
    }
  }

  /// Get a single booking by id.
  Future<BookingModel> getBookingById(String id) async {
    final res = await ApiService.get(ApiConstants.bookingDetail(id));
    return BookingModel.fromJson(res.data as Map<String, dynamic>);
  }

  /// Cancel a booking.
  Future<void> cancelBooking(String id) async {
    try {
      await ApiService.patch(ApiConstants.bookingAction(id, 'cancel'), data: {});
    } on DioException catch (e) {
      final body = e.response?.data;
      String? msg;
      if (body is Map) {
        msg = (body['error'] ?? body['detail'] ?? body['message'])?.toString();
      } else if (body is String && body.isNotEmpty) {
        msg = body;
      }
      throw Exception(msg ?? 'Failed to cancel booking. Please try again.');
    }
  }
}