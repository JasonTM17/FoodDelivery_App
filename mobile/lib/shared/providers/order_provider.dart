import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../api/api_client.dart';
import '../models/order.dart';
// ignore_for_file: avoid_print

final orderProvider = StateNotifierProvider<OrderNotifier, OrderState>((ref) {
  return OrderNotifier();
});

class OrderState {
  final bool isLoading;
  final String? error;
  final List<OrderModel> activeOrders;
  final List<OrderModel> completedOrders;
  final List<OrderModel> cancelledOrders;
  final OrderModel? currentTrackingOrder;
  final bool isPlacingOrder;

  const OrderState({
    this.isLoading = false,
    this.error,
    this.activeOrders = const [],
    this.completedOrders = const [],
    this.cancelledOrders = const [],
    this.currentTrackingOrder,
    this.isPlacingOrder = false,
  });

  OrderState copyWith({
    bool? isLoading,
    String? error,
    List<OrderModel>? activeOrders,
    List<OrderModel>? completedOrders,
    List<OrderModel>? cancelledOrders,
    OrderModel? currentTrackingOrder,
    bool? isPlacingOrder,
  }) {
    return OrderState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      activeOrders: activeOrders ?? this.activeOrders,
      completedOrders: completedOrders ?? this.completedOrders,
      cancelledOrders: cancelledOrders ?? this.cancelledOrders,
      currentTrackingOrder: currentTrackingOrder ?? this.currentTrackingOrder,
      isPlacingOrder: isPlacingOrder ?? this.isPlacingOrder,
    );
  }
}

class OrderNotifier extends StateNotifier<OrderState> {
  final ApiClient _api = ApiClient.instance;

  OrderNotifier() : super(const OrderState());

  Future<String?> placeOrder({
    required String restaurantId,
    required List<Map<String, dynamic>> items,
    required Map<String, dynamic> deliveryAddress,
    String paymentMethod = 'cash',
    String? note,
    String? promoCode,
  }) async {
    state = state.copyWith(isPlacingOrder: true, error: null);
    try {
      final idempotencyKey = ApiClient.generateIdempotencyKey();
      final response = await _api.post(
        '/orders',
        data: {
          'restaurantId': restaurantId,
          'items': items,
          'deliveryAddress': deliveryAddress,
          'paymentMethod': paymentMethod,
          'note': note,
          'promoCode': promoCode,
        },
        options: Options(headers: {'X-Idempotency-Key': idempotencyKey}),
      );

      final orderData = response.data as Map<String, dynamic>;
      final order = OrderModel.fromJson(orderData);

      state = state.copyWith(
        isPlacingOrder: false,
        activeOrders: [order, ...state.activeOrders],
        currentTrackingOrder: order,
      );

      return order.id;
    } on DioException catch (e) {
      final message =
          e.response?.data?['message'] as String? ??
          e.response?.data?['error'] as String? ??
          'Đặt hàng thất bại. Vui lòng thử lại.';
      state = state.copyWith(isPlacingOrder: false, error: message);
      return null;
    } catch (e) {
      state = state.copyWith(
        isPlacingOrder: false,
        error: 'Có lỗi xảy ra khi đặt hàng.',
      );
      return null;
    }
  }

  Future<void> fetchOrders() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.get('/orders');
      final dataList = response.data as List<dynamic>;
      final allOrders = dataList
          .map((e) => OrderModel.fromJson(e as Map<String, dynamic>))
          .toList();

      final active = <OrderModel>[];
      final completed = <OrderModel>[];
      final cancelled = <OrderModel>[];

      for (final order in allOrders) {
        if (order.status == 'cancelled') {
          cancelled.add(order);
        } else if (order.status == 'delivered') {
          completed.add(order);
        } else {
          active.add(order);
        }
      }

      state = state.copyWith(
        isLoading: false,
        activeOrders: active,
        completedOrders: completed,
        cancelledOrders: cancelled,
      );
    } on DioException catch (e) {
      final message =
          e.response?.data?['message'] as String? ??
          'Không thể tải danh sách đơn hàng.';
      state = state.copyWith(isLoading: false, error: message);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Có lỗi xảy ra khi tải đơn hàng.',
      );
    }
  }

  Future<bool> cancelOrder(String orderId) async {
    try {
      await _api.post('/orders/$orderId/cancel');
      await fetchOrders();
      return true;
    } on DioException catch (e) {
      final responseData = e.response?.data;
      final message = responseData is Map<String, dynamic>
          ? responseData['message'] as String?
          : null;
      state = state.copyWith(error: message);
      return false;
    } catch (e) {
      state = state.copyWith(error: null);
      return false;
    }
  }

  Future<bool> submitReview(
    String orderId,
    double foodRating,
    double deliveryRating,
    String comment,
  ) async {
    try {
      await _api.post(
        '/orders/$orderId/reviews',
        data: {
          'foodRating': foodRating,
          'deliveryRating': deliveryRating,
          'comment': comment,
        },
      );
      await fetchOrders();
      return true;
    } on DioException catch (e) {
      final message =
          e.response?.data?['message'] as String? ?? 'Không thể gửi đánh giá.';
      state = state.copyWith(error: message);
      return false;
    } catch (e) {
      state = state.copyWith(error: 'Có lỗi xảy ra khi gửi đánh giá.');
      return false;
    }
  }

  Future<void> fetchOrderDetail(String orderId) async {
    try {
      final response = await _api.get('/orders/$orderId');
      final order = OrderModel.fromJson(response.data as Map<String, dynamic>);
      state = state.copyWith(currentTrackingOrder: order);
    } catch (e) {
      state = state.copyWith(error: 'Không thể tải chi tiết đơn hàng.');
    }
  }

  void setTrackingOrder(OrderModel order) {
    state = state.copyWith(currentTrackingOrder: order);
  }

  void updateOrderStatus(String orderId, String newStatus) {
    final currentTracking = state.currentTrackingOrder;
    if (currentTracking?.id == orderId) {
      state = state.copyWith(
        currentTrackingOrder: currentTracking!.copyWith(
          status: newStatus,
          updatedAt: DateTime.now(),
        ),
      );
    }
  }

  void updateDriverLocation(String orderId, double lat, double lng) {
    final currentTracking = state.currentTrackingOrder;
    if (currentTracking?.id == orderId) {
      state = state.copyWith(
        currentTrackingOrder: currentTracking!.copyWith(
          driverLatitude: lat,
          driverLongitude: lng,
        ),
      );
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}
