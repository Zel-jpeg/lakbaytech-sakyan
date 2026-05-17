import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:table_calendar/table_calendar.dart';
import '../../../core/constants/app_colors.dart';
import '../../cars/models/car_model.dart';
import '../../cars/providers/cars_provider.dart';
import '../../booking/providers/booking_provider.dart';
import '../../kyc/providers/kyc_provider.dart';

// ── Constants ─────────────────────────────────────────────────────────────────
const double _kBookingFee = 100.0; // ₱100 platform booking fee
const _kPhCenter = LatLng(12.8797, 121.774);

// ── PSGC helpers (reused from KYC) ───────────────────────────────────────────
const _kPsgc = 'https://psgc.cloud/api';
final _psgcDio = Dio(BaseOptions(
  connectTimeout: const Duration(seconds: 12),
  receiveTimeout: const Duration(seconds: 15),
));

class _PsgcItem {
  final String code, name;
  final double? lat, lng;
  const _PsgcItem({required this.code, required this.name, this.lat, this.lng});
}

Future<List<_PsgcItem>> _psgcFetch(String url) async {
  final res = await _psgcDio.get<List<dynamic>>(url);
  final raw = res.data ?? [];
  final items = raw.map((e) {
    final m = e as Map<String, dynamic>;
    return _PsgcItem(
      code: m['code'] as String? ?? '',
      name: m['name'] as String? ?? '',
      lat: (m['latitude'] as num?)?.toDouble(),
      lng: (m['longitude'] as num?)?.toDouble(),
    );
  }).toList()
    ..sort((a, b) => a.name.compareTo(b.name));
  return items;
}

// ── Main Widget ───────────────────────────────────────────────────────────────
class CheckoutScreen extends ConsumerStatefulWidget {
  final String carId;
  const CheckoutScreen({super.key, required this.carId});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  // Step tracking
  int _currentStep = 0; // 0=Dates, 1=Pickup, 2=Payment, 3=Special

  // Dates
  DateTime? _startDate;
  DateTime? _endDate;
  Set<DateTime> _bookedDays = {};

  // Fulfillment
  String _fulfillment = 'pickup';

  // Delivery address (PSGC)
  List<_PsgcItem> _provinces = [];
  List<_PsgcItem> _cities = [];
  List<_PsgcItem> _barangays = [];
  bool _loadingP = true, _loadingC = false, _loadingB = false;
  String _provinceCode = '', _provinceName = '';
  String _cityCode = '', _cityName = '';
  String _barangayName = '';

  // Delivery map
  final _deliveryMapCtrl = MapController();
  bool _deliveryMapReady = false;
  LatLng? _pendingCenter;
  double? _pendingZoom;
  LatLng? _deliveryPin;
  String _deliveryPinLabel = '';
  bool _reversing = false;
  double? _deliveryLat, _deliveryLng;

  // Pickup map
  final _pickupMapCtrl = MapController();
  bool _pickupMapReady = false;

  // Payment
  String _paymentMethod = 'cash';

