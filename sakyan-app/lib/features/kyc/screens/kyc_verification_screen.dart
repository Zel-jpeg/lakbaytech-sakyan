import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/router/app_router.dart';
import '../providers/kyc_provider.dart';

// ── PSGC API helpers ──────────────────────────────────────────────────────────
const _kPsgc = 'https://psgc.cloud/api';
final _psgcDio = Dio(BaseOptions(
  connectTimeout: const Duration(seconds: 12),
  receiveTimeout: const Duration(seconds: 15),
));

class _PsgcItem {
  final String code, name;
  final double? lat, lng;
  const _PsgcItem({
    required this.code,
    required this.name,
    this.lat,
    this.lng,
  });
}

Future<List<_PsgcItem>> _psgcFetch(String url) async {
  final res = await _psgcDio.get<List<dynamic>>(url);
  final raw = res.data ?? [];
  final items = raw.map((e) {
    final m = e as Map<String, dynamic>;
    final lat = (m['latitude']  as num?)?.toDouble();
    final lng = (m['longitude'] as num?)?.toDouble();
    return _PsgcItem(
      code: m['code'] as String? ?? '',
      name: m['name'] as String? ?? '',
      lat:  lat,
      lng:  lng,
    );
  }).toList()
    ..sort((a, b) => a.name.compareTo(b.name));
  return items;
}

// ── Valid ID options ──────────────────────────────────────────────────────────
const _kIdTypes = [
  ('national_id', 'National ID (PhilSys)'),
  ('passport',   'Passport'),
  ('sss',        'SSS ID'),
  ('philhealth', 'PhilHealth ID'),
  ('postal',     'Postal ID'),
  ('voters',     "Voter's ID"),
  ('prc',        'PRC ID'),
  ('umid',       'UMID'),
];

// ── Default map center — Philippines ──────────────────────────────────────────
const _kPhCenter = LatLng(12.8797, 121.774);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
class KycVerificationScreen extends ConsumerStatefulWidget {
  const KycVerificationScreen({super.key});

  @override
  ConsumerState<KycVerificationScreen> createState() =>
      _KycVerificationScreenState();
}

