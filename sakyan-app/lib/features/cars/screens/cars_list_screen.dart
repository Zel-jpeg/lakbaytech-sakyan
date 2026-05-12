import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../../core/constants/app_colors.dart';
import '../../cars/models/car_model.dart';
import '../../cars/providers/cars_provider.dart';

// ── View mode ─────────────────────────────────────────────────────────────────
enum _ViewMode { grid, list }

class CarsListScreen extends ConsumerStatefulWidget {
  const CarsListScreen({super.key});

  @override
  ConsumerState<CarsListScreen> createState() => _CarsListScreenState();
}

class _CarsListScreenState extends ConsumerState<CarsListScreen> {
  final _searchCtrl = TextEditingController();
  _ViewMode _viewMode = _ViewMode.grid;

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _updateFilter(CarFilters Function(CarFilters) updater) {
    final cur = ref.read(carFiltersProvider);
    ref.read(carFiltersProvider.notifier).state = updater(cur);
  }

  void _clearFilters() {
    _searchCtrl.clear();
    ref.read(carFiltersProvider.notifier).state = const CarFilters();
  }

  // ── Opens the full filter bottom sheet ────────────────────────────────────
  void _openFilterSheet(BuildContext ctx, CarFilters current, bool isDark) {
    showModalBottomSheet(
      context: ctx,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _FilterSheet(
        initial: current,
        isDark: isDark,
        onApply: (updated) {
          ref.read(carFiltersProvider.notifier).state = updated;
        },
        onClear: _clearFilters,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filters   = ref.watch(carFiltersProvider);
    final carsAsync = ref.watch(carsListProvider);
    final theme     = Theme.of(context);
    final isDark    = theme.brightness == Brightness.dark;

    final scaffoldBg  = theme.scaffoldBackgroundColor;
    final cardColor   = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;
    final shimBase    = isDark ? AppColors.bgSurface     : AppColors.bgElevatedLight;
    final shimHigh    = isDark ? AppColors.bgElevated    : AppColors.bgSubtleLight;
    final elevBg      = isDark ? AppColors.bgElevated    : AppColors.bgElevatedLight;

    final activeCount = filters.activeFilterCount;
    final resultCount = carsAsync.value?.length;

    return Scaffold(
      backgroundColor: scaffoldBg,
      appBar: AppBar(
        backgroundColor: scaffoldBg,
        title: const Text('Browse Cars'),
        actions: [
          // Grid / List toggle
          IconButton(
            icon: Icon(
              _viewMode == _ViewMode.grid
                  ? Icons.view_list_rounded
                  : Icons.grid_view_rounded,
              color: textSec,
            ),
            tooltip: _viewMode == _ViewMode.grid ? 'List view' : 'Grid view',
            onPressed: () => setState(() {
              _viewMode = _viewMode == _ViewMode.grid
                  ? _ViewMode.list
                  : _ViewMode.grid;
            }),
          ),
        ],
      ),
      body: Column(
        children: [
          // ── Search + Filter bar ──────────────────────────────────────────
          Container(
            color: scaffoldBg,
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Row: search + filter button
                Row(
                  children: [
                    // Search field
                    Expanded(
                      child: TextField(
                        controller: _searchCtrl,
                        onChanged: (v) =>
                            _updateFilter((f) => f.copyWith(search: v)),
                        style: TextStyle(color: textPrim, fontSize: 14),
                        decoration: InputDecoration(
                          hintText: 'Search by name, brand, location…',
                          prefixIcon:
                              Icon(Icons.search_rounded, color: textMuted, size: 20),
                          suffixIcon: _searchCtrl.text.isNotEmpty
                              ? IconButton(
                                  icon: Icon(Icons.close_rounded,
                                      color: textMuted, size: 18),
                                  onPressed: () {
                                    _searchCtrl.clear();
                                    _updateFilter((f) => f.copyWith(search: ''));
                                  },
                                )
                              : null,
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 12),
                          isDense: true,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),

                    // Filter button with badge
                    GestureDetector(
                      onTap: () => _openFilterSheet(context, filters, isDark),
                      child: Stack(
                        clipBehavior: Clip.none,
                        children: [
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 180),
                            width: 46, height: 46,
                            decoration: BoxDecoration(
                              color: activeCount > 0
                                  ? AppColors.primary
                                  : (isDark
                                      ? AppColors.bgSurface
                                      : AppColors.bgSurfaceLight),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: activeCount > 0
                                    ? AppColors.primary
                                    : borderColor,
                              ),
                            ),
                            child: Icon(
                              Icons.tune_rounded,
                              color: activeCount > 0
                                  ? Colors.white
                                  : textSec,
                              size: 22,
                            ),
                          ),
                          if (activeCount > 0)
                            Positioned(
                              top: -5, right: -5,
                              child: Container(
                                width: 18, height: 18,
                                decoration: const BoxDecoration(
                                  color: AppColors.error,
                                  shape: BoxShape.circle,
                                ),
                                child: Center(
                                  child: Text(
                                    '$activeCount',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),

                // ── Quick pills row ─────────────────────────────────────────
                const SizedBox(height: 10),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      // Available only toggle
                      _QuickPill(
                        icon: Icons.check_circle_rounded,
                        label: 'Available',
                        active: filters.availableOnly,
                        isDark: isDark,
                        onTap: () => _updateFilter(
                            (f) => f.copyWith(availableOnly: !f.availableOnly)),
                      ),
                      const SizedBox(width: 8),

                      // Sort pill — shows current sort
                      _QuickPill(
                        icon: Icons.sort_rounded,
                        label: filters.sortBy == CarSortBy.recommended
                            ? 'Sort'
                            : filters.sortBy.label,
                        active: filters.sortBy != CarSortBy.recommended,
                        isDark: isDark,
                        onTap: () => _showSortPicker(context, filters, isDark),
                      ),
                      const SizedBox(width: 8),

                      // Transmission quick pills
                      _QuickPill(
                        icon: Icons.settings_rounded,
                        label: 'Manual',
                        active: filters.transmission == 'manual',
                        isDark: isDark,
                        onTap: () => _updateFilter((f) => f.copyWith(
                              transmission:
                                  f.transmission == 'manual' ? null : 'manual',
                            )),
                      ),
                      const SizedBox(width: 8),
                      _QuickPill(
                        icon: Icons.auto_mode_rounded,
                        label: 'Automatic',
                        active: filters.transmission == 'automatic',
                        isDark: isDark,
                        onTap: () => _updateFilter((f) => f.copyWith(
                              transmission: f.transmission == 'automatic'
                                  ? null
                                  : 'automatic',
                            )),
                      ),
                      const SizedBox(width: 8),

                      // Price cap pills
                      _QuickPill(
                        icon: Icons.currency_exchange_rounded,
                        label: '≤ ₱1,500',
                        active: filters.maxPrice == 1500,
                        isDark: isDark,
                        onTap: () => _updateFilter((f) => f.copyWith(
                              maxPrice: f.maxPrice == 1500 ? null : 1500.0,
                            )),
                      ),
                      const SizedBox(width: 8),
                      _QuickPill(
                        icon: Icons.currency_exchange_rounded,
                        label: '≤ ₱3,000',
                        active: filters.maxPrice == 3000,
                        isDark: isDark,
                        onTap: () => _updateFilter((f) => f.copyWith(
                              maxPrice: f.maxPrice == 3000 ? null : 3000.0,
                            )),
                      ),

                      if (filters.hasActiveFilters) ...[
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: _clearFilters,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 7),
                            decoration: BoxDecoration(
                              color: AppColors.error.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                  color: AppColors.error.withOpacity(0.3)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: const [
                                Icon(Icons.close_rounded,
                                    size: 13, color: AppColors.error),
                                SizedBox(width: 4),
                                Text('Clear',
                                    style: TextStyle(
                                        color: AppColors.error,
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),

                // ── Result count ────────────────────────────────────────────
                if (resultCount != null) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Text(
                        '$resultCount car${resultCount == 1 ? '' : 's'} found',
                        style: TextStyle(
                            color: textMuted,
                            fontSize: 12,
                            fontWeight: FontWeight.w500),
                      ),
                      if (filters.hasActiveFilters) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'Filtered',
                            style: TextStyle(
                                color: AppColors.primary,
                                fontSize: 10,
                                fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ],
            ),
          ),

          Divider(height: 1, color: borderColor),

          // ── Cars List / Grid ─────────────────────────────────────────────
          Expanded(
            child: carsAsync.when(
              loading: () => _viewMode == _ViewMode.grid
                  ? _ShimmerGrid(shimBase: shimBase, shimHigh: shimHigh)
                  : _ShimmerList(shimBase: shimBase, shimHigh: shimHigh),
              error: (e, _) => _ErrorView(
                textMuted: textMuted,
                onRetry: () => ref.invalidate(carsListProvider),
              ),
              data: (cars) {
                if (cars.isEmpty) {
                  return _EmptyView(
                    hasFilters: filters.hasActiveFilters,
                    textMuted: textMuted,
                    onClear: _clearFilters,
                  );
                }
                return _viewMode == _ViewMode.grid
                    ? _CarsGrid(
                        cars: cars,
                        cardColor: cardColor,
                        borderColor: borderColor,
                        textPrim: textPrim,
                        textMuted: textMuted,
                        textSec: textSec,
                        shimBase: shimBase,
                        elevBg: elevBg,
                        isDark: isDark,
                      )
                    : _CarsList(
                        cars: cars,
                        cardColor: cardColor,
                        borderColor: borderColor,
                        textPrim: textPrim,
                        textMuted: textMuted,
                        textSec: textSec,
                        shimBase: shimBase,
                        isDark: isDark,
                      );
              },
            ),
          ),
        ],
      ),
    );
  }

  // ── Sort picker bottom dialog ─────────────────────────────────────────────
  void _showSortPicker(
      BuildContext ctx, CarFilters filters, bool isDark) {
    final bg = isDark ? AppColors.bgSurface : AppColors.bgSurfaceLight;
    final textPrim =
        isDark ? AppColors.textPrimary : AppColors.textPrimaryLight;

    showModalBottomSheet(
      context: ctx,
      backgroundColor: bg,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => Padding(
        padding: EdgeInsets.fromLTRB(
            20, 16, 20, MediaQuery.of(ctx).padding.bottom + 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 36, height: 4,
                decoration: BoxDecoration(
                  color: isDark ? AppColors.border : AppColors.borderLight,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text('Sort By',
                style: TextStyle(
                    color: textPrim,
                    fontSize: 17,
                    fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            ...CarSortBy.values.map((s) {
              final sel = filters.sortBy == s;
              return ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Icon(
                  sel
                      ? Icons.radio_button_checked_rounded
                      : Icons.radio_button_off_rounded,
                  color: sel ? AppColors.primary : AppColors.textMuted,
                ),
                title: Text(s.label,
                    style: TextStyle(
                        color: sel ? AppColors.primary : textPrim,
                        fontWeight: sel ? FontWeight.w700 : FontWeight.w500,
                        fontSize: 14)),
                onTap: () {
                  _updateFilter((f) => f.copyWith(sortBy: s));
                  Navigator.of(ctx).pop();
                },
              );
            }),
          ],
        ),
      ),
    );
  }
}

// ── Quick pill ────────────────────────────────────────────────────────────────
class _QuickPill extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool active, isDark;
  final VoidCallback onTap;

  const _QuickPill({
    required this.icon,
    required this.label,
    required this.active,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final bg     = isDark ? AppColors.bgSurface : AppColors.bgSurfaceLight;
    final border = isDark ? AppColors.border    : AppColors.borderLight;
    final text   = isDark ? AppColors.textMuted : AppColors.textMutedLight;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: active
              ? AppColors.primary.withOpacity(0.12)
              : bg,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: active ? AppColors.primary : border,
            width: active ? 1.5 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon,
                size: 13,
                color: active ? AppColors.primary : text),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight:
                    active ? FontWeight.w700 : FontWeight.w500,
                color: active ? AppColors.primary : text,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FILTER SHEET
// ─────────────────────────────────────────────────────────────────────────────
class _FilterSheet extends StatefulWidget {
  final CarFilters initial;
  final bool isDark;
  final ValueChanged<CarFilters> onApply;
  final VoidCallback onClear;

  const _FilterSheet({
    required this.initial,
    required this.isDark,
    required this.onApply,
    required this.onClear,
  });

  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  late CarFilters _draft;

  // Price range — use 0 when no min, 10000 as upper cap
  static const double _priceMin = 0;
  static const double _priceMax = 10000;

  late RangeValues _priceRange;

  static const _transmissions = [null, 'manual', 'automatic'];
  static const _transmissionLabels = ['Any', 'Manual', 'Automatic'];
  static const _fuelTypes = [null, 'gasoline', 'diesel', 'electric', 'hybrid'];
  static const _fuelLabels = ['Any', 'Gasoline', 'Diesel', 'Electric', 'Hybrid'];
  static const _seatOptions = [null, 2, 4, 5, 6, 7, 8];

  @override
  void initState() {
    super.initState();
    _draft = widget.initial;
    _priceRange = RangeValues(
      widget.initial.minPrice ?? _priceMin,
      widget.initial.maxPrice ?? _priceMax,
    );
  }

  void _apply() {
    final updated = _draft.copyWith(
      minPrice: _priceRange.start > _priceMin ? _priceRange.start : null,
      maxPrice: _priceRange.end   < _priceMax ? _priceRange.end   : null,
    );
    widget.onApply(updated);
    Navigator.of(context).pop();
  }

  void _reset() {
    setState(() {
      _draft = const CarFilters();
      _priceRange = const RangeValues(_priceMin, _priceMax);
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark  = widget.isDark;
    final bg      = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final sectionBg = isDark ? AppColors.bgBase     : const Color(0xFFF9FAFB);
    final border  = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim = isDark ? AppColors.textPrimary  : AppColors.textPrimaryLight;
    final textSec  = isDark ? AppColors.textSecondary: AppColors.textSecondaryLight;
    final textMuted = isDark ? AppColors.textMuted   : AppColors.textMutedLight;

    final activeCount = _draft.copyWith(
      minPrice: _priceRange.start > _priceMin ? _priceRange.start : null,
      maxPrice: _priceRange.end   < _priceMax ? _priceRange.end   : null,
    ).activeFilterCount;

    return DraggableScrollableSheet(
      initialChildSize: 0.88,
      minChildSize:     0.5,
      maxChildSize:     0.97,
      builder: (_, sc) => Container(
        decoration: BoxDecoration(
          color: bg,
          borderRadius:
              const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            // Handle
            Padding(
              padding: const EdgeInsets.only(top: 12, bottom: 4),
              child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                    color: border,
                    borderRadius: BorderRadius.circular(2)),
              ),
            ),

            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 12, 0),
              child: Row(
                children: [
                  Text('Filters',
                      style: TextStyle(
                          color: textPrim,
                          fontSize: 18,
                          fontWeight: FontWeight.w700)),
                  if (activeCount > 0) ...[
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text('$activeCount active',
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w600)),
                    ),
                  ],
                  const Spacer(),
                  TextButton(
                    onPressed: _reset,
                    child: Text('Reset all',
                        style: TextStyle(
                            color: textMuted, fontSize: 13)),
                  ),
                  IconButton(
                    icon: Icon(Icons.close_rounded, color: textMuted),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),

            Divider(height: 1, color: border),

            // Scrollable body
            Expanded(
              child: SingleChildScrollView(
                controller: sc,
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── Sort ───────────────────────────────────────────────
                    _SheetSection(label: 'Sort By', textMuted: textMuted),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8, runSpacing: 8,
                      children: CarSortBy.values.map((s) {
                        final sel = _draft.sortBy == s;
                        return _SheetChip(
                          label: s.label,
                          selected: sel,
                          isDark: isDark,
                          onTap: () =>
                              setState(() => _draft = _draft.copyWith(sortBy: s)),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 24),

                    // ── Availability ───────────────────────────────────────
                    _SheetSection(label: 'Availability', textMuted: textMuted),
                    const SizedBox(height: 10),
                    GestureDetector(
                      onTap: () => setState(() => _draft =
                          _draft.copyWith(availableOnly: !_draft.availableOnly)),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          color: _draft.availableOnly
                              ? AppColors.success.withOpacity(0.08)
                              : sectionBg,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: _draft.availableOnly
                                ? AppColors.success.withOpacity(0.4)
                                : border,
                            width: _draft.availableOnly ? 1.5 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            AnimatedContainer(
                              duration: const Duration(milliseconds: 180),
                              width: 22, height: 22,
                              decoration: BoxDecoration(
                                color: _draft.availableOnly
                                    ? AppColors.success
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: _draft.availableOnly
                                      ? AppColors.success
                                      : textMuted,
                                  width: 1.5,
                                ),
                              ),
                              child: _draft.availableOnly
                                  ? const Icon(Icons.check_rounded,
                                      size: 14, color: Colors.white)
                                  : null,
                            ),
                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Available cars only',
                                    style: TextStyle(
                                        color: textPrim,
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600)),
                                Text('Hide cars that are currently booked',
                                    style: TextStyle(
                                        color: textMuted, fontSize: 11)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // ── Price Range ────────────────────────────────────────
                    _SheetSection(label: 'Price per Day', textMuted: textMuted),
                    const SizedBox(height: 6),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        _PriceTag(
                          label: 'Min',
                          value: _priceRange.start <= _priceMin
                              ? 'Any'
                              : '₱${_priceRange.start.toStringAsFixed(0)}',
                          isDark: isDark,
                          textMuted: textMuted,
                          textPrim: textPrim,
                        ),
                        Text('–',
                            style:
                                TextStyle(color: textMuted, fontSize: 14)),
                        _PriceTag(
                          label: 'Max',
                          value: _priceRange.end >= _priceMax
                              ? 'Any'
                              : '₱${_priceRange.end.toStringAsFixed(0)}',
                          isDark: isDark,
                          textMuted: textMuted,
                          textPrim: textPrim,
                        ),
                      ],
                    ),
                    SliderTheme(
                      data: SliderTheme.of(context).copyWith(
                        activeTrackColor: AppColors.primary,
                        inactiveTrackColor:
                            AppColors.primary.withOpacity(0.15),
                        thumbColor: AppColors.primary,
                        overlayColor:
                            AppColors.primary.withOpacity(0.12),
                        rangeThumbShape:
                            const RoundRangeSliderThumbShape(
                                enabledThumbRadius: 10),
                        trackHeight: 4,
                      ),
                      child: RangeSlider(
                        values: _priceRange,
                        min: _priceMin,
                        max: _priceMax,
                        divisions: 100,
                        onChanged: (v) => setState(() => _priceRange = v),
                      ),
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('₱0',
                            style:
                                TextStyle(color: textMuted, fontSize: 11)),
                        Text('₱10,000+',
                            style:
                                TextStyle(color: textMuted, fontSize: 11)),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // ── Transmission ───────────────────────────────────────
                    _SheetSection(
                        label: 'Transmission', textMuted: textMuted),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8, runSpacing: 8,
                      children: List.generate(
                          _transmissions.length,
                          (i) => _SheetChip(
                                label: _transmissionLabels[i],
                                selected:
                                    _draft.transmission == _transmissions[i],
                                isDark: isDark,
                                onTap: () => setState(() => _draft =
                                    _draft.copyWith(
                                        transmission: _transmissions[i])),
                              )),
                    ),
                    const SizedBox(height: 24),

                    // ── Fuel Type ──────────────────────────────────────────
                    _SheetSection(label: 'Fuel Type', textMuted: textMuted),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8, runSpacing: 8,
                      children: List.generate(
                          _fuelTypes.length,
                          (i) => _SheetChip(
                                label: _fuelLabels[i],
                                selected: _draft.fuelType == _fuelTypes[i],
                                isDark: isDark,
                                onTap: () => setState(() => _draft =
                                    _draft.copyWith(fuelType: _fuelTypes[i])),
                              )),
                    ),
                    const SizedBox(height: 24),

                    // ── Min Seats ──────────────────────────────────────────
                    _SheetSection(
                        label: 'Minimum Seats', textMuted: textMuted),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8, runSpacing: 8,
                      children: _seatOptions.map((s) {
                        final sel = _draft.minSeats == s;
                        return _SheetChip(
                          label: s == null ? 'Any' : '$s+ seats',
                          selected: sel,
                          isDark: isDark,
                          onTap: () => setState(
                              () => _draft = _draft.copyWith(minSeats: s)),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),

            // ── Sticky apply button ────────────────────────────────────────
            Container(
              padding: EdgeInsets.fromLTRB(
                  20, 12, 20, MediaQuery.of(context).padding.bottom + 12),
              decoration: BoxDecoration(
                color: bg,
                border:
                    Border(top: BorderSide(color: border)),
              ),
              child: ElevatedButton(
                onPressed: _apply,
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 52),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                ),
                child: Text(
                  activeCount > 0
                      ? 'Apply $activeCount Filter${activeCount == 1 ? '' : 's'}'
                      : 'Show All Cars',
                  style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Sheet helpers ─────────────────────────────────────────────────────────────
class _SheetSection extends StatelessWidget {
  final String label;
  final Color textMuted;
  const _SheetSection({required this.label, required this.textMuted});

  @override
  Widget build(BuildContext context) => Text(
        label.toUpperCase(),
        style: TextStyle(
          color: textMuted,
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.8,
        ),
      );
}

class _SheetChip extends StatelessWidget {
  final String label;
  final bool selected, isDark;
  final VoidCallback onTap;

  const _SheetChip({
    required this.label,
    required this.selected,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final bg     = isDark ? AppColors.bgElevated : AppColors.bgElevatedLight;
    final border = isDark ? AppColors.border     : AppColors.borderLight;
    final text   = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.primary.withOpacity(0.12)
              : bg,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: selected ? AppColors.primary : border,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight:
                selected ? FontWeight.w700 : FontWeight.w500,
            color: selected ? AppColors.primary : text,
          ),
        ),
      ),
    );
  }
}

class _PriceTag extends StatelessWidget {
  final String label, value;
  final bool isDark;
  final Color textMuted, textPrim;

  const _PriceTag({
    required this.label,
    required this.value,
    required this.isDark,
    required this.textMuted,
    required this.textPrim,
  });

  @override
  Widget build(BuildContext context) {
    final bg     = isDark ? AppColors.bgElevated : AppColors.bgElevatedLight;
    final border = isDark ? AppColors.border     : AppColors.borderLight;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: border),
      ),
      child: Column(
        children: [
          Text(label,
              style: TextStyle(color: textMuted, fontSize: 10)),
          const SizedBox(height: 2),
          Text(value,
              style: TextStyle(
                  color: value == 'Any' ? textMuted : AppColors.primary,
                  fontSize: 13,
                  fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CAR GRID VIEW
// ─────────────────────────────────────────────────────────────────────────────
class _CarsGrid extends StatelessWidget {
  final List<CarModel> cars;
  final Color cardColor, borderColor, textPrim, textMuted, textSec, shimBase,
      elevBg;
  final bool isDark;

  const _CarsGrid({
    required this.cars,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textMuted,
    required this.textSec,
    required this.shimBase,
    required this.elevBg,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount:   2,
        crossAxisSpacing: 12,
        mainAxisSpacing:  12,
        childAspectRatio: 0.70,
      ),
      itemCount: cars.length,
      itemBuilder: (_, i) => _CarGridCard(
        car: cars[i],
        cardColor:   cardColor,
        borderColor: borderColor,
        textPrim:    textPrim,
        textMuted:   textMuted,
        textSec:     textSec,
        shimBase:    shimBase,
        elevBg:      elevBg,
      ),
    );
  }
}

class _CarGridCard extends StatelessWidget {
  final CarModel car;
  final Color cardColor, borderColor, textPrim, textMuted, textSec, shimBase,
      elevBg;

  const _CarGridCard({
    required this.car,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textMuted,
    required this.textSec,
    required this.shimBase,
    required this.elevBg,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/cars/${car.id}'),
      child: Container(
        decoration: BoxDecoration(
          color:        cardColor,
          borderRadius: BorderRadius.circular(16),
          border:       Border.all(color: borderColor),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  ClipRRect(
                    borderRadius:
                        const BorderRadius.vertical(top: Radius.circular(16)),
                    child: car.primaryImageUrl != null
                        ? CachedNetworkImage(
                            imageUrl: car.primaryImageUrl!,
                            fit:      BoxFit.cover,
                            width:    double.infinity,
                            placeholder: (_, __) =>
                                Container(color: shimBase),
                            errorWidget: (_, __, ___) => Container(
                              color: shimBase,
                              child: Icon(Icons.directions_car_rounded,
                                  color: textMuted, size: 40),
                            ),
                          )
                        : Container(
                            color: shimBase,
                            child: Center(
                              child: Icon(Icons.directions_car_rounded,
                                  color: textMuted, size: 40),
                            ),
                          ),
                  ),
                  // Availability badge
                  Positioned(
                    top: 8, left: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 7, vertical: 3),
                      decoration: BoxDecoration(
                        color: car.isAvailable
                            ? AppColors.success
                            : Colors.black54,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        car.isAvailable ? 'Available' : 'Booked',
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // Info
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(car.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: textPrim)),
                  const SizedBox(height: 2),
                  Row(children: [
                    Icon(Icons.location_on_rounded,
                        size: 11, color: textMuted),
                    const SizedBox(width: 2),
                    Expanded(
                        child: Text(car.location,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                                fontSize: 11, color: textMuted))),
                  ]),
                  const SizedBox(height: 5),
                  Row(children: [
                    _MiniTag(
                        label: car.transmissionLabel,
                        bg: elevBg,
                        border: borderColor,
                        text: textSec),
                    const SizedBox(width: 4),
                    _MiniTag(
                        label: '${car.seats} seats',
                        bg: elevBg,
                        border: borderColor,
                        text: textSec),
                  ]),
                  const SizedBox(height: 6),
                  Text('₱${car.pricePerDay.toStringAsFixed(0)}/day',
                      style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: AppColors.primary)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CAR LIST VIEW
// ─────────────────────────────────────────────────────────────────────────────
class _CarsList extends StatelessWidget {
  final List<CarModel> cars;
  final Color cardColor, borderColor, textPrim, textMuted, textSec, shimBase;
  final bool isDark;

  const _CarsList({
    required this.cars,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textMuted,
    required this.textSec,
    required this.shimBase,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
      itemCount: cars.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, i) => _CarListCard(
        car: cars[i],
        cardColor:   cardColor,
        borderColor: borderColor,
        textPrim:    textPrim,
        textMuted:   textMuted,
        textSec:     textSec,
        shimBase:    shimBase,
        isDark:      isDark,
      ),
    );
  }
}

class _CarListCard extends StatelessWidget {
  final CarModel car;
  final Color cardColor, borderColor, textPrim, textMuted, textSec, shimBase;
  final bool isDark;

  const _CarListCard({
    required this.car,
    required this.cardColor,
    required this.borderColor,
    required this.textPrim,
    required this.textMuted,
    required this.textSec,
    required this.shimBase,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final elevBg = isDark ? AppColors.bgElevated : AppColors.bgElevatedLight;

    return GestureDetector(
      onTap: () => context.push('/cars/${car.id}'),
      child: Container(
        decoration: BoxDecoration(
          color:        cardColor,
          borderRadius: BorderRadius.circular(16),
          border:       Border.all(color: borderColor),
        ),
        child: Row(
          children: [
            // Thumbnail
            ClipRRect(
              borderRadius: const BorderRadius.horizontal(
                  left: Radius.circular(16)),
              child: SizedBox(
                width: 110, height: 100,
                child: car.primaryImageUrl != null
                    ? CachedNetworkImage(
                        imageUrl: car.primaryImageUrl!,
                        fit:      BoxFit.cover,
                        placeholder: (_, __) =>
                            Container(color: shimBase),
                        errorWidget: (_, __, ___) => Container(
                          color: shimBase,
                          child: Icon(Icons.directions_car_rounded,
                              color: textMuted, size: 32),
                        ),
                      )
                    : Container(
                        color: shimBase,
                        child: Center(
                          child: Icon(Icons.directions_car_rounded,
                              color: textMuted, size: 32),
                        ),
                      ),
              ),
            ),

            // Info
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(car.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: textPrim)),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 7, vertical: 3),
                          decoration: BoxDecoration(
                            color: car.isAvailable
                                ? AppColors.success
                                : AppColors.error.withOpacity(0.7),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            car.isAvailable ? 'Available' : 'Booked',
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 9,
                                fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    if (car.brand.isNotEmpty)
                      Text(
                        '${car.brand} ${car.model} ${car.year ?? ''}'.trim(),
                        style: TextStyle(
                            color: textSec,
                            fontSize: 11,
                            fontWeight: FontWeight.w500),
                      ),
                    const SizedBox(height: 3),
                    Row(children: [
                      Icon(Icons.location_on_rounded,
                          size: 11, color: textMuted),
                      const SizedBox(width: 2),
                      Expanded(
                          child: Text(car.location,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                  fontSize: 11, color: textMuted))),
                    ]),
                    const SizedBox(height: 6),
                    Row(children: [
                      _MiniTag(
                          label: car.transmissionLabel,
                          bg: elevBg,
                          border: borderColor,
                          text: textSec),
                      const SizedBox(width: 4),
                      _MiniTag(
                          label: car.fuelLabel,
                          bg: elevBg,
                          border: borderColor,
                          text: textSec),
                      const SizedBox(width: 4),
                      _MiniTag(
                          label: '${car.seats} seats',
                          bg: elevBg,
                          border: borderColor,
                          text: textSec),
                    ]),
                    const SizedBox(height: 6),
                    Text('₱${car.pricePerDay.toStringAsFixed(0)}/day',
                        style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primary)),
                  ],
                ),
              ),
            ),

            // Chevron
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Icon(Icons.chevron_right_rounded,
                  color: textMuted, size: 20),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SHIMMER STATES
// ─────────────────────────────────────────────────────────────────────────────
class _ShimmerGrid extends StatelessWidget {
  final Color shimBase, shimHigh;
  const _ShimmerGrid({required this.shimBase, required this.shimHigh});

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2, crossAxisSpacing: 12,
        mainAxisSpacing: 12, childAspectRatio: 0.70,
      ),
      itemCount: 6,
      itemBuilder: (_, __) => Shimmer.fromColors(
        baseColor: shimBase, highlightColor: shimHigh,
        child: Container(
          decoration: BoxDecoration(
            color: shimBase,
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }
}

class _ShimmerList extends StatelessWidget {
  final Color shimBase, shimHigh;
  const _ShimmerList({required this.shimBase, required this.shimHigh});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
      itemCount: 5,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, __) => Shimmer.fromColors(
        baseColor: shimBase, highlightColor: shimHigh,
        child: Container(
          height: 100,
          decoration: BoxDecoration(
            color: shimBase,
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY / ERROR VIEWS
// ─────────────────────────────────────────────────────────────────────────────
class _EmptyView extends StatelessWidget {
  final bool hasFilters;
  final Color textMuted;
  final VoidCallback onClear;

  const _EmptyView({
    required this.hasFilters,
    required this.textMuted,
    required this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.directions_car_rounded, size: 64,
              color: textMuted.withOpacity(0.5)),
          const SizedBox(height: 16),
          Text(hasFilters ? 'No cars match your filters' : 'No cars available',
              style: TextStyle(
                  color: textMuted, fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Text(hasFilters ? 'Try adjusting or clearing your filters' : 'Check back soon!',
              style: TextStyle(color: textMuted, fontSize: 13)),
          if (hasFilters) ...[
            const SizedBox(height: 16),
            ElevatedButton.icon(
              icon: const Icon(Icons.close_rounded, size: 16),
              label: const Text('Clear Filters'),
              onPressed: onClear,
            ),
          ],
        ],
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  final Color textMuted;
  final VoidCallback onRetry;
  const _ErrorView({required this.textMuted, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.wifi_off_rounded, size: 48, color: textMuted),
          const SizedBox(height: 12),
          Text('Failed to load cars',
              style: TextStyle(
                  color: textMuted,
                  fontSize: 15,
                  fontWeight: FontWeight.w600)),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            icon: const Icon(Icons.refresh_rounded, size: 16),
            label: const Text('Retry'),
            onPressed: onRetry,
          ),
        ],
      ),
    );
  }
}

// ── Mini tag chip ─────────────────────────────────────────────────────────────
class _MiniTag extends StatelessWidget {
  final String label;
  final Color bg, border, text;
  const _MiniTag({
    required this.label,
    required this.bg,
    required this.border,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: border),
      ),
      child: Text(label,
          style: TextStyle(fontSize: 10, color: text)),
    );
  }
}