import '../utils/backend_date_time.dart';

class UserModel {
  final String id;
  final String fullName;
  final String email;
  final String phone;
  final String role;
  final String? avatarUrl;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;
  final AddressModel? defaultAddress;
  final List<AddressModel>? addresses;

  UserModel({
    required this.id,
    required this.fullName,
    required this.email,
    required this.phone,
    required this.role,
    this.avatarUrl,
    this.isActive = true,
    required this.createdAt,
    required this.updatedAt,
    this.defaultAddress,
    this.addresses,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      fullName:
          json['fullName'] as String? ?? json['full_name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      role: json['role'] as String? ?? 'customer',
      avatarUrl: json['avatarUrl'] as String? ?? json['avatar_url'] as String?,
      isActive: json['isActive'] as bool? ?? json['is_active'] as bool? ?? true,
      createdAt: parseBackendDateTimeOrUnknown(
        json['createdAt'] ?? json['created_at'],
      ),
      updatedAt: parseBackendDateTimeOrUnknown(
        json['updatedAt'] ?? json['updated_at'],
      ),
      defaultAddress: json['defaultAddress'] != null
          ? AddressModel.fromJson(
              json['defaultAddress'] as Map<String, dynamic>,
            )
          : json['default_address'] != null
          ? AddressModel.fromJson(
              json['default_address'] as Map<String, dynamic>,
            )
          : null,
      addresses: json['addresses'] != null
          ? (json['addresses'] as List<dynamic>)
                .map((e) => AddressModel.fromJson(e as Map<String, dynamic>))
                .toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullName': fullName,
      'email': email,
      'phone': phone,
      'role': role,
      'avatarUrl': avatarUrl,
      'isActive': isActive,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'defaultAddress': defaultAddress?.toJson(),
      'addresses': addresses?.map((e) => e.toJson()).toList(),
    };
  }

  UserModel copyWith({
    String? fullName,
    String? email,
    String? phone,
    String? avatarUrl,
    AddressModel? defaultAddress,
    List<AddressModel>? addresses,
  }) {
    return UserModel(
      id: id,
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      role: role,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      isActive: isActive,
      createdAt: createdAt,
      updatedAt: updatedAt,
      defaultAddress: defaultAddress ?? this.defaultAddress,
      addresses: addresses ?? this.addresses,
    );
  }
}

class AddressModel {
  final String id;
  final String label;
  final String address;
  final double latitude;
  final double longitude;
  final String? apartmentNumber;
  final String? note;
  final bool isDefault;

  AddressModel({
    required this.id,
    this.label = 'Nhà',
    required this.address,
    required this.latitude,
    required this.longitude,
    this.apartmentNumber,
    this.note,
    this.isDefault = false,
  });

  factory AddressModel.fromJson(Map<String, dynamic> json) {
    return AddressModel(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      label: json['label'] as String? ?? 'Nhà',
      address: json['address'] as String? ?? '',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      apartmentNumber:
          json['apartmentNumber'] as String? ??
          json['apartment_number'] as String?,
      note: json['note'] as String?,
      isDefault:
          json['isDefault'] as bool? ?? json['is_default'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'label': label,
      'address': address,
      'latitude': latitude,
      'longitude': longitude,
      'apartmentNumber': apartmentNumber,
      'note': note,
      'isDefault': isDefault,
    };
  }

  AddressModel copyWith({
    String? label,
    String? address,
    double? latitude,
    double? longitude,
    String? apartmentNumber,
    String? note,
    bool? isDefault,
  }) {
    return AddressModel(
      id: id,
      label: label ?? this.label,
      address: address ?? this.address,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      apartmentNumber: apartmentNumber ?? this.apartmentNumber,
      note: note ?? this.note,
      isDefault: isDefault ?? this.isDefault,
    );
  }
}
