import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../shared/api/api_client.dart';

class ReferralState {
  final bool isLoading;
  final String? error;
  final String? referralCode;
  final int inviteCount;
  final int bonusPoints;

  const ReferralState({
    this.isLoading = false,
    this.error,
    this.referralCode,
    this.inviteCount = 0,
    this.bonusPoints = 0,
  });

  ReferralState copyWith({
    bool? isLoading,
    String? error,
    String? referralCode,
    int? inviteCount,
    int? bonusPoints,
  }) {
    return ReferralState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      referralCode: referralCode ?? this.referralCode,
      inviteCount: inviteCount ?? this.inviteCount,
      bonusPoints: bonusPoints ?? this.bonusPoints,
    );
  }
}

final referralProvider = StateNotifierProvider<ReferralNotifier, ReferralState>((ref) {
  return ReferralNotifier();
});

class ReferralNotifier extends StateNotifier<ReferralState> {
  final ApiClient _api = ApiClient.instance;

  ReferralNotifier() : super(const ReferralState());

  Future<void> fetchReferral() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.get('/users/referral');
      final data = response.data as Map<String, dynamic>;
      state = state.copyWith(
        isLoading: false,
        referralCode: data['code'] as String?,
        inviteCount: data['inviteCount'] as int? ?? 0,
        bonusPoints: data['bonusPoints'] as int? ?? 0,
      );
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] as String? ?? 'Không thể tải thông tin giới thiệu.';
      state = state.copyWith(isLoading: false, error: msg);
    } catch (_) {
      state = state.copyWith(isLoading: false, error: 'Có lỗi xảy ra.');
    }
  }
}