  // Special requests
  final _specialCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadProvinces();
  }

  @override
  void dispose() {
    _specialCtrl.dispose();
    _deliveryMapCtrl.dispose();
    _pickupMapCtrl.dispose();
    super.dispose();
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  int get _totalDays {
    if (_startDate == null || _endDate == null) return 0;
    return _endDate!.difference(_startDate!).inDays + 1;
  }

  double get _subtotal => (_totalDays > 0 && _car != null)
      ? _car!.pricePerDay * _totalDays
      : 0;
  double get _total => _subtotal + _kBookingFee;

  CarModel? _car; // cached from carAsync

  String get _fullDeliveryAddress {
    final parts = [_barangayName, _cityName, _provinceName]
        .where((s) => s.isNotEmpty);
    return parts.join(', ');
  }

  bool get _isFormValid {
    if (_startDate == null || _endDate == null) return false;
    if (_fulfillment == 'delivery') {
      if (_provinceCode.isEmpty || _cityCode.isEmpty) return false;
    }
    return true;
  }

  // ── PSGC ──────────────────────────────────────────────────────────────────
  Future<void> _loadProvinces() async {
    setState(() => _loadingP = true);
    try {
      final items = await _psgcFetch('$_kPsgc/provinces/');
      if (mounted) setState(() { _provinces = items; _loadingP = false; });
    } catch (_) {
      if (mounted) setState(() => _loadingP = false);
    }
  }

  Future<void> _onProvinceChanged(String code, String name) async {
    setState(() {
      _provinceCode = code; _provinceName = name;
      _cityCode = ''; _cityName = '';
      _barangayName = '';
      _cities = []; _barangays = [];
      _loadingC = true;
    });
    try {
      final items = await _psgcFetch('$_kPsgc/provinces/$code/cities-municipalities/');
      if (mounted) setState(() { _cities = items; _loadingC = false; });
    } catch (_) {
      if (mounted) setState(() => _loadingC = false);
    }
  }

  Future<void> _onCityChanged(String code, String name) async {
    setState(() {
      _cityCode = code; _cityName = name;
      _barangayName = '';
      _barangays = [];
      _loadingB = true;
    });

    final city = _cities.where((c) => c.code == code).firstOrNull;
    if (city?.lat != null && city?.lng != null) {
      _moveDeliveryMap(LatLng(city!.lat!, city.lng!), 13);
    } else {
      _flyToQuery('$name, Philippines', 13);
    }

    try {
      final items = await _psgcFetch('$_kPsgc/cities-municipalities/$code/barangays/');
      if (mounted) setState(() { _barangays = items; _loadingB = false; });
    } catch (_) {
      if (mounted) setState(() => _loadingB = false);
    }
  }

  // ── Map helpers ───────────────────────────────────────────────────────────
  void _moveDeliveryMap(LatLng center, double zoom) {
    _pendingCenter = center;
    _pendingZoom = zoom;
    if (!_deliveryMapReady) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_deliveryMapReady) return;
      try { _deliveryMapCtrl.move(center, zoom); } catch (_) {}
    });
  }

  void _onDeliveryMapReady() {
    if (!mounted) return;
    setState(() => _deliveryMapReady = true);
    if (_pendingCenter != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        try { _deliveryMapCtrl.move(_pendingCenter!, _pendingZoom ?? 6); } catch (_) {}
      });
    }
  }

  void _onPickupMapReady() {
    if (!mounted) return;
    setState(() => _pickupMapReady = true);
    // Zoom to car location once map is ready
    if (_car?.locationLat != null && _car?.locationLng != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        try {
          _pickupMapCtrl.move(LatLng(_car!.locationLat!, _car!.locationLng!), 15);
        } catch (_) {}
      });
    }
  }

  Future<void> _flyToQuery(String query, double zoom) async {
    try {
      final res = await _psgcDio.get<List<dynamic>>(
        'https://nominatim.openstreetmap.org/search',
        queryParameters: {'q': '$query, Philippines', 'format': 'json', 'limit': 1},
        options: Options(headers: {'Accept-Language': 'en', 'User-Agent': 'SakyanApp/1.0'}),
      );
      final body = res.data ?? [];
      if (body.isNotEmpty && mounted) {
        final lat = double.tryParse(body[0]['lat']?.toString() ?? '') ?? 0;
        final lon = double.tryParse(body[0]['lon']?.toString() ?? '') ?? 0;
        if (lat != 0 && lon != 0) _moveDeliveryMap(LatLng(lat, lon), zoom);
      }
    } catch (_) {}
  }

  Future<void> _onDeliveryMapTap(LatLng latlng) async {
    setState(() {
      _deliveryPin = latlng;
      _deliveryLat = latlng.latitude;
      _deliveryLng = latlng.longitude;
      _deliveryPinLabel =
          '${latlng.latitude.toStringAsFixed(5)}, ${latlng.longitude.toStringAsFixed(5)}';
      _reversing = true;
    });
    try {
      final res = await _psgcDio.get<Map<String, dynamic>>(
        'https://nominatim.openstreetmap.org/reverse',
        queryParameters: {'lat': latlng.latitude, 'lon': latlng.longitude, 'format': 'json'},
        options: Options(headers: {'Accept-Language': 'en', 'User-Agent': 'SakyanApp/1.0'}),
      );
      if (mounted) {
        setState(() {
          _deliveryPinLabel = res.data?['display_name'] as String? ?? _deliveryPinLabel;
          _reversing = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _reversing = false);
    }
  }

  void _loadBookedDates(List<Map<String, String>> dates) {
    final days = <DateTime>{};
    for (final d in dates) {
      final start = DateTime.tryParse(d['start_date'] ?? '');
      final end = DateTime.tryParse(d['end_date'] ?? '');
      if (start == null || end == null) continue;
      for (var dt = start; !dt.isAfter(end); dt = dt.add(const Duration(days: 1))) {
        days.add(DateTime(dt.year, dt.month, dt.day));
      }
    }
    if (mounted) setState(() => _bookedDays = days);
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  Future<void> _submit(CarModel car) async {
    if (!_isFormValid) return;

    String deliveryAddress = '';
    if (_fulfillment == 'delivery') {
      deliveryAddress = _fullDeliveryAddress;
      if (_deliveryPinLabel.isNotEmpty &&
          !_deliveryPinLabel.contains(',') == false) {
        deliveryAddress = _deliveryPinLabel;
      }
    }

    final data = {
      'car': car.id,
      'start_date': _startDate!.toIso8601String().substring(0, 10),
      'end_date': _endDate!.toIso8601String().substring(0, 10),
      'fulfillment_type': _fulfillment,
      'delivery_address': deliveryAddress,
      'payment_method': _paymentMethod,
      'gcash_reference': '',
      'special_requests': _specialCtrl.text.trim(),
      'pickup_location': car.location,
      'return_location': car.location,
    };

    final booking = await ref.read(createBookingProvider.notifier).create(data);
    if (booking != null && mounted) {
      // Both payment methods → confirmation screen
      // Partner and customer will coordinate via chat
      context.go('/confirmation/${booking.bookingCode}', extra: {
        'bookingId': booking.id,
        'paymentMethod': _paymentMethod,
        'partnerUserId': booking.partnerUserId,
        'partnerName': booking.partnerName.isNotEmpty ? booking.partnerName : 'Partner',
        'carName': booking.carName,
      });
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Booking failed. Please try again.'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  // ── Build ─────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final carAsync = ref.watch(carDetailProvider(widget.carId));
    final bookedAsync = ref.watch(bookedDatesProvider(widget.carId));
    final createState = ref.watch(createBookingProvider);
    final kycAsync = ref.watch(kycStatusProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final scaffoldBg = theme.scaffoldBackgroundColor;
    final cardColor = isDark ? AppColors.bgSurface : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border : AppColors.borderLight;
    final textPrim = isDark ? AppColors.textPrimary : AppColors.textPrimaryLight;
    final textSec = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted = isDark ? AppColors.textMuted : AppColors.textMutedLight;
    final shimBase = isDark ? AppColors.bgElevated : AppColors.bgElevatedLight;

    bookedAsync.whenData(_loadBookedDates);

    // KYC guard
    kycAsync.whenData((kyc) {
      final status = kyc?.status ?? 'not_submitted';
      if (status == 'approved') return;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        if (status == 'pending') context.go('/kyc/pending');
        else context.go('/kyc/verify');
      });
    });

    return Scaffold(
      backgroundColor: scaffoldBg,
      appBar: AppBar(
        title: const Text('Book Car'),
        backgroundColor: scaffoldBg,
      ),
      body: carAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (e, _) => Center(child: Text('Failed to load car: $e', style: TextStyle(color: textMuted))),
        data: (car) {
          _car = car; // cache for price calc
          return Stack(
            children: [
              SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 160),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 8),

                    // ── Car summary card ─────────────────────────────────
                    _CarSummaryCard(
                      car: car,
                      cardColor: cardColor,
                      borderColor: borderColor,
                      textPrim: textPrim,
                      textMuted: textMuted,
                      shimBase: shimBase,
                    ),
                    const SizedBox(height: 24),

                    // ── Step 1: Dates ────────────────────────────────────
                    _StepHeader(number: 1, title: 'Pick your dates', textPrim: textPrim),
                    const SizedBox(height: 12),
                    _buildCalendar(car, cardColor, borderColor, textPrim, textSec, textMuted),
                    const SizedBox(height: 24),

                    // ── Step 2: Fulfillment ──────────────────────────────
                    _StepHeader(number: 2, title: 'How do you want the car?', textPrim: textPrim),
                    const SizedBox(height: 12),
                    _buildFulfillmentSection(
                        car, cardColor, borderColor, textPrim, textSec, textMuted, shimBase, isDark),
                    const SizedBox(height: 24),

                    // ── Step 3: Special Requests ─────────────────────────
                    _StepHeader(number: 3, title: 'Special Requests', textPrim: textPrim, optional: true),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _specialCtrl,
                      maxLines: 3,
                      style: TextStyle(color: textPrim),
                      decoration: InputDecoration(
                        hintText: 'Any special requests for the partner...',
                        hintStyle: TextStyle(color: textMuted),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // ── Step 4: Payment ──────────────────────────────────
                    _StepHeader(number: 4, title: 'How will you pay?', textPrim: textPrim),
                    const SizedBox(height: 12),
                    _buildPaymentSection(cardColor, borderColor, textPrim, textSec, textMuted, isDark),
                    const SizedBox(height: 24),

                    // ── Price summary ────────────────────────────────────
                    if (_totalDays > 0)
                      _PriceSummary(
                        car: car,
                        totalDays: _totalDays,
                        bookingFee: _kBookingFee,
                        cardColor: cardColor,
                        borderColor: borderColor,
                        textPrim: textPrim,
                        textSec: textSec,
                        isDark: isDark,
                      ),
                  ],
                ),
              ),

              // ── Sticky bottom bar ────────────────────────────────────
              Positioned(
                left: 0, right: 0, bottom: 0,
                child: _BottomBar(
                  car: car,
                  totalDays: _totalDays,
                  total: _total,
                  bookingFee: _kBookingFee,
                  isValid: _isFormValid,
                  isLoading: createState.isLoading,
                  cardColor: cardColor,
                  borderColor: borderColor,
                  textPrim: textPrim,
                  textMuted: textMuted,
                  onSubmit: () => _submit(car),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  // ── Calendar section ───────────────────────────────────────────────────────
  Widget _buildCalendar(CarModel car, Color cardColor, Color borderColor,
      Color textPrim, Color textSec, Color textMuted) {
    final shimBase = Theme.of(context).brightness == Brightness.dark
        ? AppColors.bgElevated
        : AppColors.bgElevatedLight;

    return Column(
      children: [
        Container(
          decoration: BoxDecoration(
            color: cardColor,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: borderColor),
          ),
          child: TableCalendar(
            firstDay: DateTime.now(),
            lastDay: DateTime.now().add(const Duration(days: 365)),
      focusedDay: _startDate ?? DateTime.now(),
            rangeStartDay: _startDate,
            rangeEndDay: _endDate,
            rangeSelectionMode: RangeSelectionMode.toggledOn,
            onRangeSelected: (start, end, focused) {
              setState(() {
                _startDate = start;
                // When the user taps a single day the calendar returns end=null.
                // Default to start so it counts as a valid 1-day booking.
                _endDate = end ?? start;
              });
            },
            enabledDayPredicate: (day) =>
                !_bookedDays.contains(DateTime(day.year, day.month, day.day)),
            calendarStyle: CalendarStyle(
              rangeHighlightColor: AppColors.primaryGlow,
              rangeStartDecoration:
                  const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
              rangeEndDecoration:
                  const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
              todayDecoration: BoxDecoration(color: shimBase, shape: BoxShape.circle),
              selectedDecoration:
                  const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
              disabledTextStyle: TextStyle(
                  color: textMuted, decoration: TextDecoration.lineThrough),
              defaultTextStyle: TextStyle(color: textPrim),
              weekendTextStyle: TextStyle(color: textPrim),
              outsideTextStyle: TextStyle(color: textMuted),
            ),
            headerStyle: HeaderStyle(
              formatButtonVisible: false,
              titleCentered: true,
              titleTextStyle:
                  TextStyle(color: textPrim, fontWeight: FontWeight.w700, fontSize: 15),
              leftChevronIcon: Icon(Icons.chevron_left_rounded, color: textSec),
              rightChevronIcon: Icon(Icons.chevron_right_rounded, color: textSec),
            ),
            daysOfWeekStyle: DaysOfWeekStyle(
              weekdayStyle: TextStyle(color: textMuted, fontSize: 12),
              weekendStyle: TextStyle(color: textMuted, fontSize: 12),
            ),
          ),
        ),

        // ── Legend ──────────────────────────────────────────────────────
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _LegendItem(color: AppColors.error.withOpacity(0.4), label: 'Booked (unavailable)'),
            const SizedBox(width: 16),
            _LegendItem(color: AppColors.warning.withOpacity(0.6), label: 'Pending confirmation'),
            const SizedBox(width: 16),
            _LegendItem(color: AppColors.border, label: 'Available'),
          ],
        ),

        // ── Selected range pill ──────────────────────────────────────────
        if (_startDate != null) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.primaryGlow,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.primary.withOpacity(0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.date_range_rounded, color: AppColors.primary, size: 16),
                const SizedBox(width: 8),
                Text(
                  _endDate == null
                      ? 'From: ${_fmt(_startDate!)}'
                      : '${_fmt(_startDate!)}  →  ${_fmt(_endDate!)}  ·  $_totalDays day${_totalDays == 1 ? '' : 's'}',
                  style: const TextStyle(
                      color: AppColors.primary, fontWeight: FontWeight.w600, fontSize: 13),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  // ── Fulfillment section ───────────────────────────────────────────────────
  Widget _buildFulfillmentSection(CarModel car, Color cardColor, Color borderColor,
      Color textPrim, Color textSec, Color textMuted, Color shimBase, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Chips
        Row(
          children: [
            _FulfillmentOption(
              icon: Icons.store_rounded,
              title: 'Self-Pickup',
              subtitle: 'Pick up at partner location',
              selected: _fulfillment == 'pickup',
              cardColor: cardColor,
              borderColor: borderColor,
              textPrim: textPrim,
              textSec: textSec,
              onTap: () {
                setState(() {
                  _fulfillment = 'pickup';
                  _deliveryMapReady = false;
                });
              },
            ),
            const SizedBox(width: 10),
            _FulfillmentOption(
              icon: Icons.local_shipping_rounded,
              title: 'Delivery',
              subtitle: 'Deliver to my location',
              selected: _fulfillment == 'delivery',
              cardColor: cardColor,
              borderColor: borderColor,
              textPrim: textPrim,
              textSec: textSec,
              onTap: () {
                setState(() {
                  _fulfillment = 'delivery';
                  _pickupMapReady = false;
                });
              },
            ),
          ],
        ),
        const SizedBox(height: 14),

        // ── PICKUP: show car location + map ──────────────────────────────
        if (_fulfillment == 'pickup') ...[
          Container(
            decoration: BoxDecoration(
              color: cardColor,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: borderColor),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Location info header
                Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: AppColors.primaryGlow,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.location_on_rounded,
                            color: AppColors.primary, size: 18),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Pickup at',
                                style: TextStyle(
                                    color: textMuted, fontSize: 11, fontWeight: FontWeight.w500)),
                            Text(car.location,
                                style: TextStyle(
                                    color: textPrim, fontSize: 13, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Map showing car location
                if (car.locationLat != null && car.locationLng != null) ...[
                  Stack(
                    children: [
                      SizedBox(
                        height: 200,
                        child: FlutterMap(
                          mapController: _pickupMapCtrl,
                          options: MapOptions(
                            initialCenter: LatLng(car.locationLat!, car.locationLng!),
                            initialZoom: 15,
                            interactionOptions: const InteractionOptions(
                              flags: InteractiveFlag.pinchZoom |
                                  InteractiveFlag.drag |
                                  InteractiveFlag.doubleTapZoom,
                            ),
                            onMapReady: _onPickupMapReady,
                          ),
                          children: [
                            TileLayer(
                              urlTemplate:
                                  'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                              userAgentPackageName: 'com.sakyan.app',
                              // Tile caching hint
                              maxNativeZoom: 18,
                            ),
                            MarkerLayer(
                              markers: [
                                Marker(
                                  point: LatLng(car.locationLat!, car.locationLng!),
                                  width: 44,
                                  height: 44,
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: AppColors.primary,
                                      shape: BoxShape.circle,
                                      border: Border.all(color: Colors.white, width: 2.5),
                                      boxShadow: [
                                        BoxShadow(
                                          color: AppColors.primary.withOpacity(0.4),
                                          blurRadius: 12,
                                          offset: const Offset(0, 4),
                                        ),
                                      ],
                                    ),
                                    child: const Icon(Icons.directions_car_rounded,
                                        color: Colors.white, size: 20),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      // Zoom hint
                      Positioned(
                        top: 8, right: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.black54,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text('Pinch to zoom',
                              style: TextStyle(color: Colors.white70, fontSize: 10)),
                        ),
                      ),
                    ],
                  ),
                ] else ...[
                  // No coordinates — show location text only
                  Container(
                    height: 80,
                    color: shimBase,
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.location_off_rounded, color: textMuted, size: 24),
                          const SizedBox(height: 4),
                          Text('Map not available for this location',
                              style: TextStyle(color: textMuted, fontSize: 12)),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],

        // ── DELIVERY: PSGC address + map ─────────────────────────────────
        if (_fulfillment == 'delivery') ...[
          Container(
            decoration: BoxDecoration(
              color: cardColor,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: borderColor),
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.fromLTRB(14, 14, 14, 10),
                  child: Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: AppColors.primaryGlow,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.pin_drop_rounded,
                            color: AppColors.primary, size: 18),
                      ),
                      const SizedBox(width: 12),
                      Text('Your delivery address',
                          style: TextStyle(
                              color: textPrim, fontSize: 14, fontWeight: FontWeight.w700)),
                    ],
                  ),
                ),

                // Dropdowns
                Container(
                  color: isDark ? AppColors.bgElevated : AppColors.bgElevatedLight,
                  child: Column(
                    children: [
                      // Province
                      _PsgcDropdown(
                        value: _provinceCode,
                        items: _provinces,
                        placeholder: _loadingP ? 'Loading provinces…' : 'Select Province',
                        loading: _loadingP,
                        disabled: _loadingP,
                        isDark: isDark,
                        icon: Icons.map_rounded,
                        onChanged: (code) {
                          final name = _provinces.firstWhere((p) => p.code == code).name;
                          _onProvinceChanged(code, name);
                        },
                      ),
                      Divider(height: 1, color: borderColor),
                      // City
                      _PsgcDropdown(
                        value: _cityCode,
                        items: _cities,
                        placeholder: _provinceCode.isEmpty
                            ? '— Select Province first —'
                            : (_loadingC ? 'Loading cities…' : 'Select City / Municipality'),
                        loading: _loadingC,
                        disabled: _provinceCode.isEmpty || _loadingC,
                        isDark: isDark,
                        icon: Icons.location_city_rounded,
                        onChanged: (code) {
                          final name = _cities.firstWhere((c) => c.code == code).name;
                          _onCityChanged(code, name);
                        },
                      ),
                      Divider(height: 1, color: borderColor),
                      // Barangay
                      _PsgcDropdown(
                        value: _barangays.any((b) => b.name == _barangayName)
                            ? _barangays.firstWhere((b) => b.name == _barangayName).code
                            : '',
                        items: _barangays,
                        placeholder: _cityCode.isEmpty
                            ? '— Select City first —'
                            : (_loadingB ? 'Loading barangays…' : 'Select Barangay (optional)'),
                        loading: _loadingB,
                        disabled: _cityCode.isEmpty || _loadingB,
                        isDark: isDark,
                        icon: Icons.home_rounded,
                        onChanged: (code) {
                          final item = _barangays.firstWhere((b) => b.code == code);
                          setState(() => _barangayName = item.name);
                          if (item.lat != null && item.lng != null) {
                            _moveDeliveryMap(LatLng(item.lat!, item.lng!), 15);
                          } else {
                            _flyToQuery('${item.name}, $_cityName, Philippines', 15);
                          }
                        },
                      ),
                    ],
                  ),
                ),

                // Address preview
                if (_cityName.isNotEmpty)
                  Container(
                    color: isDark
                        ? AppColors.primaryGlow.withOpacity(0.15)
                        : AppColors.primaryGlow,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    child: Row(
                      children: [
                        const Icon(Icons.location_on_outlined,
                            size: 14, color: AppColors.primary),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            _fullDeliveryAddress,
                            style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.primary,
                                fontWeight: FontWeight.w500),
                          ),
                        ),
                      ],
                    ),
                  ),

                // Delivery map
                Stack(
                  children: [
                    SizedBox(
                      height: 220,
                      child: FlutterMap(
                        mapController: _deliveryMapCtrl,
                        options: MapOptions(
                          initialCenter: _kPhCenter,
                          initialZoom: 6,
                          onTap: (_, latlng) => _onDeliveryMapTap(latlng),
                          onMapReady: _onDeliveryMapReady,
                        ),
                        children: [
                          TileLayer(
                            urlTemplate:
                                'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                            userAgentPackageName: 'com.sakyan.app',
                            maxNativeZoom: 18,
                          ),
                          if (_deliveryPin != null)
                            MarkerLayer(
                              markers: [
                                Marker(
                                  point: _deliveryPin!,
                                  width: 40,
                                  height: 40,
                                  child: const Icon(Icons.location_pin,
                                      color: AppColors.primary, size: 40),
                                ),
                              ],
                            ),
                        ],
                      ),
                    ),
                    // Hint overlay
                    Positioned(
                      top: 8, left: 0, right: 0,
                      child: Center(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.9),
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 4),
                            ],
                          ),
                          child: Text(
                            _cityName.isEmpty
                                ? 'Select a city to zoom the map'
                                : 'Tap to pin your exact drop-off location',
                            style: const TextStyle(fontSize: 11, color: Colors.black54),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),

                // Pin label
                if (_deliveryPin != null)
                  Container(
                    color: isDark ? AppColors.infoBg.withOpacity(0.3) : AppColors.infoBg,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _reversing
                            ? const SizedBox(
                                width: 14, height: 14,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: AppColors.primary))
                            : const Icon(Icons.location_on_rounded,
                                size: 14, color: AppColors.info),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _reversing ? 'Getting address…' : _deliveryPinLabel,
                            style: TextStyle(
                                fontSize: 11, color: AppColors.info, height: 1.4),
                          ),
                        ),
                      ],
                    ),
                  ),

                const SizedBox(height: 4),
              ],
            ),
          ),
        ],
      ],
    );
  }

  // ── Payment section ────────────────────────────────────────────────────────
  Widget _buildPaymentSection(Color cardColor, Color borderColor, Color textPrim,
      Color textSec, Color textMuted, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // GCash / Cash toggle
        Row(
          children: [
            _PaymentOption(
              icon: Icons.credit_card_rounded,
              label: 'GCash',
              selected: _paymentMethod == 'gcash',
              cardColor: cardColor,
              borderColor: borderColor,
              textPrim: textPrim,
              onTap: () => setState(() => _paymentMethod = 'gcash'),
            ),
            const SizedBox(width: 10),
            _PaymentOption(
              icon: Icons.payments_rounded,
              label: 'Cash',
              selected: _paymentMethod == 'cash',
              cardColor: cardColor,
              borderColor: borderColor,
              textPrim: textPrim,
              onTap: () => setState(() => _paymentMethod = 'cash'),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // Info banner — changes based on payment method
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 250),
          child: _paymentMethod == 'gcash'
              ? _PaymentInfoBanner(
                  key: const ValueKey('gcash'),
                  icon: Icons.chat_bubble_rounded,
                  color: AppColors.info,
                  isDark: isDark,
                  title: 'After approval, coordinate payment via chat',
                  body:
                      'Once the partner approves your booking, you\'ll be directed to your chat with them. '
                      'The partner will share their GCash number there so you can send the full payment.',
                )
              : _PaymentInfoBanner(
                  key: const ValueKey('cash'),
                  icon: Icons.info_rounded,
                  color: AppColors.success,
                  isDark: isDark,
                  title: 'Pay in cash on delivery day',
                  body:
                      'The full amount (rental + ₱100 booking fee) is paid in cash directly to the partner. '
                      'No upfront payment needed to submit your request.',
                ),
        ),
      ],
    );
  }

  String _fmt(DateTime d) => '${d.day}/${d.month}/${d.year}';
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _StepHeader extends StatelessWidget {
  final int number;
  final String title;
  final Color textPrim;
  final bool optional;

  const _StepHeader({
    required this.number,
    required this.title,
    required this.textPrim,
    this.optional = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: const BoxDecoration(
            color: AppColors.primary,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              '$number',
              style: const TextStyle(
                  color: Colors.white, fontSize: 13, fontWeight: FontWeight.w700),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Text(
          title,
          style: TextStyle(
              fontSize: 16, fontWeight: FontWeight.w700, color: textPrim),
        ),
        if (optional) ...[
          const SizedBox(width: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
            decoration: BoxDecoration(
              color: AppColors.primaryGlow,
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Text('Optional',
                style: TextStyle(
                    color: AppColors.primary, fontSize: 10, fontWeight: FontWeight.w600)),
          ),
        ],
      ],
    );
  }
}

class _CarSummaryCard extends StatelessWidget {
  final CarModel car;
  final Color cardColor, borderColor, textPrim, textMuted, shimBase;

  const _CarSummaryCard({
    required this.car,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textMuted,
    required this.shimBase,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Container(
              width: 72,
              height: 56,
              color: shimBase,
              child: car.primaryImageUrl != null
                  ? Image.network(car.primaryImageUrl!, fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) =>
                          Icon(Icons.directions_car_rounded, color: textMuted))
                  : Icon(Icons.directions_car_rounded, color: textMuted),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(car.name,
                    style: TextStyle(fontWeight: FontWeight.w700, color: textPrim, fontSize: 15)),
                if (car.year != null)
                  Text('${car.year} · ${car.brand}',
                      style: TextStyle(color: textMuted, fontSize: 12)),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Icon(Icons.location_on_rounded, size: 12, color: textMuted),
                    const SizedBox(width: 2),
                    Expanded(
                      child: Text(car.location,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(color: textMuted, fontSize: 12)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('₱${car.pricePerDay.toStringAsFixed(0)}',
                  style: const TextStyle(
                      color: AppColors.primary, fontWeight: FontWeight.w800, fontSize: 16)),
              Text('/day', style: TextStyle(color: textMuted, fontSize: 11)),
            ],
          ),
        ],
      ),
    );
  }
}

