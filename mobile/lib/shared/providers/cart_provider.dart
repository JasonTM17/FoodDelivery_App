import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../api/api_client.dart';
import '../models/cart.dart';
import '../models/menu_item.dart';

final cartProvider = StateNotifierProvider<CartNotifier, CartState>((ref) {
  return CartNotifier();
});

class CartState {
  final CartModel? currentCart;
  final List<CartModel> pendingCarts;
  final bool isApplyingPromo;
  final bool isPricingLoading;
  final String? promoCode;
  final double discount;
  final double? deliveryFee;
  final String? error;
  final String? pricingError;

  const CartState({
    this.currentCart,
    this.pendingCarts = const [],
    this.isApplyingPromo = false,
    this.isPricingLoading = false,
    this.promoCode,
    this.discount = 0.0,
    this.deliveryFee,
    this.error,
    this.pricingError,
  });

  int get totalItemCount {
    return currentCart?.itemCount ?? 0;
  }

  double get subtotal {
    return currentCart?.subtotal ?? 0.0;
  }

  bool get hasDeliveryPricing => deliveryFee != null;

  double get total {
    return subtotal + (deliveryFee ?? 0.0) - discount;
  }

  bool get isEmpty => currentCart == null || currentCart!.isEmpty;

  CartState copyWith({
    CartModel? currentCart,
    List<CartModel>? pendingCarts,
    bool? isApplyingPromo,
    bool? isPricingLoading,
    String? promoCode,
    double? discount,
    double? deliveryFee,
    String? error,
    String? pricingError,
    bool clearPricingError = false,
  }) {
    return CartState(
      currentCart: currentCart ?? this.currentCart,
      pendingCarts: pendingCarts ?? this.pendingCarts,
      isApplyingPromo: isApplyingPromo ?? this.isApplyingPromo,
      isPricingLoading: isPricingLoading ?? this.isPricingLoading,
      promoCode: promoCode ?? this.promoCode,
      discount: discount ?? this.discount,
      deliveryFee: deliveryFee ?? this.deliveryFee,
      error: error,
      pricingError: clearPricingError
          ? null
          : pricingError ?? this.pricingError,
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
          restaurantName:
              item.name, // Will be updated when restaurant context is known
          items: [
            CartItemModel(
              menuItem: item,
              quantity: quantity,
              selectedOptions: selectedOptions,
              specialInstructions: specialInstructions,
            ),
          ],
        ),
        deliveryFee: state.deliveryFee,
        pricingError: state.pricingError,
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
        deliveryFee: state.deliveryFee,
        pricingError: state.pricingError,
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
        specialInstructions:
            specialInstructions ??
            updatedItems[existingIndex].specialInstructions,
      );
    } else {
      updatedItems.add(
        CartItemModel(
          menuItem: item,
          quantity: quantity,
          selectedOptions: selectedOptions,
          specialInstructions: specialInstructions,
        ),
      );
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
      deliveryFee: state.deliveryFee,
      pricingError: state.pricingError,
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
      deliveryFee: state.deliveryFee,
      pricingError: state.pricingError,
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
      deliveryFee: state.deliveryFee,
      pricingError: state.pricingError,
    );
  }

  void clearCart() {
    state = const CartState();
  }

  Future<void> applyPromoCode(String code) async {
    state = state.copyWith(isApplyingPromo: true, error: null);
    try {
      final response = await ApiClient.instance.post(
        '/promotions/validate',
        data: {
          'code': code,
          'restaurantId': state.currentCart?.restaurantId,
          'subtotal': state.subtotal,
        },
      );
      final data = response.data as Map<String, dynamic>;
      final discountAmount =
          (data['discountAmount'] as num?)?.toDouble() ?? 0.0;
      state = state.copyWith(
        isApplyingPromo: false,
        promoCode: code,
        discount: discountAmount,
      );
    } on DioException catch (e) {
      final message =
          e.response?.data?['message'] as String? ??
          e.response?.data?['error'] as String? ??
          'Mã khuyến mãi không hợp lệ.';
      state = state.copyWith(isApplyingPromo: false, error: message);
    } catch (e) {
      state = state.copyWith(
        isApplyingPromo: false,
        error: 'Có lỗi xảy ra khi kiểm tra mã.',
      );
    }
  }

  void removePromo() {
    state = state.copyWith(promoCode: null, discount: 0.0);
  }

  void setRestaurantInfo(
    String restaurantId,
    String restaurantName, {
    String? logoUrl,
  }) {
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
        deliveryFee: state.deliveryFee,
        pricingError: state.pricingError,
      );
    }
  }

  Future<void> fetchDeliveryPricing({bool force = false}) async {
    if (!force && state.deliveryFee != null) return;

    state = state.copyWith(isPricingLoading: true, clearPricingError: true);
    try {
      final response = await ApiClient.instance.get('/orders/delivery-pricing');
      final data = response.data as Map<String, dynamic>;
      final fee = (data['baseDeliveryFeeVnd'] as num?)?.toDouble();
      if (fee == null || fee < 0) {
        throw const FormatException('DELIVERY_PRICING_INVALID_RESPONSE');
      }
      state = state.copyWith(
        isPricingLoading: false,
        deliveryFee: fee,
        clearPricingError: true,
      );
    } on DioException catch (e) {
      final message =
          e.response?.data?['message'] as String? ??
          e.response?.data?['error'] as String? ??
          'Không thể tải phí giao hàng từ máy chủ.';
      state = state.copyWith(isPricingLoading: false, pricingError: message);
    } catch (_) {
      state = state.copyWith(
        isPricingLoading: false,
        pricingError: 'Không thể tải phí giao hàng từ máy chủ.',
      );
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }

  bool _optionsMatch(List<SelectedOption> a, List<SelectedOption> b) {
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (a[i].optionName != b[i].optionName ||
          a[i].groupName != b[i].groupName) {
        return false;
      }
    }
    return true;
  }

  // Discount was validated by API; keep flat amount on quantity changes.
  // User must re-apply promo if a different discount is desired.
  double _recalculateDiscount(String? promoCode, List<CartItemModel> items) {
    if (promoCode == null) return 0.0;
    // Preserve the existing API-validated discount amount unchanged.
    return state.discount;
  }
}
