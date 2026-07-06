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
      id: _requiredStringFrom([json['_id'], json['id']], 'id'),
      restaurantId: _requiredStringFrom([
        json['restaurantId'],
        json['restaurant_id'],
      ], 'restaurantId'),
      name: _requiredStringFrom([json['name']], 'name'),
      description: _nullableStringFrom([json['description']], 'description'),
      imageUrl: _nullableStringFrom([
        json['imageUrl'],
        json['image_url'],
        json['image'],
      ], 'imageUrl'),
      price: _requiredDoubleFrom([json['price'], json['basePrice']], 'price'),
      originalPrice: _optionalDoubleFrom([
        json['originalPrice'],
        json['original_price'],
      ], 'originalPrice'),
      category: _requiredStringFrom([json['category']], 'category'),
      optionGroups:
          _optionalListFrom([
                json['optionGroups'],
                json['option_groups'],
                json['options'],
              ], 'options')
              .map(
                (e) =>
                    ItemOptionGroup.fromJson(_requiredObject(e, 'options[]')),
              )
              .toList(),
      isAvailable: _requiredBoolFrom([
        json['isAvailable'],
        json['is_available'],
        json['available'],
      ], 'isAvailable'),
      isPopular: _requiredBoolFrom([
        json['isPopular'],
        json['is_popular'],
      ], 'isPopular'),
      orderCount: _optionalIntFrom([
        json['orderCount'],
        json['order_count'],
      ], 'orderCount'),
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
    final type = _optionGroupType(json);
    if (type != 'single' && type != 'multi') {
      throw FormatException('Invalid menu option group type: $type');
    }

    return ItemOptionGroup(
      name: _requiredStringFrom([json['name']], 'option.name'),
      type: type,
      required: _requiredBoolFrom([
        json['required'],
        json['isRequired'],
        json['is_required'],
      ], 'option.required'),
      options:
          _optionalListFrom([
                json['options'],
                json['values'],
                json['choices'],
              ], 'option.values')
              .map(
                (e) =>
                    ItemOption.fromJson(_requiredObject(e, 'option.values[]')),
              )
              .toList(),
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
      name: _requiredStringFrom([json['name'], json['value']], 'option.value'),
      price: _requiredDoubleFrom([
        json['price'],
        json['priceModifier'],
        json['price_modifier'],
      ], 'option.price'),
    );
  }

  Map<String, dynamic> toJson() {
    return {'name': name, 'price': price};
  }
}

String _optionGroupType(Map<String, dynamic> json) {
  final explicit = json['type'];
  if (explicit is String && explicit.trim().isNotEmpty) return explicit;

  final isMultiple = json['isMultiple'] ?? json['is_multiple'];
  if (isMultiple is bool) return isMultiple ? 'multi' : 'single';

  throw const FormatException('Missing required menu option group type');
}

Map<String, dynamic> _requiredObject(dynamic value, String field) {
  if (value is Map) {
    return Map<String, dynamic>.from(value);
  }
  throw FormatException('Invalid menu object field: $field');
}

List<dynamic> _optionalListFrom(List<dynamic> values, String field) {
  for (final value in values) {
    if (value == null) continue;
    if (value is List) return value;
    throw FormatException('Invalid menu list field: $field');
  }
  return const [];
}

String _requiredStringFrom(List<dynamic> values, String field) {
  for (final value in values) {
    if (value is String && value.trim().isNotEmpty) return value;
  }
  throw FormatException('Missing required menu string field: $field');
}

String? _nullableStringFrom(List<dynamic> values, String field) {
  for (final value in values) {
    if (value == null) continue;
    if (value is String) return value;
    throw FormatException('Invalid menu string field: $field');
  }
  return null;
}

bool _requiredBoolFrom(List<dynamic> values, String field) {
  for (final value in values) {
    if (value is bool) return value;
  }
  throw FormatException('Missing required menu boolean field: $field');
}

double _requiredDoubleFrom(List<dynamic> values, String field) {
  for (final value in values) {
    if (value is num && value.isFinite) return value.toDouble();
  }
  throw FormatException('Missing required menu numeric field: $field');
}

double? _optionalDoubleFrom(List<dynamic> values, String field) {
  for (final value in values) {
    if (value == null) continue;
    if (value is num && value.isFinite) return value.toDouble();
    throw FormatException('Invalid menu numeric field: $field');
  }
  return null;
}

int _optionalIntFrom(List<dynamic> values, String field) {
  for (final value in values) {
    if (value == null) continue;
    if (value is int && value >= 0) return value;
    if (value is num && value.isFinite && value >= 0 && value % 1 == 0) {
      return value.toInt();
    }
    throw FormatException('Invalid menu integer field: $field');
  }
  return 0;
}
