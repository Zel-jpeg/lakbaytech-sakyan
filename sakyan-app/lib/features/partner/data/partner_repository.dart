import 'dart:io';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';
import '../../../core/services/api_service.dart';
import '../../../features/booking/models/booking_model.dart';
import '../../../features/cars/models/car_model.dart';
import '../models/partner_model.dart';

class PartnerRepository {
  const PartnerRepository();

  static final _storage = Supabase.instance.client.storage;
  static const _uuid    = Uuid();

  // ── Profile & application ──────────────────────────────────────────────────

  Future<PartnerModel?> getProfile() async {
    try {
      final res = await ApiService.get('/partner/profile/');
      return PartnerModel.fromJson(res.data as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<PartnerModel> applyAsPartner(Map<String, dynamic> data) async {
    final res = await ApiService.post('/partner/apply/', data: data);
    return PartnerModel.fromJson(res.data as Map<String, dynamic>);
  }

  // ── Partner stats (derived from bookings) ──────────────────────────────────

  Future<PartnerStatsModel> getStats() async {
    try {
      final res = await ApiService.get('/partner/bookings/');
      final raw = res.data;
      List list = raw is List
          ? raw
          : (raw is Map && raw['results'] is List ? raw['results'] as List : []);

      final bookings = list
          .map((e) => BookingModel.fromJson(e as Map<String, dynamic>))
          .toList();

      final activeBookings = bookings.where((b) => b.isActive).length;
      final pendingRequests = bookings.where((b) => b.isPendingReview).length;
      final completedBookings = bookings.where((b) => b.isCompleted).length;
      final totalEarnings = bookings
          .where((b) => b.isCompleted)
          .fold<double>(0, (sum, b) => sum + b.totalAmount);

      // total cars from partner cars endpoint
      int totalCars = 0;
      try {
        final carsRes = await ApiService.get('/partner/cars/');
        final carsRaw = carsRes.data;
        List carsList = carsRaw is List
            ? carsRaw
            : (carsRaw is Map && carsRaw['results'] is List
                ? carsRaw['results'] as List
                : []);
        totalCars = carsList.length;
      } catch (_) {}

      return PartnerStatsModel(
        totalEarnings:     totalEarnings,
        activeBookings:    activeBookings,
        totalCars:         totalCars,
        pendingRequests:   pendingRequests,
        completedBookings: completedBookings,
      );
    } catch (_) {
      return const PartnerStatsModel();
    }
  }

  // ── Partner cars ───────────────────────────────────────────────────────────

  Future<List<CarModel>> getMyCars() async {
    final res = await ApiService.get('/partner/cars/');
    final raw = res.data;
    List list = raw is List
        ? raw
        : (raw is Map && raw['results'] is List ? raw['results'] as List : []);
    return list.map((e) => CarModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<CarModel> getCarById(String id) async {
    final res = await ApiService.get('/partner/cars/$id/');
    return CarModel.fromJson(res.data as Map<String, dynamic>);
  }

  Future<CarModel> createCar(Map<String, dynamic> data) async {
    final res = await ApiService.post('/partner/cars/', data: data);
    return CarModel.fromJson(res.data as Map<String, dynamic>);
  }

  Future<CarModel> updateCar(String id, Map<String, dynamic> data) async {
    final res = await ApiService.patch('/partner/cars/$id/', data: data);
    return CarModel.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> deleteCar(String id) async {
    await ApiService.delete('/partner/cars/$id/');
  }

  Future<void> toggleAvailability(String id) async {
    await ApiService.post('/partner/cars/$id/toggle/');
  }

  // ── Partner bookings ───────────────────────────────────────────────────────

  Future<List<BookingModel>> getMyBookings() async {
    final res = await ApiService.get('/partner/bookings/');
    final raw = res.data;
    List list = raw is List
        ? raw
        : (raw is Map && raw['results'] is List ? raw['results'] as List : []);
    return list.map((e) => BookingModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> approveBooking(String id) async {
    await ApiService.post('/bookings/$id/approve/');
  }

  Future<void> rejectBooking(String id, {String reason = ''}) async {
    await ApiService.post('/bookings/$id/reject/', data: {'reason': reason});
  }

  Future<void> completeBooking(String id) async {
    await ApiService.post('/bookings/$id/complete/');
  }

  Future<void> updatePaymentStatus(String id, String status) async {
    await ApiService.patch('/partner/bookings/$id/payment-status/',
        data: {'payment_status': status});
  }

  Future<void> updateRentalTimes(
      String id, String? startTime, String? returnTime) async {
    await ApiService.patch('/partner/bookings/$id/rental-times/', data: {
      if (startTime  != null) 'actual_start_time':  startTime,
      if (returnTime != null) 'actual_return_time': returnTime,
    });
  }

  // ── Image upload ───────────────────────────────────────────────────────────

  Future<String> uploadCarImage(File file) async {
    final ext      = file.path.split('.').last;
    final fileName = 'car-images/${_uuid.v4()}.$ext';
    await _storage.from('car-images').upload(fileName, file);
    return _storage.from('car-images').getPublicUrl(fileName);
  }

  Future<String> uploadPartnerDoc(File file, String folder) async {
    final ext      = file.path.split('.').last;
    final fileName = '$folder/${_uuid.v4()}.$ext';
    await _storage.from('partner-documents').upload(fileName, file);
    return _storage.from('partner-documents').getPublicUrl(fileName);
  }
}