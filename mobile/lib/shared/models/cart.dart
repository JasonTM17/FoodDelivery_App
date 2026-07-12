import 'menu_item.dart';

class CartItemModel {
  /// Server-side cart line id from POST/GET /cart (null when local-only).
  final String? cartItemId;
  final MenuItemModel menuItem;
  int quantity;
  final List<SelectedOption> selectedOptions;
  String? specialInstructions;
  final double unitPrice;

  CartItemModel({
    this.cartItemId,
    required this.menuItem,
    this.quantity = 1,
    this.selectedOptions = const [],
    this.specialInstructions,
    double? unitPrice,
  }) : unitPrice = unitPrice ?? menuItem.price;

  double get totalPrice {
    final optionsPrice = selectedOptions.fold<double>(
      0.0,
      (sum, option) => sum + option.price,
    );
    return (unitPrice + optionsPrice) * quantity;
  }

  double get optionsTotal {
    return selectedOptions.fold<double>(
      0.0,
      (sum, option) => sum + option.price,
    );
  }

  CartItemModel copyWith({
    String? cartItemId,
    MenuItemModel? menuItem,
    int? quantity,
    List<SelectedOption>? selectedOptions,
    String? specialInstructions,
    double? unitPrice,
  }) {
    return CartItemModel(
      cartItemId: cartItemId ?? this.cartItemId,
      menuItem: menuItem ?? this.menuItem,
      quantity: quantity ?? this.quantity,
      selectedOptions: selectedOptions ?? this.selectedOptions,
      specialInstructions: specialInstructions ?? this.specialInstructions,
      unitPrice: unitPrice ?? this.unitPrice,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (cartItemId != null) 'id': cartItemId,
      'menuItemId': menuItem.id,
      'name': menuItem.name,
      'quantity': quantity,
      'selectedOptions': selectedOptions.map((e) => e.toJson()).toList(),
      'specialInstructions': specialInstructions,
      'unitPrice': unitPrice,
    };
  }
}

class SelectedOption {
  final String groupName;
  final String optionName;
  final double price;
  final String? optionId;
  final String? valueId;

  SelectedOption({
    required this.groupName,
    required this.optionName,
    this.price = 0.0,
    this.optionId,
    this.valueId,
  });

  Map<String, dynamic> toJson() {
    return {
      'groupName': groupName,
      'optionName': optionName,
      'price': price,
      if (optionId != null) 'optionId': optionId,
      if (valueId != null) 'valueId': valueId,
    };
  }

  Map<String, String>? toApiOption() {
    if (optionId == null ||
        optionId!.isEmpty ||
        valueId == null ||
        valueId!.isEmpty) {
      return null;
    }
    return {'optionId': optionId!, 'valueId': valueId!};
  }
}

class CartModel {
  final String restaurantId;
  final String restaurantName;
  final String? restaurantLogoUrl;
  final List<CartItemModel> items;

  CartModel({
    required this.restaurantId,
    required this.restaurantName,
    this.restaurantLogoUrl,
    this.items = const [],
  });

  int get itemCount {
    return items.fold<int>(0, (sum, item) => sum + item.quantity);
  }

  double get subtotal {
    return items.fold<double>(0.0, (sum, item) => sum + item.totalPrice);
  }

  bool get isEmpty => items.isEmpty;
}
