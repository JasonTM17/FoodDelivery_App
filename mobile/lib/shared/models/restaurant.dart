class RestaurantModel {
  final String id;
  final String name;
  final String? description;
  final String? coverImageUrl;
  final String? logoUrl;
  final double rating;
  final int reviewCount;
  final String? distance;
  final int estimatedPrepTime;
  final String priceRange;
  final List<String> cuisineTypes;
  final bool isOpen;
  final double latitude;
  final double longitude;
  final String? address;
  final String? phone;
  final List<ReviewModel>? reviews;

  RestaurantModel({
    required this.id,
    required this.name,
    this.description,
    this.coverImageUrl,
    this.logoUrl,
    this.rating = 0.0,
    this.reviewCount = 0,
    this.distance,
    this.estimatedPrepTime = 0,
    this.priceRange = '\$\$',
    this.cuisineTypes = const [],
    this.isOpen = true,
    this.latitude = 0.0,
    this.longitude = 0.0,
    this.address,
    this.phone,
    this.reviews,
  });

  factory RestaurantModel.fromJson(Map<String, dynamic> json) {
    return RestaurantModel(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      coverImageUrl:
          json['coverImageUrl'] as String? ??
          json['cover_image_url'] as String?,
      logoUrl: json['logoUrl'] as String? ?? json['logo_url'] as String?,
      rating: (json['rating'] as num?)?.toDouble() ?? 0.0,
      reviewCount:
          json['reviewCount'] as int? ?? json['review_count'] as int? ?? 0,
      distance: json['distance'] as String?,
      estimatedPrepTime:
          json['estimatedPrepTime'] as int? ??
          json['estimated_prep_time'] as int? ??
          0,
      priceRange:
          json['priceRange'] as String? ??
          json['price_range'] as String? ??
          '\$\$',
      cuisineTypes:
          (json['cuisineTypes'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          (json['cuisine_types'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          [],
      isOpen: json['isOpen'] as bool? ?? json['is_open'] as bool? ?? true,
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      address: json['address'] as String?,
      phone: json['phone'] as String?,
      reviews: json['reviews'] != null
          ? (json['reviews'] as List<dynamic>)
                .map((e) => ReviewModel.fromJson(e as Map<String, dynamic>))
                .toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'coverImageUrl': coverImageUrl,
      'logoUrl': logoUrl,
      'rating': rating,
      'reviewCount': reviewCount,
      'distance': distance,
      'estimatedPrepTime': estimatedPrepTime,
      'priceRange': priceRange,
      'cuisineTypes': cuisineTypes,
      'isOpen': isOpen,
      'latitude': latitude,
      'longitude': longitude,
      'address': address,
      'phone': phone,
      'reviews': reviews?.map((e) => e.toJson()).toList(),
    };
  }
}

class ReviewModel {
  final String id;
  final String userId;
  final String? userName;
  final String? userAvatarUrl;
  final double foodRating;
  final double deliveryRating;
  final String? comment;
  final DateTime createdAt;

  ReviewModel({
    required this.id,
    required this.userId,
    this.userName,
    this.userAvatarUrl,
    this.foodRating = 5.0,
    this.deliveryRating = 5.0,
    this.comment,
    required this.createdAt,
  });

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    return ReviewModel(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? json['user_id'] as String? ?? '',
      userName: json['userName'] as String? ?? json['user_name'] as String?,
      userAvatarUrl:
          json['userAvatarUrl'] as String? ??
          json['user_avatar_url'] as String?,
      foodRating: (json['foodRating'] as num?)?.toDouble() ?? 5.0,
      deliveryRating: (json['deliveryRating'] as num?)?.toDouble() ?? 5.0,
      comment: json['comment'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'foodRating': foodRating,
      'deliveryRating': deliveryRating,
      'comment': comment,
    };
  }
}
