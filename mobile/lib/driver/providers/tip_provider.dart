import 'package:flutter_riverpod/flutter_riverpod.dart';

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

  TipState copyWith({
    int? suggestedAmount,
    int? customAmount,
    bool? isSubmitting,
    bool? isSubmitted,
    String? error,
  }) {
    return TipState(
      suggestedAmount: suggestedAmount ?? this.suggestedAmount,
      customAmount: customAmount,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      isSubmitted: isSubmitted ?? this.isSubmitted,
      error: error,
    );
  }
}

class TipNotifier extends StateNotifier<TipState> {
  TipNotifier() : super(const TipState());

  void selectAmount(int amount) {
    state = state.copyWith(suggestedAmount: amount, customAmount: null);
  }

  void setCustomAmount(int amount) {
    state = state.copyWith(customAmount: amount, suggestedAmount: null);
  }

  int get effectiveAmount => state.customAmount ?? state.suggestedAmount ?? 0;

  Future<bool> submitTip(String tripId) async {
    if (effectiveAmount <= 0) return false;
    state = state.copyWith(isSubmitting: true, error: null);
    // TODO: Replace with real API POST /trips/{id}/tip
    await Future.delayed(const Duration(milliseconds: 400));
    state = state.copyWith(isSubmitting: false, isSubmitted: true);
    return true;
  }

  void reset() {
    state = const TipState();
  }
}

final tipProvider = StateNotifierProvider<TipNotifier, TipState>((ref) {
  return TipNotifier();
});
