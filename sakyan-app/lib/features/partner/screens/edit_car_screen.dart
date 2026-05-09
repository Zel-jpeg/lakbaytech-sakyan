import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../cars/models/car_model.dart';
import '../../cars/providers/cars_provider.dart';
import '../providers/partner_provider.dart';

class EditCarScreen extends ConsumerWidget {
  final String carId;
  const EditCarScreen({super.key, required this.carId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final carAsync = ref.watch(carDetailProvider(carId));
    final theme    = Theme.of(context);
    final isDark   = theme.brightness == Brightness.dark;
    final textMuted = isDark ? AppColors.textMuted : AppColors.textMutedLight;

    return Scaffold(
      appBar: AppBar(title: const Text('Edit Car')),
      body: carAsync.when(
        loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.primary)),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline_rounded, size: 48, color: textMuted),
              const SizedBox(height: 12),
              Text('Failed to load car',
                  style: TextStyle(color: textMuted)),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => ref.invalidate(carDetailProvider(carId)),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (car) => _EditCarForm(car: car, carId: carId),
      ),
    );
  }
}

// ── Edit form — wraps the same fields as AddCarScreen but pre-populated ────────
class _EditCarForm extends ConsumerStatefulWidget {
  final CarModel car;
  final String   carId;
  const _EditCarForm({required this.car, required this.carId});

  @override
  ConsumerState<_EditCarForm> createState() => _EditCarFormState();
}

class _EditCarFormState extends ConsumerState<_EditCarForm> {
  final _formKey = GlobalKey<FormState>();

  late final TextEditingController _nameCtrl;
  late final TextEditingController _brandCtrl;
  late final TextEditingController _modelCtrl;
  late final TextEditingController _yearCtrl;
  late final TextEditingController _plateCtrl;
  late final TextEditingController _colorCtrl;
  late final TextEditingController _priceCtrl;
  late final TextEditingController _locCtrl;
  late final TextEditingController _descCtrl;

  late String       _transmission;
  late String       _fuelType;
  late int          _seats;
  late List<String> _features;

  static const _transmissions = ['automatic', 'manual'];
  static const _fuels         = ['gasoline', 'diesel', 'electric', 'hybrid'];
  static const _seatOptions   = [2, 4, 5, 6, 7, 8];
  static const _featuresPool  = [
    'Bluetooth', 'GPS Navigation', 'Backup Camera', 'Sunroof',
    'Leather Seats', 'Air Conditioning', 'USB Charging', 'Apple CarPlay',
    'Android Auto', 'Cruise Control', 'Parking Sensors', 'Dash Cam',
  ];

  @override
  void initState() {
    super.initState();
    final c = widget.car;
    _nameCtrl  = TextEditingController(text: c.name);
    _brandCtrl = TextEditingController(text: c.brand);
    _modelCtrl = TextEditingController(text: c.model);
    _yearCtrl  = TextEditingController(text: c.year?.toString() ?? '');
    _plateCtrl = TextEditingController(text: c.plateNumber);
    _colorCtrl = TextEditingController(text: c.color);
    _priceCtrl = TextEditingController(text: c.pricePerDay.toStringAsFixed(0));
    _locCtrl   = TextEditingController(text: c.location);
    _descCtrl  = TextEditingController(text: c.description);

    _transmission = c.transmission.isNotEmpty ? c.transmission : 'automatic';
    _fuelType     = c.fuelType.isNotEmpty     ? c.fuelType     : 'gasoline';
    _seats        = c.seats > 0               ? c.seats        : 5;
    _features     = List<String>.from(c.features);
  }

