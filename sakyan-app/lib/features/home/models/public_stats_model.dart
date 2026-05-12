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

  // ── Safe int parser ────────────────────────────────────────────────────────
  //
  // The `as int?` cast pattern silently produces null (then falls back to 0)
  // whenever Django returns the value as a String, double, or null.
  // This helper handles all those cases the same way CarModel._toInt() does.
  //
  static int _toInt(dynamic v) {
    if (v == null) return 0;
    if (v is int) return v;
    if (v is num) return v.toInt();
    if (v is String) return int.tryParse(v) ?? 0;
    return 0;
  }

  factory PublicStatsModel.fromJson(Map<String, dynamic> json) {
    final model = PublicStatsModel(
      totalCars:      _toInt(json['available_cars']),
      totalPartners:  _toInt(json['active_partners']),
      totalBookings:  _toInt(json['completed_bookings']),
      totalCustomers: _toInt(json['total_users']),
    );

    // ── DEBUG: print what the API actually returned ─────────────────────────
    // Remove once stats are confirmed working.
    print('=== PUBLIC STATS DEBUG ===');
    print('Raw JSON keys : ${json.keys.toList()}');
    print('Raw JSON values: $json');
    print('Parsed → cars:${model.totalCars}  partners:${model.totalPartners}  '
        'bookings:${model.totalBookings}  customers:${model.totalCustomers}');
    print('==========================');
    // ────────────────────────────────────────────────────────────────────────

    return model;
  }
}