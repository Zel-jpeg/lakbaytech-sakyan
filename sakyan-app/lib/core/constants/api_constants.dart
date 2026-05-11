// API endpoint constants
class ApiConstants {
  ApiConstants._();

  static const String baseUrl = 'https://lakbaytech-sakyan-production.up.railway.app/api';

  // Auth
  static const String register = '/auth/register';
  static const String me       = '/auth/me';
  static const String profile  = '/auth/profile';

  // Cars
  static const String cars        = '/cars/';
  static const String publicStats = '/public/stats/';

  static String carDetail(String id)      => '/cars/$id/';
  static String carBookedDates(String id) => '/cars/$id/booked-dates/';

  // Booking settings (admin-configurable booking fee, etc.)
  static const String bookingSettings = '/public/booking-settings/';

  // Bookings (Customer)
  static const String createBooking = '/bookings/';
  static const String myBookings    = '/bookings/my/';
  static const String kycSave       = '/bookings/kyc/';
  static const String customerKyc   = '/customer/kyc/';

  static String bookingDetail(String id)               => '/bookings/$id/';
  static String bookingAction(String id, String action) => '/bookings/$id/$action/';

  // Partner Cars
  static const String partnerCars = '/partner/cars/';
  static String partnerCarDetail(String id)  => '/partner/cars/$id/';
  static String partnerCarToggle(String id)  => '/partner/cars/$id/toggle/';

  // Partner Bookings
  static const String partnerBookings = '/partner/bookings/';
  static String partnerBookingPayment(String id) => '/partner/bookings/$id/payment-status/';
  static String partnerBookingTimes(String id)   => '/partner/bookings/$id/rental-times/';

  // Partner Onboarding
  static const String partnerApply   = '/partner/apply/';
  static const String partnerProfile = '/partner/profile/';

  // Messages
  static const String conversations = '/messages/conversations/';
  static const String sendMessage   = '/messages/';
  static const String supportThread = '/messages/support/';
  static String bookingMessages(String bookingId) => '/messages/$bookingId/';

  // Notifications
  static const String notifications = '/notifications/';
  static const String readAll       = '/notifications/read-all/';
  static String readOne(String id)  => '/notifications/$id/read/';
}