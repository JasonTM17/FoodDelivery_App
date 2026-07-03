import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../shared/api/api_client.dart';

enum OfferDecision { accept, decline, timeout }

class DriverOffer {
  final String id;
  final String orderId;
  final String restaurantName;
  final String deliveryAddress;
  final double restaurantLat;
  final double restaurantLng;
  final double deliveryLat;
  final double deliveryLng;
  final double payout;
  final double distanceKm;
  final DateTime expiresAt;
  final List<String> items;

  const DriverOffer({
    required this.id,
    required this.orderId,
    required this.restaurantName,
    required this.deliveryAddress,
    required this.restaurantLat,
    required this.restaurantLng,
    required this.deliveryLat,
    required this.deliveryLng,
    required this.payout,
    required this.distanceKm,
    required this.expiresAt,
    this.items = const [],
  });
}

class TipState {
  final int? suggestedAmount;
  final int? customAmount;
  final bool isSubmitting;
  final bool isSubmitted;
  final String? error;

  const TipState({
    this.suggestedAmount,
    this.customAmount,
    this.isSubmitting = false,
    this.isSubmitted = false,
    this.error,
  });

  int get effectiveAmount => customAmount ?? suggestedAmount ?? 0;

  TipState copyWith({
    int? suggestedAmount,
    bool clearSuggestedAmount = false,
    int? customAmount,
    bool clearCustomAmount = false,
    bool? isSubmitting,
    bool? isSubmitted,
    String? error,
  }) {
    return TipState(
      suggestedAmount: clearSuggestedAmount ? null : suggestedAmount ?? this.suggestedAmount,
      customAmount: clearCustomAmount ? null : customAmount ?? this.customAmount,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      isSubmitted: isSubmitted ?? this.isSubmitted,
      error: error,
    );
  }
}

class TipNotifier extends StateNotifier<TipState> {
  final ApiClient _api;

  TipNotifier({ApiClient? apiClient})
      : _api = apiClient ?? ApiClient.instance,
        super(const TipState());

  void selectAmount(int amount) {
    state = state.copyWith(
      suggestedAmount: amount,
      clearCustomAmount: true,
      isSubmitted: false,
      error: null,
    );
  }

  void setCustomAmount(int amount) {
    state = state.copyWith(
      customAmount: amount,
      clearSuggestedAmount: true,
      isSubmitted: false,
      error: null,
    );
  }

  int get effectiveAmount => state.effectiveAmount;

  Future<bool> submitTip(String tripId) async {
    final amount = effectiveAmount;
    if (amount <= 0) return false;
    state = state.copyWith(isSubmitting: true, isSubmitted: false, error: null);
    try {
      await _api.post<dynamic>(
        '/driver/trips/$tripId/tip-report',
        data: {'amount': amount},
      );
      state = state.copyWith(isSubmitting: false, isSubmitted: true);
      return true;
    } catch (error) {
      state = state.copyWith(isSubmitting: false, error: _errorMessage(error));
      return false;
    }
  }

  void reset() {
    state = const TipState();
  }
}

final tipProvider = StateNotifierProvider<TipNotifier, TipState>((ref) {
  return TipNotifier();
});

String _errorMessage(Object error) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map && data['detail'] is String) return data['detail'] as String;
    if (data is Map && data['message'] is String) return data['message'] as String;
    if (error.message != null && error.message!.isNotEmpty) return error.message!;
  }
  return error.toString();
}
