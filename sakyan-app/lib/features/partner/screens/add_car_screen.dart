import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/constants/app_colors.dart';
import '../providers/partner_provider.dart';

class AddCarScreen extends ConsumerStatefulWidget {
  const AddCarScreen({super.key});

  @override
  ConsumerState<AddCarScreen> createState() => _AddCarScreenState();
}

class _AddCarScreenState extends ConsumerState<AddCarScreen> {
  final _formKey   = GlobalKey<FormState>();
  final _nameCtrl  = TextEditingController();
  final _brandCtrl = TextEditingController();
  final _modelCtrl = TextEditingController();
  final _yearCtrl  = TextEditingController();
  final _plateCtrl = TextEditingController();
  final _colorCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();
  final _locCtrl   = TextEditingController();
  final _descCtrl  = TextEditingController();

  String _transmission = 'automatic';
  String _fuelType     = 'gasoline';
  int    _seats        = 5;
  final List<String> _features = [];
  final List<File>   _images   = [];
  bool  _uploading = false;

  final _picker = ImagePicker();

  static const _transmissions  = ['automatic', 'manual'];
  static const _fuels          = ['gasoline', 'diesel', 'electric', 'hybrid'];
  static const _seatOptions    = [2, 4, 5, 6, 7, 8];
  static const _featuresPool   = [
    'Bluetooth', 'GPS Navigation', 'Backup Camera', 'Sunroof',
    'Leather Seats', 'Air Conditioning', 'USB Charging', 'Apple CarPlay',
    'Android Auto', 'Cruise Control', 'Parking Sensors', 'Dash Cam',
  ];