class _KycVerificationScreenState
    extends ConsumerState<KycVerificationScreen> {
  // 0=Personal Info, 1=License & ID, 2=Upload Docs, 3=Rental Agreement
  int _step = 0;

  // ── Step 0 ────────────────────────────────────────────────────────────────
  final _birthdayCtrl = TextEditingController();
  final _contactCtrl  = TextEditingController();

  List<_PsgcItem> _provinces = [];
  List<_PsgcItem> _cities    = [];
  List<_PsgcItem> _barangays = [];
  bool _loadingP = true, _loadingC = false, _loadingB = false;

  String _provinceCode = '', _provinceName = '';
  String _cityCode     = '', _cityName     = '';
  String _barangayName = '';

  final _mapCtrl   = MapController();
  bool   _mapReady  = false;
  LatLng? _pendingCenter;
  double? _pendingZoom;
  LatLng? _pin;
  String  _pinLabel  = '';
  bool    _reversing = false;

  double? _addrLat, _addrLng;

  // ── Step 1 ────────────────────────────────────────────────────────────────
  final _licenseNumCtrl    = TextEditingController();
  final _licenseExpiryCtrl = TextEditingController();
  String _idType           = '';

  // ── Step 2 ────────────────────────────────────────────────────────────────
  File? _licenseFile;
  File? _validIdFile;
  final _picker = ImagePicker();

  // ── Step 3 (Rental Agreement) ─────────────────────────────────────────────
  final _signatureCtrl   = TextEditingController();
  final _agreementScroll = ScrollController();
  bool  _agreementRead    = false;
  bool  _agreementChecked = false;

  @override
  void initState() {
    super.initState();
    _loadProvinces();
  }

  @override
  void dispose() {
    _birthdayCtrl.dispose();
    _contactCtrl.dispose();
    _licenseNumCtrl.dispose();
    _licenseExpiryCtrl.dispose();
    _signatureCtrl.dispose();
    _agreementScroll.dispose();
    _mapCtrl.dispose();
    super.dispose();
  }

  // ── PSGC loaders ──────────────────────────────────────────────────────────
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
    // Fly to province on map (zoom 10)
    final prov = _provinces.where((p) => p.code == code).firstOrNull;
    if (prov?.lat != null && prov?.lng != null) {
      _moveMap(LatLng(prov!.lat!, prov.lng!), 10);
    } else {
      _flyToQuery('$name, Philippines', 10);
    }
    try {
      final items = await _psgcFetch(
          '$_kPsgc/provinces/$code/cities-municipalities/');
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
      _moveMap(LatLng(city!.lat!, city.lng!), 13);
    } else {
      _flyToQuery('$name, Philippines', 13);
    }
    try {
      final items = await _psgcFetch(
          '$_kPsgc/cities-municipalities/$code/barangays/');
      if (mounted) setState(() { _barangays = items; _loadingB = false; });
    } catch (_) {
      if (mounted) setState(() => _loadingB = false);
    }
  }

  void _moveMap(LatLng center, double zoom) {
    _pendingCenter = center;
    _pendingZoom   = zoom;
    if (!_mapReady) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_mapReady) return;
      try { _mapCtrl.move(center, zoom); } catch (_) {}
    });
  }

  void _onMapReady() {
    if (!mounted) return;
    setState(() => _mapReady = true);
    if (_pendingCenter != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        try { _mapCtrl.move(_pendingCenter!, _pendingZoom ?? 6); } catch (_) {}
      });
    }
  }

  Future<void> _flyToQuery(String query, double zoom) async {
    // Don't double-append Philippines if already included
    final q = query.toLowerCase().contains('philippines')
        ? query
        : '$query, Philippines';
    try {
      final res = await _psgcDio.get<List<dynamic>>(
        'https://nominatim.openstreetmap.org/search',
        queryParameters: {
          'q':            q,
          'format':       'json',
          'limit':        1,
          'countrycodes': 'ph',
        },
        options: Options(headers: {
          'Accept-Language': 'en',
          'User-Agent':      'SakyanApp/1.0',
        }),
      );
      final body = res.data ?? [];
      if (body.isNotEmpty && mounted) {
        final lat = double.tryParse(body[0]['lat']?.toString() ?? '') ?? 0;
        final lon = double.tryParse(body[0]['lon']?.toString() ?? '') ?? 0;
        if (lat != 0 && lon != 0) _moveMap(LatLng(lat, lon), zoom);
      }
    } catch (_) {}
  }

  Future<void> _onMapTap(LatLng latlng) async {
    setState(() {
      _pin      = latlng;
      _addrLat  = latlng.latitude;
      _addrLng  = latlng.longitude;
      _pinLabel = '${latlng.latitude.toStringAsFixed(5)}, '
                  '${latlng.longitude.toStringAsFixed(5)}';
      _reversing = true;
    });
    try {
      final res = await _psgcDio.get<Map<String, dynamic>>(
        'https://nominatim.openstreetmap.org/reverse',
        queryParameters: {
          'lat':    latlng.latitude,
          'lon':    latlng.longitude,
          'format': 'json',
        },
        options: Options(headers: {
          'Accept-Language': 'en',
          'User-Agent':      'SakyanApp/1.0',
        }),
      );
      if (mounted) {
        setState(() {
          _pinLabel  = res.data?['display_name'] as String? ?? _pinLabel;
          _reversing = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _reversing = false);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  String get _fullAddress {
    final parts = [_barangayName, _cityName, _provinceName]
        .where((s) => s.isNotEmpty);
    return parts.join(', ');
  }

  String? _validateStep0() {
    if (_birthdayCtrl.text.isEmpty) return 'Please enter your birthday.';
    if (_contactCtrl.text.trim().length < 10) {
      return 'Enter a valid phone number.';
    }
    if (_provinceCode.isEmpty) return 'Please select your province.';
    if (_cityCode.isEmpty) return 'Please select your city / municipality.';
    if (_fullAddress.trim().isEmpty) return 'Please complete your address.';
    return null;
  }

  String? _validateStep1() {
    if (_licenseNumCtrl.text.trim().isEmpty) {
      return 'Please enter your license number.';
    }
    if (_licenseExpiryCtrl.text.isEmpty) {
      return 'Please enter the license expiry date.';
    }
    if (_idType.isEmpty) return 'Please select a valid ID type.';
    return null;
  }

  void _goToStep(int step) {
    if (step != 0) _mapReady = false;
    setState(() => _step = step);
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content:         Text(msg),
      backgroundColor: AppColors.error,
      behavior:        SnackBarBehavior.floating,
    ));
  }

  Future<File?> _pickImage() async {
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(
              width: 40, height: 4,
              decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2)),
            ),
            const SizedBox(height: 16),
            const Text('Select Source',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            Row(children: [
              Expanded(child: _SourceButton(
                icon:  Icons.camera_alt_rounded,
                label: 'Camera',
                onTap: () => Navigator.pop(ctx, ImageSource.camera),
              )),
              const SizedBox(width: 12),
              Expanded(child: _SourceButton(
                icon:  Icons.photo_library_rounded,
                label: 'Gallery',
                onTap: () => Navigator.pop(ctx, ImageSource.gallery),
              )),
            ]),
          ]),
        ),
      ),
    );
    if (source == null || !mounted) return null;
    try {
      final xf = await _picker.pickImage(
        source:       source,
        imageQuality: 85,
        maxWidth:     1920,
      );
      return xf != null ? File(xf.path) : null;
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content:         Text('Could not pick image: $e'),
          backgroundColor: AppColors.error,
          behavior:        SnackBarBehavior.floating,
        ));
      }
      return null;
    }
  }

  Future<void> _submit() async {
    if (ref.read(submitKycProvider).isLoading) return;
    if (_licenseFile == null || _validIdFile == null) {
      _showError('Please upload both documents before submitting.');
      return;
    }
    try {
      final kyc = await ref.read(submitKycProvider.notifier).submit(
            birthday:             _birthdayCtrl.text.trim(),
            contactNumber:        _contactCtrl.text.trim(),
            address:              _fullAddress,
            addressLat:           _addrLat,
            addressLng:           _addrLng,
            driversLicenseNumber: _licenseNumCtrl.text.trim(),
            licenseExpiry:        _licenseExpiryCtrl.text.trim(),
            validIdType:          _idType,
            licenseFile:          _licenseFile!,
            validIdFile:          _validIdFile!,
          );
      if (!mounted) return;
      if (kyc != null) {
        context.go(AppRoutes.kycPending);
      } else {
        final providerState = ref.read(submitKycProvider);
        final rawErr = providerState.error?.toString() ?? '';
        final msg = rawErr.isNotEmpty
            ? rawErr.replaceFirst('Exception: ', '')
            : 'Submission failed. Please check your connection and try again.';
        _showError(msg);
      }
    } catch (e) {
      if (mounted) _showError(e.toString().replaceFirst('Exception: ', ''));
    }
  }

  // ── Build ─────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final submitState = ref.watch(submitKycProvider);
    final theme  = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final cardColor   = isDark ? AppColors.bgSurface    : AppColors.bgSurfaceLight;
    final borderColor = isDark ? AppColors.border        : AppColors.borderLight;
    final textPrim    = isDark ? AppColors.textPrimary   : AppColors.textPrimaryLight;
    final textSec     = isDark ? AppColors.textSecondary : AppColors.textSecondaryLight;
    final textMuted   = isDark ? AppColors.textMuted     : AppColors.textMutedLight;
    final inputFill   = isDark ? AppColors.bgElevated    : AppColors.bgElevatedLight;

    return Scaffold(
      appBar: AppBar(
        title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Identity Verification',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          Text('Required before you can book a car',
              style: TextStyle(fontSize: 11, color: textMuted)),
        ]),
        leading: _step > 0
            ? IconButton(
                icon: const Icon(Icons.arrow_back_rounded),
                onPressed: () => _goToStep(_step - 1),
              )
            : null,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _StepProgress(
                current:     _step,
                total:       4,
                borderColor: borderColor,
                textMuted:   textMuted),
            const SizedBox(height: 24),
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 260),
              child: KeyedSubtree(
                key: ValueKey(_step),
                child: _step == 0
                    ? _buildStep0(
                        isDark:      isDark,
                        cardColor:   cardColor,
                        borderColor: borderColor,
                        textPrim:    textPrim,
                        textSec:     textSec,
                        textMuted:   textMuted,
                        inputFill:   inputFill)
                    : _step == 1
                        ? _buildStep1(
                            isDark:      isDark,
                            borderColor: borderColor,
                            textPrim:    textPrim,
                            textSec:     textSec,
                            inputFill:   inputFill)
                        : _step == 2
                            ? _buildStep2(
                                isDark:      isDark,
                                cardColor:   cardColor,
                                borderColor: borderColor,
                                textPrim:    textPrim,
                                textSec:     textSec,
                                textMuted:   textMuted)
                            : _buildStep3(
                                isDark:      isDark,
                                borderColor: borderColor,
                                textPrim:    textPrim,
                                textSec:     textSec,
                                textMuted:   textMuted,
                                isLoading:   submitState.isLoading),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 0 — Personal Information + Address + Map
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildStep0({
    required bool  isDark,
    required Color cardColor,
    required Color borderColor,
    required Color textPrim,
    required Color textSec,
    required Color textMuted,
    required Color inputFill,
  }) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Personal Information',
          style: TextStyle(
              fontSize: 20, fontWeight: FontWeight.w800, color: textPrim)),
      const SizedBox(height: 4),
      Text('Enter your contact details and home address.',
          style: TextStyle(color: textSec, fontSize: 13)),
      const SizedBox(height: 20),

      Row(children: [
        Expanded(child: _Field(
          label: 'Birthday',
          child: _DateInput(
            controller: _birthdayCtrl, hint: 'dd/mm/yyyy',
            isDark: isDark, inputFill: inputFill, borderColor: borderColor,
          ),
        )),
        const SizedBox(width: 12),
        Expanded(child: _Field(
          label: 'Contact Number',
          child: _TextInput(
            controller:   _contactCtrl,
            hint:         'e.g. 09171234567',
            keyboardType: TextInputType.phone,
            isDark:       isDark,
            inputFill:    inputFill,
            borderColor:  borderColor,
            prefixIcon: const Icon(Icons.phone_outlined, size: 16),
          ),
        )),
      ]),
      const SizedBox(height: 16),

      _Field(
        label: 'Home Address',
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: borderColor),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(children: [
            Container(
              color: isDark ? AppColors.bgElevated : AppColors.bgElevatedLight,
              child: Column(children: [
                _PsgcDropdown(
                  value:       _provinceCode,
                  items:       _provinces,
                  placeholder: _loadingP ? 'Loading…' : 'Select Province',
                  loading:     _loadingP,
                  disabled:    _loadingP,
                  isDark:      isDark,
                  onChanged:   (code) {
                    final name = _provinces
                        .firstWhere((p) => p.code == code).name;
                    _onProvinceChanged(code, name);
                  },
                ),
                Divider(height: 1, color: borderColor),
                _PsgcDropdown(
                  value: _cityCode,
                  items: _cities,
                  placeholder: _provinceCode.isEmpty
                      ? '— Select Province first —'
                      : (_loadingC ? 'Loading…' : 'Select City / Municipality'),
                  loading:  _loadingC,
                  disabled: _provinceCode.isEmpty || _loadingC,
                  isDark:   isDark,
                  onChanged: (code) {
                    final name = _cities
                        .firstWhere((c) => c.code == code).name;
                    _onCityChanged(code, name);
                  },
                ),
                Divider(height: 1, color: borderColor),
                _PsgcDropdown(
                  value: _barangays.any((b) => b.name == _barangayName)
                      ? _barangays
                          .firstWhere((b) => b.name == _barangayName)
                          .code
                      : '',
                  items: _barangays,
                  placeholder: _cityCode.isEmpty
                      ? '— Select City first —'
                      : (_loadingB ? 'Loading…' : 'Select Barangay'),
                  loading:  _loadingB,
                  disabled: _cityCode.isEmpty || _loadingB,
                  isDark:   isDark,
                  onChanged: (code) {
                    final item = _barangays.firstWhere((b) => b.code == code);
                    setState(() => _barangayName = item.name);
                    if (item.lat != null && item.lng != null) {
                      _moveMap(LatLng(item.lat!, item.lng!), 15);
                    } else {
                      _flyToQuery('${item.name}, $_cityName, Philippines', 15);
                    }
                  },
                ),
              ]),
            ),

            if (_cityName.isNotEmpty)
              Container(
                color: isDark
                    ? AppColors.primaryGlow.withOpacity(0.15)
                    : AppColors.primaryGlow,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                child: Row(children: [
                  const Icon(Icons.location_on_outlined,
                      size: 13, color: AppColors.primary),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      [_barangayName, _cityName, _provinceName]
                          .where((s) => s.isNotEmpty)
                          .join(', '),
                      style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.primary,
                          fontWeight: FontWeight.w500),
                    ),
                  ),
                ]),
              ),

            Stack(children: [
              SizedBox(
                height: 220,
                child: FlutterMap(
                  mapController: _mapCtrl,
                  options: MapOptions(
                    initialCenter: _kPhCenter,
                    initialZoom:   6,
                    onTap: (_, latlng) => _onMapTap(latlng),
                    onMapReady: _onMapReady,
                  ),
                  children: [
                    TileLayer(
                      urlTemplate:
                          'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.sakyan.app',
                    ),
                    if (_pin != null)
                      MarkerLayer(markers: [
                        Marker(
                          point:  _pin!,
                          width:  36,
                          height: 36,
                          child: const Icon(Icons.location_pin,
                              color: AppColors.primary, size: 36),
                        ),
                      ]),
                  ],
                ),
              ),
              Positioned(
                top: 8, left: 0, right: 0,
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color:        Colors.white.withOpacity(0.9),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                            color:     Colors.black.withOpacity(0.08),
                            blurRadius: 4)
                      ],
                    ),
                    child: Text(
                      _cityName.isEmpty
                          ? 'Select a city to zoom the map'
                          : 'Tap to pin your exact location',
                      style: const TextStyle(
                          fontSize: 11, color: Colors.black54),
                    ),
                  ),
                ),
              ),
            ]),

            if (_pin != null)
              Container(
                color: isDark
                    ? AppColors.infoBg.withOpacity(0.3)
                    : AppColors.infoBg,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                  _reversing
                      ? const SizedBox(
                          width:  14,
                          height: 14,
                          child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.primary))
                      : const Icon(Icons.location_on_rounded,
                          size: 14, color: AppColors.info),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _reversing ? 'Getting address…' : _pinLabel,
                      style: TextStyle(
                          fontSize: 11,
                          color:    AppColors.info,
                          height:   1.4),
                    ),
                  ),
                ]),
              ),
          ]),
        ),
      ),
      const SizedBox(height: 28),

      SizedBox(
        width: double.infinity,
        child: ElevatedButton.icon(
          icon:  const Icon(Icons.arrow_forward_rounded, size: 18),
          label: const Text('Continue',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
          onPressed: () {
            final err = _validateStep0();
            if (err != null) { _showError(err); return; }
            _goToStep(1);
          },
        ),
      ),
      const SizedBox(height: 20),
    ]);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1 — License & ID Details
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildStep1({
    required bool  isDark,
    required Color borderColor,
    required Color textPrim,
    required Color textSec,
    required Color inputFill,
  }) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('License & ID Details',
          style: TextStyle(
              fontSize: 20, fontWeight: FontWeight.w800, color: textPrim)),
      const SizedBox(height: 4),
      Text(
          "Enter your driver's license information and select your "
          'government ID type.',
          style: TextStyle(color: textSec, fontSize: 13)),
      const SizedBox(height: 20),

      Row(children: [
        Expanded(child: _Field(
          label: 'License Number',
          child: _TextInput(
            controller:  _licenseNumCtrl,
            hint:        'e.g. N01-23-456789',
            isDark:      isDark,
            inputFill:   inputFill,
            borderColor: borderColor,
          ),
        )),
        const SizedBox(width: 12),
        Expanded(child: _Field(
          label: 'License Expiry',
          child: _DateInput(
            controller:  _licenseExpiryCtrl,
            hint:        'dd/mm/yyyy',
            isDark:      isDark,
            inputFill:   inputFill,
            borderColor: borderColor,
          ),
        )),
      ]),
      const SizedBox(height: 16),

      _Field(
        label: 'Valid ID Type',
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: borderColor),
            color: inputFill,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: DropdownButton<String>(
            value:      _idType.isEmpty ? null : _idType,
            hint: const Text('Select ID type',
                style: TextStyle(fontSize: 13)),
            isExpanded: true,
            underline:  const SizedBox.shrink(),
            items: _kIdTypes.map((t) => DropdownMenuItem(
              value: t.$1,
              child: Text(t.$2, style: const TextStyle(fontSize: 13)),
            )).toList(),
            onChanged: (v) => setState(() => _idType = v ?? ''),
          ),
        ),
      ),
      const SizedBox(height: 28),

      Row(children: [
        Expanded(
          child: OutlinedButton.icon(
            icon:  const Icon(Icons.arrow_back_rounded, size: 16),
            label: const Text('Back'),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(0, 52),
            ),
            onPressed: () => _goToStep(0),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          flex: 2,
          child: ElevatedButton.icon(
            icon:  const Icon(Icons.arrow_forward_rounded, size: 18),
            label: const Text('Continue',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            onPressed: () {
              final err = _validateStep1();
              if (err != null) { _showError(err); return; }
              _goToStep(2);
            },
          ),
        ),
      ]),
      const SizedBox(height: 20),
    ]);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2 — Upload Documents
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildStep2({
    required bool  isDark,
    required Color cardColor,
    required Color borderColor,
    required Color textPrim,
    required Color textSec,
    required Color textMuted,
  }) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Upload Documents',
          style: TextStyle(
              fontSize: 20, fontWeight: FontWeight.w800, color: textPrim)),
      const SizedBox(height: 4),
      Text('Kept private. Used only for identity verification.',
          style: TextStyle(color: textSec, fontSize: 13)),
      const SizedBox(height: 20),

      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _UploadBox(
          label:       "Driver's License",
          hint:        "Front side of your Philippine driver's license",
          required:    true,
          file:        _licenseFile,
          textMuted:   textMuted,
          cardColor:   cardColor,
          borderColor: borderColor,
          onTap: () async {
            final f = await _pickImage();
            if (f != null && mounted) setState(() => _licenseFile = f);
          },
          onClear: () => setState(() => _licenseFile = null),
        ),
        const SizedBox(height: 16),
        _UploadBox(
          label:       'Valid Government ID',
          hint:        "SSS, PhilHealth, UMID, Passport, Voter's ID, etc.",
          required:    true,
          file:        _validIdFile,
          textMuted:   textMuted,
          cardColor:   cardColor,
          borderColor: borderColor,
          onTap: () async {
            final f = await _pickImage();
            if (f != null && mounted) setState(() => _validIdFile = f);
          },
          onClear: () => setState(() => _validIdFile = null),
        ),
      ]),
      const SizedBox(height: 16),

      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color:        AppColors.infoBg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.info.withOpacity(0.3)),
        ),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Icon(Icons.info_outline_rounded, color: AppColors.info, size: 16),
          const SizedBox(width: 10),
          Expanded(child: Text(
            'Your documents will be reviewed by our team within 1–2 business '
            "days. You'll be notified once verified.",
            style: TextStyle(color: AppColors.info, fontSize: 12, height: 1.5),
          )),
        ]),
      ),
      const SizedBox(height: 24),

      Row(children: [
        Expanded(
          child: OutlinedButton.icon(
            icon:  const Icon(Icons.arrow_back_rounded, size: 16),
            label: const Text('Back'),
            style: OutlinedButton.styleFrom(minimumSize: const Size(0, 52)),
            onPressed: () => _goToStep(1),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          flex: 2,
          child: ElevatedButton.icon(
            icon:  const Icon(Icons.arrow_forward_rounded, size: 18),
            label: const Text('Continue',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            onPressed: _licenseFile != null && _validIdFile != null
                ? () => _goToStep(3)
                : null,
          ),
        ),
      ]),
      const SizedBox(height: 20),
    ]);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3 — Rental Agreement
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildStep3({
    required bool  isDark,
    required Color borderColor,
    required Color textPrim,
    required Color textSec,
    required Color textMuted,
    required bool  isLoading,
  }) {
    final bool canSubmit = _agreementRead &&
        _agreementChecked &&
        _signatureCtrl.text.trim().isNotEmpty &&
        !isLoading;

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Rental Agreement',
          style: TextStyle(
              fontSize: 20, fontWeight: FontWeight.w800, color: textPrim)),
      const SizedBox(height: 4),
      Text('Please read the agreement carefully before submitting.',
          style: TextStyle(color: textSec, fontSize: 13)),
      const SizedBox(height: 16),

      // Scrollable agreement box
      Container(
        height: 280,
        decoration: BoxDecoration(
          color: isDark ? AppColors.bgBase : const Color(0xFFF8F9FA),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: _agreementRead
                ? AppColors.success.withOpacity(0.5)
                : borderColor,
            width: _agreementRead ? 1.5 : 1,
          ),
        ),
        child: NotificationListener<ScrollNotification>(
          onNotification: (n) {
            if (!_agreementRead &&
                n.metrics.pixels >= n.metrics.maxScrollExtent - 80) {
              setState(() => _agreementRead = true);
            }
            return false;
          },
          child: SingleChildScrollView(
            controller: _agreementScroll,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('SAKYAN VEHICLE RENTAL AGREEMENT',
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: textPrim,
                        letterSpacing: 0.3)),
                const SizedBox(height: 4),
                Text(
                  'By completing this verification, you (the "Renter") agree '
                  'to be bound by the following terms with the vehicle owner '
                  'and Sakyan (the "Platform").',
                  style: TextStyle(fontSize: 11, color: textSec, height: 1.5),
                ),
                const SizedBox(height: 14),
                ..._clauses(textPrim, textSec),
              ],
            ),
          ),
        ),
      ),

      // Read confirmation / scroll hint
      AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        child: _agreementRead
            ? Padding(
                key: const ValueKey('read'),
                padding: const EdgeInsets.only(top: 8),
                child: Row(children: [
                  const Icon(Icons.check_circle_rounded,
                      color: AppColors.success, size: 15),
                  const SizedBox(width: 6),
                  Text('You have read the full rental agreement.',
                      style: TextStyle(
                          fontSize: 12,
                          color: AppColors.success,
                          fontWeight: FontWeight.w600)),
                ]),
              )
            : Padding(
                key: const ValueKey('hint'),
                padding: const EdgeInsets.only(top: 8),
                child: Row(children: [
                  Icon(Icons.arrow_downward_rounded, color: textMuted, size: 14),
                  const SizedBox(width: 6),
                  Text('Scroll to the bottom to enable acceptance.',
                      style: TextStyle(fontSize: 12, color: textMuted)),
                ]),
              ),
      ),
      const SizedBox(height: 16),

      // Agree checkbox
      GestureDetector(
        onTap: _agreementRead
            ? () => setState(() => _agreementChecked = !_agreementChecked)
            : null,
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 160),
            width: 22, height: 22,
            decoration: BoxDecoration(
              color: _agreementChecked ? AppColors.primary : Colors.transparent,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(
                color: _agreementRead
                    ? (_agreementChecked ? AppColors.primary : textMuted)
                    : borderColor,
                width: 1.5,
              ),
            ),
            child: _agreementChecked
                ? const Icon(Icons.check_rounded, size: 14, color: Colors.white)
                : null,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'I have read and agree to the Sakyan Rental Agreement and '
              'understand my obligations as a Renter.',
              style: TextStyle(
                  fontSize: 13,
                  color: _agreementRead ? textPrim : textMuted,
                  height: 1.4),
            ),
          ),
        ]),
      ),
      const SizedBox(height: 20),

      // Typed signature
      _Field(
        label: 'Type Your Full Name as Signature',
        child: TextField(
          controller: _signatureCtrl,
          enabled:    _agreementChecked,
          onChanged:  (_) => setState(() {}),
          style: TextStyle(
              color:     _agreementChecked ? textPrim : textMuted,
              fontSize:  14,
              fontStyle: FontStyle.italic),
          decoration: InputDecoration(
            hintText:  'e.g. Juan Dela Cruz',
            hintStyle: TextStyle(color: textMuted, fontSize: 13),
            filled:    true,
            fillColor: isDark ? AppColors.bgElevated : AppColors.bgElevatedLight,
            border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: borderColor)),
            enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: borderColor)),
            focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.primary, width: 1.5)),
            disabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: borderColor.withOpacity(0.5))),
            contentPadding: const EdgeInsets.symmetric(
                horizontal: 14, vertical: 14),
          ),
        ),
      ),
      const SizedBox(height: 24),

      // Buttons
      Row(children: [
        Expanded(
          child: OutlinedButton.icon(
            icon:  const Icon(Icons.arrow_back_rounded, size: 16),
            label: const Text('Back'),
            style: OutlinedButton.styleFrom(minimumSize: const Size(0, 52)),
            onPressed: isLoading ? null : () => _goToStep(2),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          flex: 2,
          child: ElevatedButton(
            onPressed: canSubmit ? _submit : null,
            child: isLoading
                ? const SizedBox(
                    width: 20, height: 20,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white))
                : const Text('Submit Verification',
                    style: TextStyle(
                        fontSize: 15, fontWeight: FontWeight.w700)),
          ),
        ),
      ]),
      const SizedBox(height: 20),
    ]);
  }

  // ── Agreement clauses — plain text, no emojis ─────────────────────────────
  List<Widget> _clauses(Color textPrim, Color textSec) {
    final items = [
      ('1. Vehicle Use',
       'The Renter agrees to use the vehicle solely for lawful personal '
       'transportation within the Philippines. Commercial use, racing, '
       'off-road driving, or operation under the influence of alcohol or '
       'controlled substances is strictly prohibited.'),
      ('2. Rental Period',
       'The Renter agrees to return the vehicle on or before the agreed '
       'return date and time. Late returns may incur additional charges '
       'as specified in the booking.'),
      ('3. Drivers License Requirement',
       'The Renter must hold a valid Philippine drivers license appropriate '
       'for the vehicle category throughout the entire rental period.'),
      ('4. Fuel Policy',
       'The Renter shall return the vehicle with the same fuel level as at '
       'the time of pickup. Failure to do so will result in a fueling surcharge.'),
      ('5. Damage and Liability',
       'The Renter is responsible for any damage occurring during the rental '
       'period, including collision, scratches, and interior damage, except '
       'for pre-existing damage documented at the time of handover.'),
      ('6. Insurance',
       'Third-party liability insurance as required by Philippine law is '
       'included. Comprehensive coverage for the rented vehicle is the '
       'responsibility of the vehicle owner unless otherwise agreed.'),
      ('7. Traffic Violations and Fines',
       'All traffic citations, parking fines, and toll fees incurred during '
       'the rental period are the sole responsibility of the Renter.'),
      ('8. Vehicle Condition',
       'The Renter agrees to inspect the vehicle upon pickup and report any '
       'pre-existing damage before driving. Unreported damage may result in '
       'the Renter being held liable.'),
      ('9. Personal Belongings',
       'The Platform and vehicle owner are not responsible for personal '
       'belongings left in the vehicle. Renters must remove all valuables '
       'upon returning the vehicle.'),
      ('10. Cancellation Policy',
       'Cancellations must be made through the Sakyan platform. Refund '
       'eligibility depends on the cancellation policy of the individual '
       'partner as displayed at the time of booking.'),
      ('11. Platform Authority',
       'Sakyan reserves the right to suspend or terminate a Renters account '
       'for violations of this agreement or platform policies without prior notice.'),
      ('12. Governing Law',
       'This agreement is governed by the laws of the Republic of the '
       'Philippines. Disputes shall be settled through mediation or, '
       'failing that, the courts of competent jurisdiction.'),
    ];

    final widgets = <Widget>[];
    for (final (t, b) in items) {
      widgets.add(Text(t,
          style: TextStyle(
              fontSize: 12, fontWeight: FontWeight.w700, color: textPrim)));
      widgets.add(const SizedBox(height: 3));
      widgets.add(Text(b,
          style: TextStyle(fontSize: 11, color: textSec, height: 1.55)));
      widgets.add(const SizedBox(height: 12));
    }
    return widgets;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-WIDGETS
// ─────────────────────────────────────────────────────────────────────────────

// ── Step progress bar ─────────────────────────────────────────────────────────
class _StepProgress extends StatelessWidget {
  final int   current, total;
  final Color borderColor, textMuted;
  const _StepProgress({
    required this.current,
    required this.total,
    required this.borderColor,
    required this.textMuted,
  });

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      ...List.generate(total, (i) => Expanded(
        child: Container(
          height: 4,
          margin: EdgeInsets.only(right: i < total - 1 ? 6 : 0),
          decoration: BoxDecoration(
            color: i <= current ? AppColors.primary : borderColor,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
      )),
      const SizedBox(width: 8),
      Text('Step ${current + 1} of $total',
          style: TextStyle(color: textMuted, fontSize: 11)),
    ]);
  }
}

