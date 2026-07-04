class MenuItemModel {
  final String id;
  final String restaurantId;
  final String name;
  final String? description;
  final String? imageUrl;
  final double price;
  final double? originalPrice;
  final String category;
  final List<ItemOptionGroup> optionGroups;
  final bool isAvailable;
  final bool isPopular;
  final int orderCount;

  MenuItemModel({
    required this.id,
    required this.restaurantId,
    required this.name,
    this.description,
    this.imageUrl,
    required this.price,
    this.originalPrice,
    required this.category,
    this.optionGroups = const [],
    this.isAvailable = true,
    this.isPopular = false,
    this.orderCount = 0,
  });

  factory MenuItemModel.fromJson(Map<String, dynamic> json) {
    return MenuItemModel(
      id: json['_id'] as String? ?? json['id'] as String? ?? '',
      restaurantId:
          json['restaurantId'] as String? ??
          json['restaurant_id'] as String? ??
          '',
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      imageUrl: json['imageUrl'] as String? ?? json['image_url'] as String?,
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      originalPrice: (json['originalPrice'] as num?)?.toDouble(),
      category: json['category'] as String? ?? 'General',
      optionGroups: json['optionGroups'] != null
          ? (json['optionGroups'] as List<dynamic>)
                .map((e) => ItemOptionGroup.fromJson(e as Map<String, dynamic>))
                .toList()
          : json['option_groups'] != null
          ? (json['option_groups'] as List<dynamic>)
                .map((e) => ItemOptionGroup.fromJson(e as Map<String, dynamic>))
                .toList()
          : [],
      isAvailable:
          json['isAvailable'] as bool? ?? json['is_available'] as bool? ?? true,
      isPopular:
          json['isPopular'] as bool? ?? json['is_popular'] as bool? ?? false,
      orderCount:
          json['orderCount'] as int? ?? json['order_count'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'restaurantId': restaurantId,
      'name': name,
      'description': description,
      'imageUrl': imageUrl,
      'price': price,
      'originalPrice': originalPrice,
      'category': category,
      'optionGroups': optionGroups.map((e) => e.toJson()).toList(),
      'isAvailable': isAvailable,
      'isPopular': isPopular,
      'orderCount': orderCount,
    };
  }
}

class ItemOptionGroup {
  final String name;
  final String type;
  final bool required;
  final List<ItemOption> options;

  ItemOptionGroup({
    required this.name,
    this.type = 'single',
    this.required = false,
    this.options = const [],
  });

  factory ItemOptionGroup.fromJson(Map<String, dynamic> json) {
    return ItemOptionGroup(
      name: json['name'] as String? ?? '',
      type: json['type'] as String? ?? 'single',
      required: json['required'] as bool? ?? false,
      options: json['options'] != null
          ? (json['options'] as List<dynamic>)
                .map((e) => ItemOption.fromJson(e as Map<String, dynamic>))
                .toList()
          : [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'type': type,
      'required': required,
      'options': options.map((e) => e.toJson()).toList(),
    };
  }
}

class ItemOption {
  final String name;
  final double price;

  ItemOption({required this.name, this.price = 0.0});

  factory ItemOption.fromJson(Map<String, dynamic> json) {
    return ItemOption(
      name: json['name'] as String? ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {'name': name, 'price': price};
  }
}