  @override
  void dispose() {
    for (final ctrl in [
      _nameCtrl, _brandCtrl, _modelCtrl, _yearCtrl,
      _plateCtrl, _colorCtrl, _priceCtrl, _locCtrl, _descCtrl,
    ]) {
      ctrl.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final data = {
      'name':          _nameCtrl.text.trim(),
      'brand':         _brandCtrl.text.trim(),
      'model':         _modelCtrl.text.trim(),
      'year':          int.tryParse(_yearCtrl.text.trim()),
      'plate_number':  _plateCtrl.text.trim().toUpperCase(),
      'color':         _colorCtrl.text.trim(),
      'transmission':  _transmission,
      'fuel_type':     _fuelType,
      'seats':         _seats,
      'price_per_day': double.tryParse(_priceCtrl.text.trim()) ?? 0,
      'location':      _locCtrl.text.trim(),
      'description':   _descCtrl.text.trim(),
      'features':      _features,
    };

    final updated = await ref
        .read(saveCarProvider.notifier)
        .updateCar(widget.carId, data);

    if (!mounted) return;
    if (updated != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Car updated successfully!'),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
        ),
      );
      context.pop();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to update car. Please try again.'),
          backgroundColor: AppColors.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final saveState = ref.watch(saveCarProvider);
    final theme  = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final cardColor   = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;

    return Form(
      key: _formKey,
      child: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Basic info ─────────────────────────────────────────
                  _Section(label: 'Basic Information', textPrim: textPrim),
                  const SizedBox(height: 12),
                  _FieldLabel(label: 'Car Name / Listing Title', textSec: textSec),
                  TextFormField(
                    controller: _nameCtrl,
                    style: TextStyle(color: textPrim),
                    decoration: const InputDecoration(
                        hintText: 'e.g. Toyota Vios 2022 – Automatic'),
                    validator: (v) =>
                        v == null || v.trim().isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  Row(children: [
                    Expanded(child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _FieldLabel(label: 'Brand', textSec: textSec),
                        TextFormField(
                          controller: _brandCtrl,
                          style: TextStyle(color: textPrim),
                          decoration: const InputDecoration(hintText: 'Toyota'),
                          validator: (v) =>
                              v == null || v.trim().isEmpty ? 'Required' : null,
                        ),
                      ],
                    )),
                    const SizedBox(width: 12),
                    Expanded(child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _FieldLabel(label: 'Model', textSec: textSec),
                        TextFormField(
                          controller: _modelCtrl,
                          style: TextStyle(color: textPrim),
                          decoration: const InputDecoration(hintText: 'Vios'),
                          validator: (v) =>
                              v == null || v.trim().isEmpty ? 'Required' : null,
                        ),
                      ],
                    )),
                  ]),
                  const SizedBox(height: 16),
                  Row(children: [
                    Expanded(child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _FieldLabel(label: 'Year', textSec: textSec),
                        TextFormField(
                          controller: _yearCtrl,
                          style: TextStyle(color: textPrim),
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(hintText: '2022'),
                          validator: (v) {
                            final y = int.tryParse(v ?? '');
                            if (y == null) return 'Required';
                            if (y < 1990 || y > DateTime.now().year + 1) {
                              return 'Invalid year';
                            }
                            return null;
                          },
                        ),
                      ],
                    )),
                    const SizedBox(width: 12),
                    Expanded(child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _FieldLabel(label: 'Plate Number', textSec: textSec),
                        TextFormField(
                          controller: _plateCtrl,
                          style: TextStyle(color: textPrim),
                          textCapitalization: TextCapitalization.characters,
                          decoration: const InputDecoration(hintText: 'AAA 1234'),
                          validator: (v) =>
                              v == null || v.trim().isEmpty ? 'Required' : null,
                        ),
                      ],
                    )),
                  ]),
                  const SizedBox(height: 16),
                  Row(children: [
                    Expanded(child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _FieldLabel(label: 'Color', textSec: textSec),
                        TextFormField(
                          controller: _colorCtrl,
                          style: TextStyle(color: textPrim),
                          decoration: const InputDecoration(hintText: 'White'),
                        ),
                      ],
                    )),
                    const SizedBox(width: 12),
                    Expanded(child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _FieldLabel(label: 'Price/Day (₱)', textSec: textSec),
                        TextFormField(
                          controller: _priceCtrl,
                          style: TextStyle(color: textPrim),
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(hintText: '1500'),
                          validator: (v) {
                            final p = double.tryParse(v ?? '');
                            if (p == null || p <= 0) return 'Enter valid price';
                            return null;
                          },
                        ),
                      ],
                    )),
                  ]),
                  const SizedBox(height: 24),

                  // ── Specs ──────────────────────────────────────────────
                  _Section(label: 'Specifications', textPrim: textPrim),
                  const SizedBox(height: 12),
                  _FieldLabel(label: 'Transmission', textSec: textSec),
                  const SizedBox(height: 8),
                  Row(children: _transmissions.map((t) {
                    final sel = _transmission == t;
                    return Expanded(
                      child: Padding(
                        padding:
                            EdgeInsets.only(right: t == _transmissions.first ? 8 : 0),
                        child: _Chip(
                          label: t[0].toUpperCase() + t.substring(1),
                          selected: sel,
                          cardColor: cardColor,
                          borderColor: borderColor,
                          onTap: () => setState(() => _transmission = t),
                        ),
                      ),
                    );
                  }).toList()),
                  const SizedBox(height: 16),
                  _FieldLabel(label: 'Fuel Type', textSec: textSec),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _fuels.map((f) {
                      final sel = _fuelType == f;
                      return _Chip(
                        label: f[0].toUpperCase() + f.substring(1),
                        selected: sel,
                        cardColor: cardColor,
                        borderColor: borderColor,
                        onTap: () => setState(() => _fuelType = f),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),
                  _FieldLabel(label: 'Seats', textSec: textSec),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _seatOptions.map((s) {
                      final sel = _seats == s;
                      return _Chip(
                        label: '$s',
                        selected: sel,
                        cardColor: cardColor,
                        borderColor: borderColor,
                        onTap: () => setState(() => _seats = s),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 24),

                  // ── Location ───────────────────────────────────────────
                  _Section(label: 'Location', textPrim: textPrim),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _locCtrl,
                    style: TextStyle(color: textPrim),
                    decoration: InputDecoration(
                      hintText: 'City, Province',
                      prefixIcon: Icon(Icons.location_on_rounded,
                          color: textMuted, size: 20),
                    ),
                    validator: (v) =>
                        v == null || v.trim().isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 24),

                  // ── Features ───────────────────────────────────────────
                  _Section(label: 'Features', textPrim: textPrim),
                  const SizedBox(height: 6),
                  Text('Select all that apply',
                      style: TextStyle(color: textSec, fontSize: 13)),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _featuresPool.map((f) {
                      final sel = _features.contains(f);
                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            sel ? _features.remove(f) : _features.add(f);
                          });
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 7),
                          decoration: BoxDecoration(
                            color: sel ? AppColors.primaryGlow : cardColor,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: sel ? AppColors.primary : borderColor,
                              width: sel ? 1.5 : 1,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (sel)
                                const Padding(
                                  padding: EdgeInsets.only(right: 5),
                                  child: Icon(Icons.check_rounded,
                                      size: 12, color: AppColors.primary),
                                ),
                              Text(f,
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: sel
                                        ? AppColors.primary
                                        : textSec,
                                    fontWeight: sel
                                        ? FontWeight.w600
                                        : FontWeight.w400,
                                  )),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 24),

                  // ── Description ────────────────────────────────────────
                  _Section(label: 'Description (Optional)', textPrim: textPrim),
                  const SizedBox(height: 10),
                  TextFormField(
                    controller: _descCtrl,
                    style: TextStyle(color: textPrim),
                    maxLines: 4,
                    decoration: const InputDecoration(
                        hintText: 'Describe your car...'),
                  ),
                ],
              ),
            ),
          ),

          // ── Save button ─────────────────────────────────────────────────
          Padding(
            padding: EdgeInsets.fromLTRB(
                20, 12, 20, MediaQuery.of(context).padding.bottom + 16),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: saveState.isLoading ? null : _submit,
                child: saveState.isLoading
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Save Changes',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w700)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String label;
  final Color textPrim;
  const _Section({required this.label, required this.textPrim});

  @override
  Widget build(BuildContext context) => Text(
        label,
        style: TextStyle(
            fontSize: 16, fontWeight: FontWeight.w700, color: textPrim),
      );
}

class _FieldLabel extends StatelessWidget {
  final String label;
  final Color textSec;
  const _FieldLabel({required this.label, required this.textSec});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text(label,
            style: TextStyle(
                fontSize: 13, fontWeight: FontWeight.w600, color: textSec)),
      );
}

class _Chip extends StatelessWidget {
  final String label;
  final bool selected;
  final Color cardColor, borderColor;
  final VoidCallback onTap;
  const _Chip({
    required this.label,
    required this.selected,
    required this.cardColor,
    required this.borderColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            color:        selected ? AppColors.primaryGlow : cardColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? AppColors.primary : borderColor,
              width: selected ? 1.5 : 1,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              color:      selected ? AppColors.primary : Colors.grey,
              fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
              fontSize:   13,
            ),
          ),
        ),
      );
}