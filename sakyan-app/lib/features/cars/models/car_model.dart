import 'car_image_model.dart';
class CarModel {
  final String id;
  final String name;
  final String brand;
  final String model;
  final int? year;
  final String plateNumber;
  final String transmission; // 'manual' | 'automatic'
  final String fuelType;     // 'gasoline' | 'diesel' | 'electric' | 'hybrid'
  final int seats;
  final String color;
  final double pricePerDay;
  final String location;
  final double? locationLat;
  final double? locationLng;
  final String description;
  final List<String> features;
  final String status;       // 'active' | 'inactive'
  final bool isAvailable;
  final List<CarImageModel> images;
  final String partnerId;
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
  });
  // ── Helpers ────────────────────────────────────────────────────────────────
  String? get primaryImageUrl {
    if (images.isEmpty) return null;
    try {
      return images.firstWhere((i) => i.isPrimary).imageUrl;
    } catch (_) {
      return images.first.imageUrl;
    }
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
    if (rawImages is List) {
      images = rawImages
          .map((e) => CarImageModel.fromJson(e as Map<String, dynamic>))
          .toList();
    }
    return CarModel(
      id:           json['id']           as String? ?? '',
      name:         json['name']         as String? ?? '',
      brand:        json['brand']        as String? ?? '',
      model:        json['model']        as String? ?? '',
      year:         json['year']         as int?,
      plateNumber:  json['plate_number'] as String? ?? '',
      transmission: json['transmission'] as String? ?? '',
      fuelType:     json['fuel_type']    as String? ?? '',
      seats:        json['seats']        as int? ?? 5,
      color:        json['color']        as String? ?? '',
      pricePerDay:  (json['price_per_day'] as num?)?.toDouble() ?? 0,
      location:     json['location']     as String? ?? '',
      locationLat:  (json['location_lat'] as num?)?.toDouble(),
      locationLng:  (json['location_lng'] as num?)?.toDouble(),
      description:  json['description']  as String? ?? '',
      features:     features,
      status:       json['status']       as String? ?? 'active',
      isAvailable:  json['is_available'] as bool? ?? true,
      images:       images,
      partnerId:    partnerId,
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
}