// ── Field label wrapper ───────────────────────────────────────────────────────
class _Field extends StatelessWidget {
  final String label;
  final Widget child;
  const _Field({required this.label, required this.child});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label,
          style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isDark
                  ? AppColors.textSecondary
                  : AppColors.textSecondaryLight)),
      const SizedBox(height: 6),
      child,
    ]);
  }
}

// ── PSGC dropdown ─────────────────────────────────────────────────────────────
class _PsgcDropdown extends StatelessWidget {
  final String         value;
  final List<_PsgcItem> items;
  final String         placeholder;
  final bool           loading, disabled, isDark;
  final ValueChanged<String> onChanged;

  const _PsgcDropdown({
    required this.value,
    required this.items,
    required this.placeholder,
    this.loading  = false,
    this.disabled = false,
    required this.isDark,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      child: DropdownButton<String>(
        value: value.isEmpty ? null : value,
        hint: Row(children: [
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
                style: TextStyle(
                    fontSize: 13,
                    color: disabled
                        ? (isDark
                            ? AppColors.textMuted
                            : AppColors.textMutedLight)
                        : null)),
          ),
        ]),
        isExpanded:  true,
        underline:   const SizedBox.shrink(),
        disabledHint: Text(placeholder,
            style: TextStyle(
                fontSize: 13,
                color: isDark
                    ? AppColors.textMuted
                    : AppColors.textMutedLight)),
        items: disabled
            ? null
            : items
                .map((p) => DropdownMenuItem(
                      value: p.code,
                      child: Text(p.name,
                          style: const TextStyle(fontSize: 13)),
                    ))
                .toList(),
        onChanged: disabled ? null : (v) { if (v != null) onChanged(v); },
      ),
    );
  }
}