  @override
  void dispose() {
    _nameCtrl.dispose();
    _brandCtrl.dispose();
    _modelCtrl.dispose();
    _yearCtrl.dispose();
    _plateCtrl.dispose();
    _colorCtrl.dispose();
    _priceCtrl.dispose();
    _locCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    if (_images.length >= 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Maximum 10 images allowed')),
      );
      return;
    }
    final results = await _picker.pickMultiImage(imageQuality: 85, maxWidth: 1920);
    if (results.isEmpty) return;
    final remaining = 10 - _images.length;
    setState(() {
      _images.addAll(results.take(remaining).map((x) => File(x.path)));
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_images.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please add at least one photo'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }
    setState(() => _uploading = true);

    try {
      final repo = ref.read(partnerRepositoryProvider);

      // Upload all images in parallel
      final urls = await Future.wait(
          _images.map((f) => repo.uploadCarImage(f)));

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
        'image_urls':    urls,  // backend handles image creation
      };

      final car = await ref.read(saveCarProvider.notifier).create(data);

      if (!mounted) return;
      if (car != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Car listed successfully!'),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
          ),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save: $e'),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final saveState   = ref.watch(saveCarProvider);
    final theme  = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final cardColor   = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;

    final isLoading = _uploading || saveState.isLoading;

    return Scaffold(
      appBar: AppBar(title: const Text('Add New Car')),
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── Photos ───────────────────────────────────────────
                    _SectionHeader(label: 'Photos', textPrim: textPrim),
                    const SizedBox(height: 10),
                    SizedBox(
                      height: 120,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        children: [
                          // Picker button
                          GestureDetector(
                            onTap: _pickImages,
                            child: Container(
                              width: 100,
                              height: 120,
                              margin: const EdgeInsets.only(right: 10),
                              decoration: BoxDecoration(
                                color: AppColors.primaryGlow,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                    color: AppColors.primary.withOpacity(0.4),
                                    style: BorderStyle.solid),
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.add_photo_alternate_rounded,
                                      color: AppColors.primary, size: 32),
                                  const SizedBox(height: 6),
                                  Text('Add Photos',
                                      style: TextStyle(
                                          color: AppColors.primary,
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600),
                                      textAlign: TextAlign.center),
                                  Text('${_images.length}/10',
                                      style: TextStyle(
                                          color: AppColors.primary,
                                          fontSize: 10)),
                                ],
                              ),
                            ),
                          ),
                          // Picked images
                          ..._images.asMap().entries.map((e) {
                            return Stack(
                              children: [
                                Container(
                                  width: 100,
                                  height: 120,
                                  margin: const EdgeInsets.only(right: 10),
                                  child: ClipRRect(
                                    borderRadius: BorderRadius.circular(14),
                                    child: Image.file(e.value,
                                        fit: BoxFit.cover),
                                  ),
                                ),
                                Positioned(
                                  top: 6,
                                  right: 16,
                                  child: GestureDetector(
                                    onTap: () => setState(
                                        () => _images.removeAt(e.key)),
                                    child: Container(
                                      width: 22,
                                      height: 22,
                                      decoration: const BoxDecoration(
                                        color: AppColors.error,
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(Icons.close_rounded,
                                          color: Colors.white, size: 14),
                                    ),
                                  ),
                                ),
                                if (e.key == 0)
                                  Positioned(
                                    bottom: 6,
                                    left: 6,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: AppColors.primary,
                                        borderRadius:
                                            BorderRadius.circular(6),
                                      ),
                                      child: const Text('Cover',
                                          style: TextStyle(
                                              color: Colors.white,
                                              fontSize: 9,
                                              fontWeight: FontWeight.w700)),
                                    ),
                                  ),
                              ],
                            );
                          }),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // ── Basic info ───────────────────────────────────────
                    _SectionHeader(label: 'Basic Information', textPrim: textPrim),
                    const SizedBox(height: 12),
                    _Field(label: 'Car Name / Listing Title', textSec: textSec),
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
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _Field(label: 'Brand', textSec: textSec),
                            TextFormField(
                              controller: _brandCtrl,
                              style: TextStyle(color: textPrim),
                              decoration:
                                  const InputDecoration(hintText: 'Toyota'),
                              validator: (v) =>
                                  v == null || v.trim().isEmpty
                                      ? 'Required'
                                      : null,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _Field(label: 'Model', textSec: textSec),
                            TextFormField(
                              controller: _modelCtrl,
                              style: TextStyle(color: textPrim),
                              decoration:
                                  const InputDecoration(hintText: 'Vios'),
                              validator: (v) =>
                                  v == null || v.trim().isEmpty
                                      ? 'Required'
                                      : null,
                            ),
                          ],
                        ),
                      ),
                    ]),
                    const SizedBox(height: 16),
                    Row(children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _Field(label: 'Year', textSec: textSec),
                            TextFormField(
                              controller: _yearCtrl,
                              style: TextStyle(color: textPrim),
                              keyboardType: TextInputType.number,
                              decoration:
                                  const InputDecoration(hintText: '2022'),
                              validator: (v) {
                                final y = int.tryParse(v ?? '');
                                if (y == null) return 'Required';
                                if (y < 1990 ||
                                    y > DateTime.now().year + 1) {
                                  return 'Invalid year';
                                }
                                return null;
                              },
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _Field(label: 'Plate Number', textSec: textSec),
                            TextFormField(
                              controller: _plateCtrl,
                              style: TextStyle(color: textPrim),
                              textCapitalization: TextCapitalization.characters,
                              decoration: const InputDecoration(
                                  hintText: 'AAA 1234'),
                              validator: (v) =>
                                  v == null || v.trim().isEmpty
                                      ? 'Required'
                                      : null,
                            ),
                          ],
                        ),
                      ),
                    ]),
                    const SizedBox(height: 16),
                    Row(children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _Field(label: 'Color', textSec: textSec),
                            TextFormField(
                              controller: _colorCtrl,
                              style: TextStyle(color: textPrim),
                              decoration:
                                  const InputDecoration(hintText: 'White'),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _Field(label: 'Price per Day (₱)', textSec: textSec),
                            TextFormField(
                              controller: _priceCtrl,
                              style: TextStyle(color: textPrim),
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(
                                  hintText: '1500'),
                              validator: (v) {
                                final p = double.tryParse(v ?? '');
                                if (p == null || p <= 0) {
                                  return 'Enter a valid price';
                                }
                                return null;
                              },
                            ),
                          ],
                        ),
                      ),
                    ]),
                    const SizedBox(height: 24),

                    // ── Specs ─────────────────────────────────────────────
                    _SectionHeader(label: 'Specifications', textPrim: textPrim),
                    const SizedBox(height: 12),

                    // Transmission
                    _Field(label: 'Transmission', textSec: textSec),
                    const SizedBox(height: 8),
                    Row(children: _transmissions.map((t) {
                      final sel = _transmission == t;
                      return Expanded(
                        child: Padding(
                          padding: EdgeInsets.only(
                              right: t == _transmissions.first ? 8 : 0),
                          child: _SelectChip(
                            label: t[0].toUpperCase() + t.substring(1),
                            selected: sel,
                            cardColor: cardColor,
                            borderColor: borderColor,
                            onTap: () =>
                                setState(() => _transmission = t),
                          ),
                        ),
                      );
                    }).toList()),
                    const SizedBox(height: 16),

                    // Fuel type
                    _Field(label: 'Fuel Type', textSec: textSec),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _fuels.map((f) {
                        final sel = _fuelType == f;
                        return _SelectChip(
                          label: f[0].toUpperCase() + f.substring(1),
                          selected: sel,
                          cardColor: cardColor,
                          borderColor: borderColor,
                          onTap: () => setState(() => _fuelType = f),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 16),

                    // Seats
                    _Field(label: 'Seats', textSec: textSec),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _seatOptions.map((s) {
                        final sel = _seats == s;
                        return _SelectChip(
                          label: '$s',
                          selected: sel,
                          cardColor: cardColor,
                          borderColor: borderColor,
                          onTap: () => setState(() => _seats = s),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 24),

                    // ── Location ──────────────────────────────────────────
                    _SectionHeader(label: 'Location', textPrim: textPrim),
                    const SizedBox(height: 12),
                    _Field(label: 'Pickup Location', textSec: textSec),
                    TextFormField(
                      controller: _locCtrl,
                      style: TextStyle(color: textPrim),
                      decoration: InputDecoration(
                        hintText: 'City, Province (e.g. Quezon City, Metro Manila)',
                        prefixIcon: Icon(Icons.location_on_rounded,
                            color: textMuted, size: 20),
                      ),
                      validator: (v) =>
                          v == null || v.trim().isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: 24),

                    // ── Features ──────────────────────────────────────────
                    _SectionHeader(label: 'Features', textPrim: textPrim),
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
                    _SectionHeader(
                        label: 'Description (Optional)', textPrim: textPrim),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _descCtrl,
                      style: TextStyle(color: textPrim),
                      maxLines: 4,
                      decoration: const InputDecoration(
                          hintText:
                              'Describe your car — any special notes, rules, or highlights...'),
                    ),
                  ],
                ),
              ),
            ),

            // ── Submit button ──────────────────────────────────────────────
            Padding(
              padding: EdgeInsets.fromLTRB(
                  20, 12, 20, MediaQuery.of(context).padding.bottom + 16),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: isLoading ? null : _submit,
                  child: isLoading
                      ? Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white),
                            ),
                            const SizedBox(width: 10),
                            Text(
                              _uploading
                                  ? 'Uploading photos...'
                                  : 'Saving listing...',
                              style: const TextStyle(color: Colors.white),
                            ),
                          ],
                        )
                      : const Text('Publish Listing',
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
}

class _SectionHeader extends StatelessWidget {
  final String label;
  final Color textPrim;
  const _SectionHeader({required this.label, required this.textPrim});

  @override
  Widget build(BuildContext context) => Text(
        label,
        style: TextStyle(
            fontSize: 16, fontWeight: FontWeight.w700, color: textPrim),
      );
}

class _Field extends StatelessWidget {
  final String label;
  final Color textSec;
  const _Field({required this.label, required this.textSec});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Text(label,
            style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: textSec)),
      );
}

class _SelectChip extends StatelessWidget {
  final String label;
  final bool selected;
  final Color cardColor, borderColor;
  final VoidCallback onTap;
  const _SelectChip({
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