import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../shared/api/api_client.dart';

enum MembershipTier { free, pro, proPlus }

extension MembershipTierLabel on MembershipTier {
  String labelVi() {
    switch (this) {
      case MembershipTier.free:
        return 'Miễn phí';
      case MembershipTier.pro:
        return 'Pro';
      case MembershipTier.proPlus:
        return 'Pro+';
    }
  }

  int monthlyPriceVnd() {
    switch (this) {
      case MembershipTier.free:
        return 0;
      case MembershipTier.pro:
        return 49000;
      case MembershipTier.proPlus:
        return 99000;
    }
  }

  List<String> benefitsVi() {
    switch (this) {
      case MembershipTier.free:
        return ['Giao hàng cơ bản', 'Tích điểm thưởng 1%'];
      case MembershipTier.pro:
        return [
          'Miễn phí giao hàng không giới hạn',
          'Ưu tiên tài xế cao cấp',
          'Tích điểm thưởng 3%',
          'Voucher sinh nhật 100K₫',
        ];
      case MembershipTier.proPlus:
        return [
          'Miễn phí giao hàng không giới hạn',
          'Ưu tiên tài xế cao cấp nhất',
          'Tích điểm thưởng 5%',
          'Voucher sinh nhật 200K₫',
          'Hỗ trợ 24/7 VIP',
        ];
    }
  }
}

class MembershipState {
  final bool isLoading;
  final String? error;
  final MembershipTier currentTier;
  final DateTime? expiryDate;
  final bool hasActiveSubscription;

  const MembershipState({
    this.isLoading = false,
    this.error,
    this.currentTier = MembershipTier.free,
    this.expiryDate,
    this.hasActiveSubscription = false,
  });

  MembershipState copyWith({
    bool? isLoading,
    String? error,
    MembershipTier? currentTier,
    DateTime? expiryDate,
    bool? hasActiveSubscription,
  }) {
    return MembershipState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      currentTier: currentTier ?? this.currentTier,
      expiryDate: expiryDate ?? this.expiryDate,
      hasActiveSubscription: hasActiveSubscription ?? this.hasActiveSubscription,
    );
  }
}

final membershipProvider =
    StateNotifierProvider<MembershipNotifier, MembershipState>((ref) {
  return MembershipNotifier();
});

class MembershipNotifier extends StateNotifier<MembershipState> {
  final ApiClient _api = ApiClient.instance;

  MembershipNotifier() : super(const MembershipState());

  Future<void> fetchMembership() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.get('/users/me/membership');
      final data = response.data as Map<String, dynamic>;
      final tierStr = data['tier'] as String? ?? 'free';
      final tier = tierStr == 'pro'
          ? MembershipTier.pro
          : tierStr == 'pro_plus'
              ? MembershipTier.proPlus
              : MembershipTier.free;
      state = state.copyWith(
        isLoading: false,
        currentTier: tier,
        expiryDate: data['expiryDate'] != null
            ? DateTime.tryParse(data['expiryDate'] as String)
            : null,
        hasActiveSubscription: data['hasActiveSubscription'] as bool? ?? false,
      );
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] as String? ??
          'Không thể tải thông tin thành viên.';
      state = state.copyWith(isLoading: false, error: msg);
    } catch (_) {
      state = state.copyWith(isLoading: false, error: 'Có lỗi xảy ra khi tải thông tin thành viên.');
    }
  }

  Future<bool> upgrade(MembershipTier tier) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _api.post('/users/me/membership/upgrade', data: {'tier': tier.name});
      await fetchMembership();
      return true;
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] as String? ??
          'Không thể nâng cấp. Vui lòng thử lại.';
      state = state.copyWith(isLoading: false, error: msg);
      return false;
    } catch (_) {
      state = state.copyWith(isLoading: false, error: 'Có lỗi xảy ra khi nâng cấp.');
      return false;
    }
  }
}