// ── Text input ────────────────────────────────────────────────────────────────
class _TextInput extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final bool   isDark;
  final Color  inputFill, borderColor;
  final TextInputType?        keyboardType;
  final Widget?               prefixIcon;
  final bool                  enabled;
  final ValueChanged<String>? onChanged;

  const _TextInput({
    required this.controller,
    required this.hint,
    required this.isDark,
    required this.inputFill,
    required this.borderColor,
    this.keyboardType,
    this.prefixIcon,
    this.enabled  = true,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller:   controller,
      keyboardType: keyboardType,
      enabled:      enabled,
      onChanged:    onChanged,
      style: TextStyle(
          fontSize: 13,
          color: isDark ? AppColors.textPrimary : AppColors.textPrimaryLight),
      decoration: InputDecoration(
        hintText:    hint,
        prefixIcon:  prefixIcon,
        filled:      true,
        fillColor:   inputFill,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: borderColor)),
        enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: borderColor)),
        focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.primary, width: 2)),
        disabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: borderColor)),
      ),
    );
  }
}

// ── Date input ────────────────────────────────────────────────────────────────
class _DateInput extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final bool   isDark;
  final Color  inputFill, borderColor;

  const _DateInput({
    required this.controller,
    required this.hint,
    required this.isDark,
    required this.inputFill,
    required this.borderColor,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        DateTime initial = DateTime(2000);
        if (controller.text.isNotEmpty) {
          initial = DateTime.tryParse(controller.text) ?? DateTime(2000);
        }
        final picked = await showDatePicker(
          context:     context,
          initialDate: initial,
          firstDate:   DateTime(1940),
          lastDate:    DateTime(2060),
        );
        if (picked != null) {
          controller.text =
              '${picked.year.toString().padLeft(4, '0')}-'
              '${picked.month.toString().padLeft(2, '0')}-'
              '${picked.day.toString().padLeft(2, '0')}';
        }
      },
      child: AbsorbPointer(
        child: TextField(
          controller: controller,
          readOnly:   true,
          style: TextStyle(
              fontSize: 13,
              color: isDark
                  ? AppColors.textPrimary
                  : AppColors.textPrimaryLight),
          decoration: InputDecoration(
            hintText:   hint,
            prefixIcon: const Icon(Icons.calendar_today_outlined, size: 16),
            filled:     true,
            fillColor:  inputFill,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: borderColor)),
            enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: borderColor)),
            focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(
                    color: AppColors.primary, width: 2)),
          ),
        ),
      ),
    );
  }
}

