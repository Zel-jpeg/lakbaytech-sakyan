class UserModel {
  final String id;
  final String fullName;
  final String email;
  final String phone;
  final String role; // 'customer' | 'partner' | 'admin'
  final String avatarUrl;
  final DateTime createdAt;

  const UserModel({
    required this.id,
    required this.fullName,
    required this.email,
    this.phone = '',
    required this.role,
    this.avatarUrl = '',
    required this.createdAt,
  });

  bool get isCustomer => role == 'customer';
  bool get isPartner  => role == 'partner';
  bool get isAdmin    => role == 'admin';

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
    id:        json['id'] as String,
    fullName:  json['full_name'] as String? ?? '',
    email:     json['email'] as String? ?? '',
    phone:     json['phone'] as String? ?? '',
    role:      json['role'] as String? ?? 'customer',
    avatarUrl: json['avatar_url'] as String? ?? '',
    createdAt: json['created_at'] != null
        ? DateTime.tryParse(json['created_at'] as String) ?? DateTime.now()
        : DateTime.now(),
  );

  Map<String, dynamic> toJson() => {
    'id':         id,
    'full_name':  fullName,
    'email':      email,
    'phone':      phone,
    'role':       role,
    'avatar_url': avatarUrl,
    'created_at': createdAt.toIso8601String(),
  };

  UserModel copyWith({
    String? fullName,
    String? phone,
    String? role,
    String? avatarUrl,
  }) => UserModel(
    id:        id,
    fullName:  fullName   ?? this.fullName,
    email:     email,
    phone:     phone      ?? this.phone,
    role:      role       ?? this.role,
    avatarUrl: avatarUrl  ?? this.avatarUrl,
    createdAt: createdAt,
  );
}