class _FulfillmentOption extends StatelessWidget {
  final IconData icon;
  final String title, subtitle;
  final bool selected;
  final Color cardColor, borderColor, textPrim, textSec;
  final VoidCallback onTap;

  const _FulfillmentOption({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textSec,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
          decoration: BoxDecoration(
            color: selected ? AppColors.primaryGlow : cardColor,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: selected ? AppColors.primary : borderColor,
              width: selected ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(icon,
                  color: selected ? AppColors.primary : textSec, size: 24),
              const SizedBox(height: 6),
              Text(title,
                  style: TextStyle(
                      color: selected ? AppColors.primary : textPrim,
                      fontWeight: FontWeight.w700,
                      fontSize: 13)),
              const SizedBox(height: 2),
              Text(subtitle,
                  style: TextStyle(
                      color: selected
                          ? AppColors.primary.withOpacity(0.8)
                          : textSec,
                      fontSize: 11),
                  textAlign: TextAlign.center),
            ],
          ),
        ),
      ),
    );
  }
}

class _PaymentOption extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool selected;
  final Color cardColor, borderColor, textPrim;
  final VoidCallback onTap;

  const _PaymentOption({
    required this.icon,
    required this.label,
    required this.selected,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            color: selected ? AppColors.primaryGlow : cardColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? AppColors.primary : borderColor,
              width: selected ? 2 : 1,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: selected ? AppColors.primary : textPrim, size: 18),
              const SizedBox(width: 8),
              Text(label,
                  style: TextStyle(
                      color: selected ? AppColors.primary : textPrim,
                      fontWeight: FontWeight.w600,
                      fontSize: 14)),
            ],
          ),
        ),
      ),
    );
  }
}

