import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../shared/api/api_client.dart';

enum CancelReason { slow, changedMind, wrongOrder, other }

extension CancelReasonLabel on CancelReason {
  String labelVi() {
    switch (this) {
      case CancelReason.slow:
        return 'Nhà hàng quá lâu';
      case CancelReason.changedMind:
        return 'Đổi ý';
      case CancelReason.wrongOrder:
        return 'Đặt nhầm';
      case CancelReason.other:
        return 'Khác';
    }
  }

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
      final msg =
          e.response?.data?['message'] as String? ??
          'Không thể hủy đơn hàng. Vui lòng thử lại.';
      state = state.copyWith(isLoading: false, error: msg);
      return false;
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        error: 'Có lỗi xảy ra khi hủy đơn hàng.',
      );
      return false;
    }
  }
}
