// ── Menu ──

class MenuCategory {
  final String id;
  final String name;
  final int sortOrder;

  const MenuCategory({
    required this.id,
    required this.name,
    required this.sortOrder,
  });

  factory MenuCategory.fromJson(Map<String, dynamic> json) => MenuCategory(
    id: json['id'] as String,
    name: json['name'] as String,
    sortOrder: json['sortOrder'] as int,
  );
}

class MenuItemOptionValue {
  final String id;
  final String value;
  final int priceModifier;

  const MenuItemOptionValue({
    required this.id,
    required this.value,
    required this.priceModifier,
  });

  factory MenuItemOptionValue.fromJson(Map<String, dynamic> json) =>
      MenuItemOptionValue(
        id: json['id'] as String,
        value: json['value'] as String,
        priceModifier: json['priceModifier'] as int,
      );
}

class MenuItemOption {
  final String id;
  final String name;
  final bool isRequired;
  final bool isMultiple;
  final List<MenuItemOptionValue> values;

  const MenuItemOption({
    required this.id,
    required this.name,
    required this.isRequired,
    required this.isMultiple,
    required this.values,
  });

  factory MenuItemOption.fromJson(Map<String, dynamic> json) => MenuItemOption(
    id: json['id'] as String,
    name: json['name'] as String,
    isRequired: json['isRequired'] as bool,
    isMultiple: json['isMultiple'] as bool,
    values: (json['values'] as List<dynamic>)
        .map((e) => MenuItemOptionValue.fromJson(e as Map<String, dynamic>))
        .toList(),
  );
}

class MenuItem {
  final String id;
  final String categoryId;
  final String name;
  final String? description;
  final String? imageUrl;
  final int basePrice;
  final bool isAvailable;
  final bool isPopular;
  final List<MenuItemOption>? options;

  const MenuItem({
    required this.id,
    required this.categoryId,
    required this.name,
    this.description,
    this.imageUrl,
    required this.basePrice,
    required this.isAvailable,
    required this.isPopular,
    this.options,
  });

  factory MenuItem.fromJson(Map<String, dynamic> json) => MenuItem(
    id: json['id'] as String,
    categoryId: json['categoryId'] as String,
    name: json['name'] as String,
    description: json['description'] as String?,
    imageUrl: json['imageUrl'] as String?,
    basePrice: json['basePrice'] as int,
    isAvailable: json['isAvailable'] as bool,
    isPopular: json['isPopular'] as bool,
    options: (json['options'] as List<dynamic>?)
        ?.map((e) => MenuItemOption.fromJson(e as Map<String, dynamic>))
        .toList(),
  );
}

class MenuResponse {
  final List<MenuCategory> categories;
  final List<MenuItem> items;

  const MenuResponse({required this.categories, required this.items});

  factory MenuResponse.fromJson(Map<String, dynamic> json) => MenuResponse(
    categories: (json['categories'] as List<dynamic>)
        .map((e) => MenuCategory.fromJson(e as Map<String, dynamic>))
        .toList(),
    items: (json['items'] as List<dynamic>)
        .map((e) => MenuItem.fromJson(e as Map<String, dynamic>))
        .toList(),
  );
}

// ── Cart ──

class CartItem {
  final String id;
  final String menuItemId;
  final String name;
  final String? imageUrl;
  final int quantity;
  final int unitPrice;
  final List<Map<String, dynamic>>? selectedOptions;
  final String? notes;

  const CartItem({
    required this.id,
    required this.menuItemId,
    required this.name,
    this.imageUrl,
    required this.quantity,
    required this.unitPrice,
    this.selectedOptions,
    this.notes,
  });

  factory CartItem.fromJson(Map<String, dynamic> json) => CartItem(
    id: json['id'] as String,
    menuItemId: json['menuItemId'] as String,
    name: json['name'] as String,
    imageUrl: json['imageUrl'] as String?,
    quantity: json['quantity'] as int,
    unitPrice: json['unitPrice'] as int,
    selectedOptions: (json['selectedOptions'] as List<dynamic>?)
        ?.map((e) => Map<String, dynamic>.from(e as Map))
        .toList(),
    notes: json['notes'] as String?,
  );
}

class CartResponse {
  final String? id;
  final String? restaurantId;
  final String? restaurantName;
  final String? promotionCode;
  final int? promotionDiscount;
  final List<CartItem> items;
  final int subtotal;
  final int itemCount;

  const CartResponse({
    this.id,
    this.restaurantId,
    this.restaurantName,
    this.promotionCode,
    this.promotionDiscount,
    required this.items,
    required this.subtotal,
    required this.itemCount,
  });

  factory CartResponse.fromJson(Map<String, dynamic> json) => CartResponse(
    id: json['id'] as String?,
    restaurantId: json['restaurantId'] as String?,
    restaurantName: json['restaurantName'] as String?,
    promotionCode: json['promotionCode'] as String?,
    promotionDiscount: json['promotionDiscount'] as int?,
    items: (json['items'] as List<dynamic>)
        .map((e) => CartItem.fromJson(e as Map<String, dynamic>))
        .toList(),
    subtotal: json['subtotal'] as int,
    itemCount: json['itemCount'] as int,
  );
}

class AddCartItemRequest {
  final String menuItemId;
  final int quantity;
  final int unitPrice;
  final List<Map<String, dynamic>>? selectedOptions;
  final String? notes;

  const AddCartItemRequest({
    required this.menuItemId,
    required this.quantity,
    required this.unitPrice,
    this.selectedOptions,
    this.notes,
  });

  Map<String, dynamic> toJson() => {
    'menuItemId': menuItemId,
    'quantity': quantity,
    'unitPrice': unitPrice,
    if (selectedOptions != null) 'selectedOptions': selectedOptions,
    if (notes != null) 'notes': notes,
  };
}
