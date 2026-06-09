// ── Users ──

class UserAddress {
  final String id;
  final String label;
  final String addressLine;
  final double lat;
  final double lng;
  final bool isDefault;

  const UserAddress({
    required this.id,
    required this.label,
    required this.addressLine,
    required this.lat,
    required this.lng,
    required this.isDefault,
  });

  factory UserAddress.fromJson(Map<String, dynamic> json) => UserAddress(
    id: json['id'] as String,
    label: json['label'] as String,
    addressLine: json['addressLine'] as String,
    lat: (json['lat'] as num).toDouble(),
    lng: (json['lng'] as num).toDouble(),
    isDefault: json['isDefault'] as bool,
  );

  Map<String, dynamic> toJson() => {
    'label': label,
    'addressLine': addressLine,
    'lat': lat,
    'lng': lng,
    if (isDefault) 'isDefault': isDefault,
  };
}

class DriverProfile {
  final String? licenseNumber;
  final String vehicleType;
  final String? vehiclePlate;
  final bool isOnline;
  final bool isVerified;
  final double rating;
  final int totalDeliveries;
  final int totalEarnings;

  const DriverProfile({
    this.licenseNumber,
    required this.vehicleType,
    this.vehiclePlate,
    required this.isOnline,
    required this.isVerified,
    required this.rating,
    required this.totalDeliveries,
    required this.totalEarnings,
  });

  factory DriverProfile.fromJson(Map<String, dynamic> json) => DriverProfile(
    licenseNumber: json['licenseNumber'] as String?,
    vehicleType: json['vehicleType'] as String,
    vehiclePlate: json['vehiclePlate'] as String?,
    isOnline: json['isOnline'] as bool,
    isVerified: json['isVerified'] as bool,
    rating: (json['rating'] as num).toDouble(),
    totalDeliveries: json['totalDeliveries'] as int,
    totalEarnings: json['totalEarnings'] as int,
  );
}

class CustomerProfileInfo {
  final int totalOrders;
  final UserAddress? defaultAddress;

  const CustomerProfileInfo({required this.totalOrders, this.defaultAddress});

  factory CustomerProfileInfo.fromJson(Map<String, dynamic> json) =>
      CustomerProfileInfo(
        totalOrders: json['totalOrders'] as int,
        defaultAddress: json['defaultAddress'] != null
            ? UserAddress.fromJson(json['defaultAddress'] as Map<String, dynamic>)
            : null,
      );
}

class RestaurantProfileInfo {
  final String restaurantId;

  const RestaurantProfileInfo({required this.restaurantId});

  factory RestaurantProfileInfo.fromJson(Map<String, dynamic> json) =>
      RestaurantProfileInfo(restaurantId: json['restaurantId'] as String);
}

// ── Restaurants ──

class RestaurantSummary {
  final String id;
  final String name;
  final String slug;
  final String? logoUrl;
  final String? coverUrl;
  final String addressLine;
  final String city;
  final String? district;
  final List<String> cuisineTypes;
  final String priceRange;
  final double rating;
  final int totalReviews;
  final int prepTimeAvgMinutes;
  final bool isOpen;
  final int minOrderAmount;
  final double? distanceKm;

  const RestaurantSummary({
    required this.id,
    required this.name,
    required this.slug,
    this.logoUrl,
    this.coverUrl,
    required this.addressLine,
    required this.city,
    this.district,
    required this.cuisineTypes,
    required this.priceRange,
    required this.rating,
    required this.totalReviews,
    required this.prepTimeAvgMinutes,
    required this.isOpen,
    required this.minOrderAmount,
    this.distanceKm,
  });

  factory RestaurantSummary.fromJson(Map<String, dynamic> json) =>
      RestaurantSummary(
        id: json['id'] as String,
        name: json['name'] as String,
        slug: json['slug'] as String,
        logoUrl: json['logoUrl'] as String?,
        coverUrl: json['coverUrl'] as String?,
        addressLine: json['addressLine'] as String,
        city: json['city'] as String,
        district: json['district'] as String?,
        cuisineTypes: (json['cuisineTypes'] as List<dynamic>).cast<String>(),
        priceRange: json['priceRange'] as String,
        rating: (json['rating'] as num).toDouble(),
        totalReviews: json['totalReviews'] as int,
        prepTimeAvgMinutes: json['prepTimeAvgMinutes'] as int,
        isOpen: json['isOpen'] as bool,
        minOrderAmount: json['minOrderAmount'] as int,
        distanceKm: (json['distanceKm'] as num?)?.toDouble(),
      );
}

class OpeningHour {
  final int dayOfWeek;
  final String openTime;
  final String closeTime;
  final bool isClosed;

  const OpeningHour({
    required this.dayOfWeek,
    required this.openTime,
    required this.closeTime,
    required this.isClosed,
  });

  factory OpeningHour.fromJson(Map<String, dynamic> json) => OpeningHour(
    dayOfWeek: json['dayOfWeek'] as int,
    openTime: json['openTime'] as String,
    closeTime: json['closeTime'] as String,
    isClosed: json['isClosed'] as bool,
  );
}

class RestaurantDetail extends RestaurantSummary {
  final String? phone;
  final String? description;
  final bool isActive;
  final String createdAt;
  final List<OpeningHour> openingHours;

  const RestaurantDetail({
    required super.id,
    required super.name,
    required super.slug,
    super.logoUrl,
    super.coverUrl,
    required super.addressLine,
    required super.city,
    super.district,
    required super.cuisineTypes,
    required super.priceRange,
    required super.rating,
    required super.totalReviews,
    required super.prepTimeAvgMinutes,
    required super.isOpen,
    required super.minOrderAmount,
    super.distanceKm,
    this.phone,
    this.description,
    required this.isActive,
    required this.createdAt,
    required this.openingHours,
  });

  factory RestaurantDetail.fromJson(Map<String, dynamic> json) =>
      RestaurantDetail(
        id: json['id'] as String,
        name: json['name'] as String,
        slug: json['slug'] as String,
        logoUrl: json['logoUrl'] as String?,
        coverUrl: json['coverUrl'] as String?,
        addressLine: json['addressLine'] as String,
        city: json['city'] as String,
        district: json['district'] as String?,
        cuisineTypes: (json['cuisineTypes'] as List<dynamic>).cast<String>(),
        priceRange: json['priceRange'] as String,
        rating: (json['rating'] as num).toDouble(),
        totalReviews: json['totalReviews'] as int,
        prepTimeAvgMinutes: json['prepTimeAvgMinutes'] as int,
        isOpen: json['isOpen'] as bool,
        minOrderAmount: json['minOrderAmount'] as int,
        distanceKm: (json['distanceKm'] as num?)?.toDouble(),
        phone: json['phone'] as String?,
        description: json['description'] as String?,
        isActive: json['isActive'] as bool,
        createdAt: json['createdAt'] as String,
        openingHours: (json['openingHours'] as List<dynamic>)
            .map((e) => OpeningHour.fromJson(e as Map<String, dynamic>))
            .toList(),
      );
}