class _PaymentInfoBanner extends StatelessWidget {
  final IconData icon;
  final Color color;
  final bool isDark;
  final String title, body;

  const _PaymentInfoBanner({
    super.key,
    required this.icon,
    required this.color,
    required this.isDark,
    required this.title,
    required this.body,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withOpacity(isDark ? 0.12 : 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: TextStyle(
                        color: color, fontSize: 13, fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                Text(body,
                    style: TextStyle(
                        color: color.withOpacity(0.85), fontSize: 12, height: 1.5)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PsgcDropdown extends StatelessWidget {
  final String value;
  final List<_PsgcItem> items;
  final String placeholder;
  final bool loading, disabled, isDark;
  final IconData icon;
  final ValueChanged<String> onChanged;

  const _PsgcDropdown({
    required this.value,
    required this.items,
    required this.placeholder,
    this.loading = false,
    this.disabled = false,
    required this.isDark,
    required this.icon,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final textMuted = isDark ? AppColors.textMuted : AppColors.textMutedLight;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 16, color: textMuted),
          const SizedBox(width: 10),
          Expanded(
            child: DropdownButton<String>(
              value: value.isEmpty ? null : value,
              hint: Row(
                children: [
                  if (loading) ...[
                    const SizedBox(
                      width: 12, height: 12,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: AppColors.primary),
                    ),
                    const SizedBox(width: 8),
                  ],
                  Flexible(
                    child: Text(placeholder,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 13, color: textMuted)),
                  ),
                ],
              ),
              isExpanded: true,
              underline: const SizedBox.shrink(),
              disabledHint: Text(placeholder,
                  style: TextStyle(fontSize: 13, color: textMuted)),
              items: disabled
                  ? null
                  : items
                      .map((p) => DropdownMenuItem(
                            value: p.code,
                            child: Text(p.name, style: const TextStyle(fontSize: 13)),
                          ))
                      .toList(),
              onChanged: disabled ? null : (v) { if (v != null) onChanged(v); },
            ),
          ),
        ],
      ),
    );
  }
}

class _LegendItem extends StatelessWidget {
  final Color color;
  final String label;
  const _LegendItem({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 5),
        Text(label,
            style: TextStyle(
                fontSize: 10,
                color: isDark ? AppColors.textMuted : AppColors.textMutedLight)),
      ],
    );
  }
}

