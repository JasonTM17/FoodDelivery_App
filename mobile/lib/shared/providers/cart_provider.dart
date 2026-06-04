import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/cart.dart';
import '../models/menu_item.dart';

final cartProvider = StateNotifierProvider<CartNotifier, CartState>((ref) {
  return CartNotifier();
});

class CartState {
  final CartModel? currentCart;
  final List<CartModel> pendingCarts;
  final bool isApplyingPromo;
  final String? promoCode;
  final double discount;
  final String? error;

  const CartState({
    this.currentCart,
    this.pendingCarts = const [],
    this.isApplyingPromo = false,
    this.promoCode,
    this.discount = 0.0,
    this.error,
  });

  int get totalItemCount {
    return currentCart?.itemCount ?? 0;
  }

  double get subtotal {
    return currentCart?.subtotal ?? 0.0;
  }

  double get deliveryFee {
    final subtotal = this.subtotal;
    if (subtotal >= 100000) return 0.0;
    return 15000.0;
  }

  double get total {
    return subtotal + deliveryFee - discount;
  }

  bool get isEmpty => currentCart == null || currentCart!.isEmpty;

  CartState copyWith({
    CartModel? currentCart,
    List<CartModel>? pendingCarts,
    bool? isApplyingPromo,
    String? promoCode,
    double? discount,
    String? error,
  }) {
    return CartState(
      currentCart: currentCart ?? this.currentCart,
      pendingCarts: pendingCarts ?? this.pendingCarts,
      isApplyingPromo: isApplyingPromo ?? this.isApplyingPromo,
      promoCode: promoCode ?? this.promoCode,
      discount: discount ?? this.discount,
      error: error,
    );
  }
}

class CartNotifier extends StateNotifier<CartState> {
  CartNotifier() : super(const CartState());

  void addItem({
    required MenuItemModel item,
    int quantity = 1,
    List<SelectedOption> selectedOptions = const [],
    String? specialInstructions,
  }) {
    final currentCart = state.currentCart;

    if (currentCart == null) {
      state = CartState(
        currentCart: CartModel(
          restaurantId: item.restaurantId,
          restaurantName: item.name, // Will be updated when restaurant context is known
          items: [
            CartItemModel(
              menuItem: item,
              quantity: quantity,
              selectedOptions: selectedOptions,
              specialInstructions: specialInstructions,
            ),
          ],
        ),
      );
      return;
    }

    // Check if adding from same restaurant
    if (currentCart.restaurantId != item.restaurantId) {
      // Different restaurant — could show dialog, for now replace cart
      state = CartState(
        currentCart: CartModel(
          restaurantId: item.restaurantId,
          restaurantName: item.name,
          items: [
            CartItemModel(
              menuItem: item,
              quantity: quantity,
              selectedOptions: selectedOptions,
              specialInstructions: specialInstructions,
            ),
          ],
        ),
      );
      return;
    }

    // Same restaurant — find existing item or add new
    final existingIndex = currentCart.items.indexWhere(
      (cartItem) =>
          cartItem.menuItem.id == item.id &&
          _optionsMatch(cartItem.selectedOptions, selectedOptions),
    );

    final updatedItems = [...currentCart.items];
    if (existingIndex >= 0) {
      updatedItems[existingIndex] = CartItemModel(
        menuItem: updatedItems[existingIndex].menuItem,
        quantity: updatedItems[existingIndex].quantity + quantity,
        selectedOptions: selectedOptions,
        specialInstructions: specialInstructions ?? updatedItems[existingIndex].specialInstructions,
      );
    } else {
      updatedItems.add(CartItemModel(
        menuItem: item,
        quantity: quantity,
        selectedOptions: selectedOptions,
        specialInstructions: specialInstructions,
      ));
    }

    state = CartState(
      currentCart: CartModel(
        restaurantId: currentCart.restaurantId,
        restaurantName: currentCart.restaurantName,
        restaurantLogoUrl: currentCart.restaurantLogoUrl,
        items: updatedItems,
      ),
      promoCode: state.promoCode,
      discount: state.discount,
    );
  }

