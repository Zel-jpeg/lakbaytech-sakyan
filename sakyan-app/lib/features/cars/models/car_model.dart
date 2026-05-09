import 'car_image_model.dart';

class CarModel {
  final String id;
  final String name;
  final String brand;
  final String model;
  final int? year;
  final String plateNumber;
  final String transmission;
  final String fuelType;
  final int seats;
  final String color;
  final double pricePerDay;
  final String location;
  final double? locationLat;
  final double? locationLng;
  final String description;
  final List<String> features;
  final String status;
  final bool isAvailable;
  final List<CarImageModel> images;
  final String partnerId;

  // ── Flat image URL returned by list endpoints when images[] is not included ──
  // Django list serializers often return a single `primary_image_url` field
  // instead of the full nested images array (for performance).
  final String? _flatPrimaryImageUrl;

  const CarModel({
    required this.id,
    required this.name,
    this.brand        = '',
    this.model        = '',
    this.year,
    this.plateNumber  = '',
    this.transmission = '',
    this.fuelType     = '',
    this.seats        = 5,
    this.color        = '',
    required this.pricePerDay,
    required this.location,
    this.locationLat,
    this.locationLng,
    this.description  = '',
    this.features     = const [],
    this.status       = 'active',
    this.isAvailable  = true,
    this.images       = const [],
    this.partnerId    = '',
    String? flatPrimaryImageUrl,
  }) : _flatPrimaryImageUrl = flatPrimaryImageUrl;

  // ── Safe number parsers ────────────────────────────────────────────────────
  static double? _toDouble(dynamic v) {
    if (v == null) return null;
    if (v is num) return v.toDouble();
    if (v is String) return double.tryParse(v);
    return null;
  }

  static int? _toInt(dynamic v) {
    if (v == null) return null;
    if (v is int) return v;
    if (v is num) return v.toInt();
    if (v is String) return int.tryParse(v);
    return null;
  }

  // ── primaryImageUrl: checks multiple sources in order of preference ────────
  //
  // Priority:
  //   1. Nested images[] array (detail endpoint — most reliable)
  //   2. Flat `primary_image_url` field (list endpoint shortcut)
  //   3. Flat `cover_image` / `image_url` fields (other common Django patterns)
  //
  String? get primaryImageUrl {
    // 1. Full images array (detail view)
    if (images.isNotEmpty) {
      try {
        return images.firstWhere((i) => i.isPrimary).imageUrl;
      } catch (_) {
        return images.first.imageUrl;
      }
    }
    // 2. Flat field injected at parse time
    if (_flatPrimaryImageUrl != null && _flatPrimaryImageUrl!.isNotEmpty) {
      return _flatPrimaryImageUrl;
    }
    return null;
  }

  String get transmissionLabel =>
      transmission == 'automatic' ? 'Automatic' : 'Manual';

  String get fuelLabel {
    switch (fuelType) {
      case 'gasoline': return 'Gasoline';
      case 'diesel':   return 'Diesel';
      case 'electric': return 'Electric';
      case 'hybrid':   return 'Hybrid';
      default:         return fuelType;
    }
  }

  // ── Serialisation ──────────────────────────────────────────────────────────
  factory CarModel.fromJson(Map<String, dynamic> json) {
    // partner can be a full object or just an id string
    String partnerId = '';
    final p = json['partner'];
    if (p is Map) {
      partnerId = p['id'] as String? ?? '';
    } else if (p is String) {
      partnerId = p;
    }

    final rawFeatures = json['features'];
    List<String> features = const [];
    if (rawFeatures is List) {
      features = rawFeatures.map((e) => e.toString()).toList();
    }

    final rawImages = json['images'];
    List<CarImageModel> images = const [];
    if (rawImages is List && rawImages.isNotEmpty) {
      images = rawImages
          .map((e) => CarImageModel.fromJson(e as Map<String, dynamic>))
          .toList();
    }

    // ── Flat image URL fallback (for list endpoints that skip images[]) ──────
    //
    // Try several field names that Django backends commonly use:
    //   • primary_image_url   (explicit)
    //   • cover_image         (some setups)
    //   • image_url           (simple single-image models)
    //
    // If your backend uses a different name, add it here.
    //
    String? flatImageUrl;
    if (images.isEmpty) {
      flatImageUrl =
          _firstNonEmpty([
            json['primary_image'],       // ← your Django field name
            json['primary_image_url'],
            json['cover_image'],
            json['image_url'],
          ]);

      // Also check the first element of images if it came back as a
      // list of strings rather than a list of objects (some APIs do this).
      if (flatImageUrl == null && rawImages is List && rawImages.isNotEmpty) {
        final first = rawImages.first;
        if (first is String && first.isNotEmpty) {
          flatImageUrl = first;
        }
      }
    }

    return CarModel(
      id:                   json['id']?.toString()           ?? '',
      name:                 json['name']?.toString()         ?? '',
      brand:                json['brand']?.toString()        ?? '',
      model:                json['model']?.toString()        ?? '',
      year:                 _toInt(json['year']),
      plateNumber:          json['plate_number']?.toString() ?? '',
      transmission:         json['transmission']?.toString() ?? '',
      fuelType:             json['fuel_type']?.toString()    ?? '',
      seats:                _toInt(json['seats'])            ?? 5,
      color:                json['color']?.toString()        ?? '',
      pricePerDay:          _toDouble(json['price_per_day']) ?? 0,
      location:             json['location']?.toString()     ?? '',
      locationLat:          _toDouble(json['location_lat']),
      locationLng:          _toDouble(json['location_lng']),
      description:          json['description']?.toString()  ?? '',
      features:             features,
      status:               json['status']?.toString()       ?? 'active',
      isAvailable:          json['is_available'] as bool?    ?? true,
      images:               images,
      partnerId:            partnerId,
      flatPrimaryImageUrl:  flatImageUrl,
    );
  }

  Map<String, dynamic> toJson() => {
    'name':          name,
    'brand':         brand,
    'model':         model,
    'year':          year,
    'plate_number':  plateNumber,
    'transmission':  transmission,
    'fuel_type':     fuelType,
    'seats':         seats,
    'color':         color,
    'price_per_day': pricePerDay,
    'location':      location,
    'location_lat':  locationLat,
    'location_lng':  locationLng,
    'description':   description,
    'features':      features,
  };

  // ── Utility ────────────────────────────────────────────────────────────────
  static String? _firstNonEmpty(List<dynamic?> values) {
    for (final v in values) {
      if (v is String && v.isNotEmpty) return v;
    }
    return null;
  }
}