// ── Upload box ────────────────────────────────────────────────────────────────
class _UploadBox extends StatelessWidget {
  final String       label, hint;
  final bool         required;
  final File?        file;
  final Color        textMuted, cardColor, borderColor;
  final VoidCallback onTap, onClear;

  const _UploadBox({
    required this.label,
    required this.hint,
    this.required    = false,
    required this.file,
    required this.textMuted,
    required this.cardColor,
    required this.borderColor,
    required this.onTap,
    required this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Text(label,
            style: const TextStyle(
                fontSize: 13, fontWeight: FontWeight.w600)),
        if (required)
          const Text(' *',
              style: TextStyle(color: AppColors.error, fontSize: 13)),
      ]),
      const SizedBox(height: 4),
      Text(hint, style: TextStyle(fontSize: 11, color: textMuted)),
      const SizedBox(height: 8),
      GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          width: double.infinity,
          height: 180,
          decoration: BoxDecoration(
            color: file != null ? Colors.transparent : cardColor,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: file != null ? AppColors.success : borderColor,
              width: file != null ? 2 : 1,
            ),
          ),
          child: file != null
              ? Stack(fit: StackFit.expand, children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.file(file!, fit: BoxFit.cover),
                  ),
                  Positioned(
                    top: 6, right: 6,
                    child: GestureDetector(
                      onTap: onClear,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                            color: AppColors.error, shape: BoxShape.circle),
                        child: const Icon(Icons.close_rounded,
                            color: Colors.white, size: 12),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 6, left: 0, right: 0,
                    child: Center(
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                            color:        Colors.black54,
                            borderRadius: BorderRadius.circular(20)),
                        child: const Text('Tap to replace',
                            style: TextStyle(
                                color: Colors.white, fontSize: 10)),
                      ),
                    ),
                  ),
                ])
              : Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: AppColors.primaryGlow,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(Icons.upload_rounded,
                          color: AppColors.primary, size: 26),
                    ),
                    const SizedBox(height: 12),
                    const Text('Tap to upload',
                        style: TextStyle(
                            fontSize: 13, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text('Camera or Gallery · JPG / PNG',
                        style: TextStyle(fontSize: 11, color: textMuted)),
                  ],
                ),
        ),
      ),
    ]);
  }
}

// ── Source button ─────────────────────────────────────────────────────────────
class _SourceButton extends StatelessWidget {
  final IconData     icon;
  final String       label;
  final VoidCallback onTap;
  const _SourceButton(
      {required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 18),
        decoration: BoxDecoration(
          color:        AppColors.primaryGlow,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.primary.withOpacity(0.3)),
        ),
        child: Column(children: [
          Icon(icon, color: AppColors.primary, size: 28),
          const SizedBox(height: 8),
          Text(label,
              style: const TextStyle(
                  color:      AppColors.primary,
                  fontWeight: FontWeight.w600,
                  fontSize:   13)),
        ]),
      ),
    );
  }
}