  void updateItemQuantity(int index, int newQuantity) {
    final cart = state.currentCart;
    if (cart == null || index >= cart.items.length) return;

    if (newQuantity <= 0) {
      removeItem(index);
      return;
    }

    final updatedItems = [...cart.items];
    updatedItems[index] = CartItemModel(
      menuItem: updatedItems[index].menuItem,
      quantity: newQuantity,
      selectedOptions: updatedItems[index].selectedOptions,
      specialInstructions: updatedItems[index].specialInstructions,
    );

    state = CartState(
      currentCart: CartModel(
        restaurantId: cart.restaurantId,
        restaurantName: cart.restaurantName,
        restaurantLogoUrl: cart.restaurantLogoUrl,
        items: updatedItems,
      ),
      promoCode: state.promoCode,
      discount: _recalculateDiscount(state.promoCode, updatedItems),
    );
  }

  void removeItem(int index) {
    final cart = state.currentCart;
    if (cart == null || index >= cart.items.length) return;

    final updatedItems = [...cart.items];
    updatedItems.removeAt(index);

    if (updatedItems.isEmpty) {
      state = const CartState();
      return;
    }

    state = CartState(
      currentCart: CartModel(
        restaurantId: cart.restaurantId,
        restaurantName: cart.restaurantName,
        restaurantLogoUrl: cart.restaurantLogoUrl,
        items: updatedItems,
      ),
      promoCode: state.promoCode,
      discount: _recalculateDiscount(state.promoCode, updatedItems),
    );
  }

  void clearCart() {
    state = const CartState();
  }

  Future<void> applyPromoCode(String code) async {
    state = state.copyWith(isApplyingPromo: true, error: null);
    try {
      // Simulate promo validation — in real app, call API
      await Future.delayed(const Duration(milliseconds: 500));

      if (code.toUpperCase() == 'FOOD10') {
        final discount = state.subtotal * 0.1;
        state = state.copyWith(
          isApplyingPromo: false,
          promoCode: code,
          discount: discount > 30000 ? 30000 : discount,
        );
      } else if (code.toUpperCase() == 'FREESHIP') {
        state = state.copyWith(
          isApplyingPromo: false,
          promoCode: code,
          discount: state.deliveryFee,
        );
      } else {
        state = state.copyWith(
          isApplyingPromo: false,
          error: 'Mã khuyến mãi không hợp lệ.',
        );
      }
    } catch (e) {
      state = state.copyWith(isApplyingPromo: false, error: 'Có lỗi xảy ra.');
    }
  }

  void removePromo() {
    state = state.copyWith(promoCode: null, discount: 0.0);
  }

  void setRestaurantInfo(String restaurantId, String restaurantName, {String? logoUrl}) {
    final currentCart = state.currentCart;
    if (currentCart != null) {
      state = CartState(
        currentCart: CartModel(
          restaurantId: restaurantId,
          restaurantName: restaurantName,
          restaurantLogoUrl: logoUrl ?? currentCart.restaurantLogoUrl,
          items: currentCart.items,
        ),
        promoCode: state.promoCode,
        discount: state.discount,
      );
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }

  bool _optionsMatch(List<SelectedOption> a, List<SelectedOption> b) {
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (a[i].optionName != b[i].optionName || a[i].groupName != b[i].groupName) {
        return false;
      }
    }
    return true;
  }

  double _recalculateDiscount(String? promoCode, List<CartItemModel> items) {
    if (promoCode == null) return 0.0;
    final subtotal = items.fold<double>(0.0, (sum, item) => sum + item.totalPrice);
    if (promoCode.toUpperCase() == 'FOOD10') {
      final discount = subtotal * 0.1;
      return discount > 30000 ? 30000 : discount;
    }
    if (promoCode.toUpperCase() == 'FREESHIP') {
      return subtotal >= 100000 ? 0.0 : 15000.0;
    }
    return 0.0;
  }
}
