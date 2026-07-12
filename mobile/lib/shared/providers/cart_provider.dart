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
  final bool isSyncing;
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
    this.isSyncing = false,
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
    bool? isSyncing,
    String? promoCode,
    double? discount,
    double? deliveryFee,
    String? error,
    String? pricingError,
    bool clearPricingError = false,
    bool clearCart = false,
  }) {
    return CartState(
      currentCart: clearCart ? null : (currentCart ?? this.currentCart),
      pendingCarts: pendingCarts ?? this.pendingCarts,
      isApplyingPromo: isApplyingPromo ?? this.isApplyingPromo,
      isPricingLoading: isPricingLoading ?? this.isPricingLoading,
      isSyncing: isSyncing ?? this.isSyncing,
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
  final ApiClient _api;

  CartNotifier({ApiClient? apiClient})
    : _api = apiClient ?? ApiClient.instance,
      super(const CartState());

  /// Hydrate local cart from GET /cart (server is source of truth when authed).
  Future<void> loadCart() async {
    state = state.copyWith(isSyncing: true, error: null);
    try {
      final response = await _api.get('/cart');
      final data = response.data;
      if (data is! Map<String, dynamic>) {
        state = state.copyWith(isSyncing: false, clearCart: true);
        return;
      }
      final cart = _cartFromServer(data);
      state = CartState(
        currentCart: cart,
        promoCode: data['promotionCode'] as String? ?? state.promoCode,
        discount: state.discount,
        deliveryFee: state.deliveryFee,
        pricingError: state.pricingError,
        isSyncing: false,
      );
    } on DioException catch (e) {
      // Guest / unauthenticated — keep local cart.
      if (e.response?.statusCode == 401 || e.response?.statusCode == 403) {
        state = state.copyWith(isSyncing: false);
        return;
      }
      state = state.copyWith(
        isSyncing: false,
        error: _dioMessage(e, 'Không thể tải giỏ hàng.'),
      );
    } catch (_) {
      state = state.copyWith(
        isSyncing: false,
        error: 'Không thể tải giỏ hàng.',
      );
    }
  }

  /// B-MOB-01: optimistic local update + POST /cart/items.
  Future<void> addItem({
    required MenuItemModel item,
    int quantity = 1,
    List<SelectedOption> selectedOptions = const [],
    String? specialInstructions,
  }) async {
    final previousState = state;
    final currentCart = state.currentCart;

    if (currentCart == null || currentCart.restaurantId != item.restaurantId) {
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
    } else {
      final existingIndex = currentCart.items.indexWhere(
        (cartItem) =>
            cartItem.menuItem.id == item.id &&
            _optionsMatch(cartItem.selectedOptions, selectedOptions),
      );

      final updatedItems = [...currentCart.items];
      if (existingIndex >= 0) {
        updatedItems[existingIndex] = CartItemModel(
          cartItemId: updatedItems[existingIndex].cartItemId,
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

    final success = await _syncAddItem(
      item: item,
      quantity: quantity,
      selectedOptions: selectedOptions,
      specialInstructions: specialInstructions,
    );

    if (!success) {
      state = previousState.copyWith(error: state.error);
    }
  }

  Future<bool> _syncAddItem({
    required MenuItemModel item,
    required int quantity,
    required List<SelectedOption> selectedOptions,
    String? specialInstructions,
  }) async {
    try {
      final apiOptions = selectedOptions
          .map((o) => o.toApiOption())
          .whereType<Map<String, String>>()
          .toList();

      final response = await _api.post(
        '/cart/items',
        data: {
          'restaurantId': item.restaurantId,
          'menuItemId': item.id,
          'quantity': quantity,
          if (apiOptions.isNotEmpty) 'selectedOptions': apiOptions,
          if (specialInstructions != null && specialInstructions.isNotEmpty)
            'notes': specialInstructions,
        },
      );

      final serverItem = response.data;
      if (serverItem is Map<String, dynamic>) {
        final serverId = serverItem['id'] as String?;
        if (serverId != null) {
          _attachServerId(
            menuItemId: item.id,
            selectedOptions: selectedOptions,
            cartItemId: serverId,
          );
        }
      }
      return true;
    } on DioException catch (e) {
      if (e.response?.statusCode == 401 || e.response?.statusCode == 403) {
        // Guest cart stays local until login.
        return true;
      }
      state = state.copyWith(
        error: _dioMessage(e, 'Không thể đồng bộ giỏ hàng với máy chủ.'),
      );
      return false;
    } catch (_) {
      state = state.copyWith(
        error: 'Không thể đồng bộ giỏ hàng với máy chủ.',
      );
      return false;
    }
  }

  void _attachServerId({
    required String menuItemId,
    required List<SelectedOption> selectedOptions,
    required String cartItemId,
  }) {
    final cart = state.currentCart;
    if (cart == null) return;

    final index = cart.items.indexWhere(
      (item) =>
          item.menuItem.id == menuItemId &&
          _optionsMatch(item.selectedOptions, selectedOptions) &&
          (item.cartItemId == null || item.cartItemId == cartItemId),
    );
    if (index < 0) return;

    final updatedItems = [...cart.items];
    updatedItems[index] = updatedItems[index].copyWith(cartItemId: cartItemId);
    state = state.copyWith(
      currentCart: CartModel(
        restaurantId: cart.restaurantId,
        restaurantName: cart.restaurantName,
        restaurantLogoUrl: cart.restaurantLogoUrl,
        items: updatedItems,
      ),
    );
  }

  /// B-MOB-01: PATCH /cart/items/:id
  Future<void> updateItemQuantity(int index, int newQuantity) async {
    final cart = state.currentCart;
    if (cart == null || index >= cart.items.length) return;

    if (newQuantity <= 0) {
      await removeItem(index);
      return;
    }

    final target = cart.items[index];
    final updatedItems = [...cart.items];
    updatedItems[index] = CartItemModel(
      cartItemId: target.cartItemId,
      menuItem: target.menuItem,
      quantity: newQuantity,
      selectedOptions: target.selectedOptions,
      specialInstructions: target.specialInstructions,
      unitPrice: target.unitPrice,
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

    final cartItemId = target.cartItemId;
    if (cartItemId == null || cartItemId.isEmpty) return;

    try {
      await _api.patch(
        '/cart/items/$cartItemId',
        data: {'quantity': newQuantity},
      );
    } on DioException catch (e) {
      if (e.response?.statusCode == 401 || e.response?.statusCode == 403) {
        return;
      }
      state = state.copyWith(
        error: _dioMessage(e, 'Không thể cập nhật số lượng.'),
      );
    } catch (_) {
      state = state.copyWith(error: 'Không thể cập nhật số lượng.');
    }
  }

  /// B-MOB-01: DELETE /cart/items/:id
  Future<void> removeItem(int index) async {
    final cart = state.currentCart;
    if (cart == null || index >= cart.items.length) return;

    final removed = cart.items[index];
    final updatedItems = [...cart.items]..removeAt(index);

    if (updatedItems.isEmpty) {
      state = const CartState();
    } else {
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

    final cartItemId = removed.cartItemId;
    if (cartItemId == null || cartItemId.isEmpty) return;

    try {
      await _api.delete('/cart/items/$cartItemId');
    } on DioException catch (e) {
      if (e.response?.statusCode == 401 || e.response?.statusCode == 403) {
        return;
      }
      state = state.copyWith(
        error: _dioMessage(e, 'Không thể xóa món khỏi giỏ hàng.'),
      );
    } catch (_) {
      state = state.copyWith(error: 'Không thể xóa món khỏi giỏ hàng.');
    }
  }

  /// B-MOB-01: DELETE /cart
  Future<void> clearCart() async {
    state = const CartState();
    try {
      await _api.delete('/cart');
    } on DioException catch (e) {
      if (e.response?.statusCode == 401 || e.response?.statusCode == 403) {
        return;
      }
      // Local already cleared; surface non-auth failures softly.
      state = state.copyWith(
        error: _dioMessage(e, 'Không thể xóa giỏ hàng trên máy chủ.'),
      );
    } catch (_) {
      // Local already cleared.
    }
  }

  Future<void> applyPromoCode(String code) async {
    state = state.copyWith(isApplyingPromo: true, error: null);
    try {
      final response = await _api.post(
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
      final response = await _api.get('/orders/delivery-pricing');
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
      if (a[i].optionId != null &&
          b[i].optionId != null &&
          a[i].valueId != null &&
          b[i].valueId != null) {
        if (a[i].optionId != b[i].optionId || a[i].valueId != b[i].valueId) {
          return false;
        }
        continue;
      }
      if (a[i].optionName != b[i].optionName ||
          a[i].groupName != b[i].groupName) {
        return false;
      }
    }
    return true;
  }

  // Discount was validated by API; keep flat amount on quantity changes.
  double _recalculateDiscount(String? promoCode, List<CartItemModel> items) {
    if (promoCode == null) return 0.0;
    return state.discount;
  }

  CartModel? _cartFromServer(Map<String, dynamic> data) {
    final restaurantId = data['restaurantId'] as String?;
    final rawItems = data['items'];
    if (restaurantId == null ||
        restaurantId.isEmpty ||
        rawItems is! List ||
        rawItems.isEmpty) {
      return null;
    }

    final items = <CartItemModel>[];
    for (final raw in rawItems) {
      if (raw is! Map) continue;
      final item = Map<String, dynamic>.from(raw);
      final menuRaw = item['menuItem'];
      final menuMap = menuRaw is Map
          ? Map<String, dynamic>.from(menuRaw)
          : <String, dynamic>{};

      final menuItemId =
          item['menuItemId'] as String? ?? menuMap['id'] as String? ?? '';
      if (menuItemId.isEmpty) continue;

      final name =
          menuMap['name'] as String? ?? item['name'] as String? ?? 'Item';
      final price =
          (item['unitPrice'] as num?)?.toDouble() ??
          (menuMap['basePrice'] as num?)?.toDouble() ??
          0.0;

      items.add(
        CartItemModel(
          cartItemId: item['id'] as String?,
          menuItem: MenuItemModel(
            id: menuItemId,
            restaurantId: restaurantId,
            name: name,
            description: menuMap['description'] as String?,
            imageUrl: menuMap['imageUrl'] as String? ?? item['imageUrl'] as String?,
            price: price,
            category: menuMap['category'] as String? ?? '',
            isAvailable: menuMap['isAvailable'] as bool? ?? true,
          ),
          quantity: (item['quantity'] as num?)?.toInt() ?? 1,
          specialInstructions: item['notes'] as String?,
          unitPrice: price,
        ),
      );
    }

    if (items.isEmpty) return null;

    return CartModel(
      restaurantId: restaurantId,
      restaurantName: data['restaurantName'] as String? ?? '',
      items: items,
    );
  }

  String _dioMessage(DioException e, String fallback) {
    final data = e.response?.data;
    if (data is Map) {
      final message = data['message'] ?? data['error'];
      if (message is String && message.isNotEmpty) return message;
    }
    return fallback;
  }
}
