import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../shared/api/api_client.dart';

enum CancelReason { slow, changedMind, wrongOrder, other }

extension CancelReasonApiValue on CancelReason {
  String apiValue() {
    switch (this) {
      case CancelReason.slow:
        return 'restaurant_slow';
      case CancelReason.changedMind:
        return 'changed_mind';
      case CancelReason.wrongOrder:
        return 'wrong_order';
      default:
        return 'other';
    }
  }
}

class CancelOrderState {
  final bool isLoading;
  final String? error;
  final CancelReason? selectedReason;
  final String note;
  final bool cancelled;

  const CancelOrderState({
    this.isLoading = false,
    this.error,
    this.selectedReason,
    this.note = '',
    this.cancelled = false,
  });

  CancelOrderState copyWith({
    bool? isLoading,
    String? error,
    CancelReason? selectedReason,
    String? note,
    bool? cancelled,
  }) {
    return CancelOrderState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      selectedReason: selectedReason ?? this.selectedReason,
      note: note ?? this.note,
      cancelled: cancelled ?? this.cancelled,
    );
  }
}

final cancelOrderProvider =
    StateNotifierProvider.autoDispose<CancelOrderNotifier, CancelOrderState>((
      ref,
    ) {
      return CancelOrderNotifier();
    });

class CancelOrderNotifier extends StateNotifier<CancelOrderState> {
  final ApiClient _api = ApiClient.instance;

  CancelOrderNotifier() : super(const CancelOrderState());

  void selectReason(CancelReason reason) {
    state = state.copyWith(selectedReason: reason);
  }

  void updateNote(String note) {
    state = state.copyWith(note: note);
  }

  bool get canSubmit => state.selectedReason != null;

  Future<bool> cancelOrder(String orderId) async {
    if (!canSubmit) return false;
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _api.post(
        '/orders/$orderId/cancel',
        data: {'reason': state.selectedReason!.apiValue(), 'note': state.note},
      );
      state = state.copyWith(isLoading: false, cancelled: true);
      return true;
    } on DioException catch (e) {
      final responseData = e.response?.data;
      final msg = responseData is Map<String, dynamic>
          ? responseData['message'] as String?
          : null;
      state = state.copyWith(isLoading: false, error: msg);
      return false;
    } catch (_) {
      state = state.copyWith(isLoading: false, error: null);
      return false;
    }
  }
}