// ── Price Summary ─────────────────────────────────────────────────────────────
class _PriceSummary extends StatelessWidget {
  final CarModel car;
  final int totalDays;
  final double bookingFee;
  final Color cardColor, borderColor, textPrim, textSec;
  final bool isDark;

  const _PriceSummary({
    required this.car,
    required this.totalDays,
    required this.bookingFee,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textSec,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final subtotal = car.pricePerDay * totalDays;
    final total = subtotal + bookingFee;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
      ),
      child: Column(
        children: [
          _PriceRow('₱${car.pricePerDay.toStringAsFixed(0)} × $totalDays day${totalDays == 1 ? '' : 's'}',
              '₱${subtotal.toStringAsFixed(0)}',
              textPrim: textPrim, textSec: textSec),
          const SizedBox(height: 8),
          _PriceRow('Platform booking fee',
              '₱${bookingFee.toStringAsFixed(0)}',
              textPrim: textPrim,
              textSec: textSec,
              valueColor: textSec),
          Divider(color: borderColor, height: 20),
          _PriceRow('Total to pay partner',
              '₱${total.toStringAsFixed(0)}',
              textPrim: textPrim,
              textSec: textSec,
              bold: true,
              valueColor: AppColors.primary),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.success.withOpacity(isDark ? 0.12 : 0.08),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.success.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.payments_rounded, color: AppColors.success, size: 14),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Pay the full amount in cash to the partner on pickup/delivery day.',
                    style: TextStyle(
                        color: AppColors.success.withOpacity(0.9), fontSize: 11, height: 1.4),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PriceRow extends StatelessWidget {
  final String label, value;
  final bool bold;
  final Color? valueColor;
  final Color textPrim, textSec;

  const _PriceRow(this.label, this.value, {
    this.bold = false,
    this.valueColor,
    required this.textPrim,
    required this.textSec,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label,
            style: TextStyle(
                color: textSec, fontSize: bold ? 15 : 13, fontWeight: bold ? FontWeight.w600 : FontWeight.w400)),
        Text(value,
            style: TextStyle(
                color: valueColor ?? textPrim,
                fontWeight: bold ? FontWeight.w800 : FontWeight.w500,
                fontSize: bold ? 15 : 13)),
      ],
    );
  }
}

// ── Sticky bottom bar ──────────────────────────────────────────────────────────
class _BottomBar extends StatelessWidget {
  final CarModel car;
  final int totalDays;
  final double total, bookingFee;
  final bool isValid, isLoading;
  final Color cardColor, borderColor, textPrim, textMuted;
  final VoidCallback onSubmit;

  const _BottomBar({
    required this.car,
    required this.totalDays,
    required this.total,
    required this.bookingFee,
    required this.isValid,
    required this.isLoading,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textMuted,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
          20, 14, 20, MediaQuery.of(context).padding.bottom + 14),
      decoration: BoxDecoration(
        color: cardColor,
        border: Border(top: BorderSide(color: borderColor)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Row(
        children: [
          // Price summary
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (totalDays > 0) ...[
                Text(
                  '₱${total.toStringAsFixed(0)}',
                  style: const TextStyle(
                      fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.primary),
                ),
                Text(
                  'total ($totalDays day${totalDays == 1 ? '' : 's'} + ₱${bookingFee.toStringAsFixed(0)} fee)',
                  style: TextStyle(fontSize: 10, color: textMuted),
                ),
              ] else ...[
                Text('Select dates',
                    style: TextStyle(fontSize: 14, color: textMuted, fontWeight: FontWeight.w500)),
              ],
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: ElevatedButton(
              onPressed: isValid && !isLoading ? onSubmit : null,
              style: ElevatedButton.styleFrom(
                minimumSize: const Size(double.infinity, 52),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: isLoading
                  ? const SizedBox(
                      width: 22, height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Submit Booking Request',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
    );
  }
}