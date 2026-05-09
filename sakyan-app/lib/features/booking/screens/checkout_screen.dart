import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:table_calendar/table_calendar.dart';
import '../../../core/constants/app_colors.dart';
import '../../cars/models/car_model.dart';
import '../../cars/providers/cars_provider.dart';
import '../../booking/providers/booking_provider.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  final String carId;
  const CheckoutScreen({super.key, required this.carId});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  DateTime? _startDate;
  DateTime? _endDate;
  String _fulfillment   = 'pickup';
  String _paymentMethod = 'cash';
  final _deliveryCtrl   = TextEditingController();
  final _gcashRefCtrl   = TextEditingController();
  final _specialCtrl    = TextEditingController();
  Set<DateTime> _bookedDays = {};

  @override
  void dispose() {
    _deliveryCtrl.dispose();
    _gcashRefCtrl.dispose();
    _specialCtrl.dispose();
    super.dispose();
  }

  int get _totalDays {
    if (_startDate == null || _endDate == null) return 0;
    return _endDate!.difference(_startDate!).inDays + 1;
  }

  bool get _isFormValid {
    if (_startDate == null || _endDate == null) return false;
    if (_fulfillment == 'delivery' && _deliveryCtrl.text.trim().isEmpty) {
      return false;
    }
    if (_paymentMethod == 'gcash' && _gcashRefCtrl.text.trim().isEmpty) {
      return false;
    }
    return true;
  }

  bool _isBooked(DateTime day) {
    return _bookedDays.contains(DateTime(day.year, day.month, day.day));
  }

  void _loadBookedDates(List<Map<String, String>> dates) {
    final days = <DateTime>{};
    for (final d in dates) {
      final start = DateTime.tryParse(d['start_date'] ?? '');
      final end   = DateTime.tryParse(d['end_date']   ?? '');
      if (start == null || end == null) continue;
      for (var dt = start;
          !dt.isAfter(end);
          dt = dt.add(const Duration(days: 1))) {
        days.add(DateTime(dt.year, dt.month, dt.day));
      }
    }
    if (mounted) setState(() => _bookedDays = days);
  }

  Future<void> _submit(CarModel car) async {
    if (!_isFormValid) return;
    final data = {
      'car':              car.id,
      'start_date':       _startDate!.toIso8601String().substring(0, 10),
      'end_date':         _endDate!.toIso8601String().substring(0, 10),
      'fulfillment_type': _fulfillment,
      'delivery_address': _fulfillment == 'delivery'
          ? _deliveryCtrl.text.trim()
          : '',
      'payment_method':  _paymentMethod,
      'gcash_reference': _paymentMethod == 'gcash'
          ? _gcashRefCtrl.text.trim()
          : '',
      'special_requests': _specialCtrl.text.trim(),
      'pickup_location':  car.location,
      'return_location':  car.location,
    };
    final booking =
        await ref.read(createBookingProvider.notifier).create(data);
    if (booking != null && mounted) {
      context.go('/confirmation/${booking.bookingCode}');
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Booking failed. Please try again.'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final carAsync    = ref.watch(carDetailProvider(widget.carId));
    final bookedAsync = ref.watch(bookedDatesProvider(widget.carId));
    final createState = ref.watch(createBookingProvider);
    final theme       = Theme.of(context);
    final isDark      = theme.brightness == Brightness.dark;

    final cardColor   = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;
    final shimBase    = isDark ? AppColors.bgElevated    : AppColors.bgElevatedLight;

    bookedAsync.whenData(_loadBookedDates);

    return Scaffold(
      appBar: AppBar(title: const Text('Book Car')),
      body: carAsync.when(
        loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.primary)),
        error: (e, _) => Center(
          child: Text('Failed to load car: $e',
              style: TextStyle(color: textMuted)),
        ),
        data: (car) => Stack(
          children: [
            SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 140),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Car summary card ───────────────────────────────────
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color:        cardColor,
                      borderRadius: BorderRadius.circular(14),
                      border:       Border.all(color: borderColor),
                    ),
                    child: Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: Container(
                            width: 60,
                            height: 60,
                            color: shimBase,
                            child: car.primaryImageUrl != null
                                ? Image.network(car.primaryImageUrl!,
                                    fit: BoxFit.cover)
                                : Icon(Icons.directions_car_rounded,
                                    color: textMuted),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(car.name,
                                  style: TextStyle(
                                      fontWeight: FontWeight.w700,
                                      color: textPrim)),
                              Text(car.location,
                                  style: TextStyle(
                                      color: textMuted, fontSize: 12)),
                              Text(
                                '₱${car.pricePerDay.toStringAsFixed(0)}/day',
                                style: const TextStyle(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // ── Date picker ────────────────────────────────────────
                  Text('Select Dates',
                      style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: textPrim)),
                  const SizedBox(height: 10),
                  Container(
                    decoration: BoxDecoration(
                      color:        cardColor,
                      borderRadius: BorderRadius.circular(14),
                      border:       Border.all(color: borderColor),
                    ),
                    child: TableCalendar(
                      firstDay: DateTime.now(),
                      lastDay: DateTime.now().add(const Duration(days: 365)),
                      focusedDay:         _startDate ?? DateTime.now(),
                      rangeStartDay:      _startDate,
                      rangeEndDay:        _endDate,
                      rangeSelectionMode: RangeSelectionMode.toggledOn,
                      onRangeSelected: (start, end, focused) {
                        setState(() {
                          _startDate = start;
                          _endDate   = end;
                        });
                      },
                      enabledDayPredicate: (day) => !_isBooked(day),
                      calendarStyle: CalendarStyle(
                        rangeHighlightColor:  AppColors.primaryGlow,
                        rangeStartDecoration: const BoxDecoration(
                            color: AppColors.primary, shape: BoxShape.circle),
                        rangeEndDecoration: const BoxDecoration(
                            color: AppColors.primary, shape: BoxShape.circle),
                        todayDecoration: BoxDecoration(
                            color: shimBase, shape: BoxShape.circle),
                        selectedDecoration: const BoxDecoration(
                            color: AppColors.primary, shape: BoxShape.circle),
                        disabledTextStyle: TextStyle(
                            color: textMuted,
                            decoration: TextDecoration.lineThrough),
                        defaultTextStyle: TextStyle(color: textPrim),
                        weekendTextStyle: TextStyle(color: textPrim),
                        outsideTextStyle: TextStyle(color: textMuted),
                      ),
                      headerStyle: HeaderStyle(
                        formatButtonVisible: false,
                        titleCentered: true,
                        titleTextStyle: TextStyle(
                            color: textPrim, fontWeight: FontWeight.w600),
                        leftChevronIcon: Icon(Icons.chevron_left_rounded,
                            color: textSec),
                        rightChevronIcon: Icon(Icons.chevron_right_rounded,
                            color: textSec),
                      ),
                      daysOfWeekStyle: DaysOfWeekStyle(
                        weekdayStyle: TextStyle(color: textMuted, fontSize: 12),
                        weekendStyle: TextStyle(color: textMuted, fontSize: 12),
                      ),
                    ),
                  ),
                  if (_startDate != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color:        AppColors.primaryGlow,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                            color: AppColors.primary.withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.date_range_rounded,
                              color: AppColors.primary, size: 18),
                          const SizedBox(width: 8),
                          Text(
                            _endDate == null
                                ? 'From: ${_fmt(_startDate!)}'
                                : '${_fmt(_startDate!)}  →  ${_fmt(_endDate!)}  ($_totalDays day${_totalDays == 1 ? '' : 's'})',
                            style: const TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w600,
                                fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 24),

                  // ── Fulfillment ────────────────────────────────────────
                  Text('Pickup Option',
                      style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: textPrim)),
                  const SizedBox(height: 10),
                  Row(children: [
                    _FulfillmentChip(
                      label:    'Self-Pickup',
                      selected: _fulfillment == 'pickup',
                      cardColor: cardColor,
                      borderColor: borderColor,
                      onTap: () => setState(() => _fulfillment = 'pickup'),
                    ),
                    const SizedBox(width: 10),
                    _FulfillmentChip(
                      label:    'Delivery',
                      selected: _fulfillment == 'delivery',
                      cardColor: cardColor,
                      borderColor: borderColor,
                      onTap: () => setState(() => _fulfillment = 'delivery'),
                    ),
                  ]),
                  if (_fulfillment == 'delivery') ...[
                    const SizedBox(height: 12),
                    TextField(
                      controller: _deliveryCtrl,
                      style: TextStyle(color: textPrim),
                      decoration: InputDecoration(
                        hintText:   'Enter delivery address',
                        prefixIcon: Icon(Icons.location_on_rounded,
                            color: textMuted),
                      ),
                    ),
                  ],
                  const SizedBox(height: 24),

                  // ── Payment method ─────────────────────────────────────
                  Text('Payment Method',
                      style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: textPrim)),
                  const SizedBox(height: 4),
                  Text(
                    'Coordinate payment details with the partner via in-app chat after booking.',
                    style: TextStyle(color: textMuted, fontSize: 12),
                  ),
                  const SizedBox(height: 10),
                  Row(children: [
                    _FulfillmentChip(
                      label:    '💵 Cash',
                      selected: _paymentMethod == 'cash',
                      cardColor: cardColor,
                      borderColor: borderColor,
                      onTap: () => setState(() => _paymentMethod = 'cash'),
                    ),
                    const SizedBox(width: 10),
                    _FulfillmentChip(
                      label:    '📱 GCash',
                      selected: _paymentMethod == 'gcash',
                      cardColor: cardColor,
                      borderColor: borderColor,
                      onTap: () => setState(() => _paymentMethod = 'gcash'),
                    ),
                  ]),
                  if (_paymentMethod == 'gcash') ...[
                    const SizedBox(height: 12),
                    TextField(
                      controller: _gcashRefCtrl,
                      style: TextStyle(color: textPrim),
                      decoration: InputDecoration(
                        hintText:   'GCash reference number',
                        prefixIcon:
                            Icon(Icons.receipt_rounded, color: textMuted),
                      ),
                    ),
                  ],
                  const SizedBox(height: 24),

                  // ── Special requests ───────────────────────────────────
                  Text('Special Requests (Optional)',
                      style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: textPrim)),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _specialCtrl,
                    maxLines: 3,
                    style: TextStyle(color: textPrim),
                    decoration: const InputDecoration(
                        hintText:
                            'Any special requests for the partner...'),
                  ),
                  const SizedBox(height: 24),

                  // ── Price summary ──────────────────────────────────────
                  if (_totalDays > 0)
                    _PriceSummary(
                      car: car,
                      totalDays: _totalDays,
                      cardColor: cardColor,
                      borderColor: borderColor,
                      textPrim: textPrim,
                      textSec: textSec,
                    ),
                ],
              ),
            ),

            // ── Confirm button ─────────────────────────────────────────
            Positioned(
              left: 0, right: 0, bottom: 0,
              child: Container(
                padding: EdgeInsets.fromLTRB(
                    20, 16, 20,
                    MediaQuery.of(context).padding.bottom + 16),
                decoration: BoxDecoration(
                  color:  cardColor,
                  border: Border(top: BorderSide(color: borderColor)),
                ),
                child: ElevatedButton(
                  onPressed: _isFormValid && !createState.isLoading
                      ? () => _submit(car)
                      : null,
                  child: createState.isLoading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Confirm Booking',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.w700)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _fmt(DateTime d) => '${d.day}/${d.month}/${d.year}';
}

// ── Price summary ─────────────────────────────────────────────────────────────
class _PriceSummary extends StatelessWidget {
  final CarModel car;
  final int totalDays;
  final Color cardColor, borderColor, textPrim, textSec;

  const _PriceSummary({
    required this.car,
    required this.totalDays,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textSec,
  });

  @override
  Widget build(BuildContext context) {
    final subtotal = car.pricePerDay * totalDays;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color:        cardColor,
        borderRadius: BorderRadius.circular(14),
        border:       Border.all(color: borderColor),
      ),
      child: Column(
        children: [
          _Row('Price per day', '₱${car.pricePerDay.toStringAsFixed(0)}',
              textPrim: textPrim, textSec: textSec),
          _Row('Total days', '$totalDays',
              textPrim: textPrim, textSec: textSec),
          Divider(color: borderColor, height: 20),
          _Row('Subtotal', '₱${subtotal.toStringAsFixed(0)}',
              bold: true,
              color: AppColors.primary,
              textPrim: textPrim,
              textSec: textSec),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final String label;
  final String value;
  final bool   bold;
  final Color? color;
  final Color  textPrim, textSec;

  const _Row(this.label, this.value, {
    this.bold = false,
    this.color,
    required this.textPrim,
    required this.textSec,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: TextStyle(
                  color: textSec, fontSize: bold ? 16 : 14)),
          Text(value,
              style: TextStyle(
                  color: color ?? textPrim,
                  fontWeight: bold ? FontWeight.w700 : FontWeight.w400,
                  fontSize: bold ? 16 : 14)),
        ],
      ),
    );
  }
}

// ── Fulfillment chip ──────────────────────────────────────────────────────────
class _FulfillmentChip extends StatelessWidget {
  final String       label;
  final bool         selected;
  final Color        cardColor, borderColor;
  final VoidCallback onTap;

  const _FulfillmentChip({
    required this.label,
    required this.selected,
    required this.cardColor,
    required this.borderColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: selected ? AppColors.primaryGlow : cardColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? AppColors.primary : borderColor,
              width: selected ? 1.5 : 1,
            ),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                color:      selected ? AppColors.primary : Colors.grey,
                fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                fontSize:   14,
              ),
            ),
          ),
        ),
      ),
    );
  }
}