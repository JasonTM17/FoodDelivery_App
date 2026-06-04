import 'menu_item.dart';

class CartItemModel {
  final MenuItemModel menuItem;
  int quantity;
  final List<SelectedOption> selectedOptions;
  String? specialInstructions;
  final double unitPrice;

  CartItemModel({
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

  Map<String, dynamic> toJson() {
    return {
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

  SelectedOption({
    required this.groupName,
    required this.optionName,
    this.price = 0.0,
  });

  Map<String, dynamic> toJson() {
    return {
      'groupName': groupName,
      'optionName': optionName,
      'price': price,
    };
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
