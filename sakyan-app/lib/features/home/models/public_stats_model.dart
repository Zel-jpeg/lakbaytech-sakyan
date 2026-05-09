class PublicStatsModel {
  final int totalCars;
  final int totalPartners;
  final int totalBookings;
  final int totalCustomers;
  const PublicStatsModel({
    this.totalCars      = 0,
    this.totalPartners  = 0,
    this.totalBookings  = 0,
    this.totalCustomers = 0,
  });
  factory PublicStatsModel.fromJson(Map<String, dynamic> json) => PublicStatsModel(
        totalCars:      json['total_cars']      as int? ?? 0,
        totalPartners:  json['total_partners']  as int? ?? 0,
        totalBookings:  json['total_bookings']  as int? ?? 0,
        totalCustomers: json['total_customers'] as int? ?? 0,
      );
}