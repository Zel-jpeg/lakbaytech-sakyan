class CarImageModel {
  final String id;
  final String imageUrl;
  final bool isPrimary;
  final int sortOrder;

  const CarImageModel({
    required this.id,
    required this.imageUrl,
    this.isPrimary = false,
    this.sortOrder = 0,
  });

  factory CarImageModel.fromJson(Map<String, dynamic> json) => CarImageModel(
        id:        json['id'] as String? ?? '',
        imageUrl:  json['image_url'] as String? ?? '',
        isPrimary: json['is_primary'] as bool? ?? false,
        sortOrder: json['sort_order'] as int? ?? 0,
      );
}
