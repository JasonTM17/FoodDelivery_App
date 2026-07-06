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

final referralProvider = StateNotifierProvider<ReferralNotifier, ReferralState>(
  (ref) {
    return ReferralNotifier();
  },
);

class ReferralNotifier extends StateNotifier<ReferralState> {
  final ApiClient _api = ApiClient.instance;

  ReferralNotifier() : super(const ReferralState(isLoading: true));

  Future<void> fetchReferral() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.get('/users/referral');
      final data = _requiredObject(response.data, 'referral');
      state = state.copyWith(
        isLoading: false,
        referralCode: _requiredString(data, 'code'),
        inviteCount: _requiredInt(data, 'inviteesCount'),
        bonusPoints: _requiredInt(data, 'rewardsEarned'),
      );
    } on DioException catch (e) {
      final msg =
          e.response?.data?['message'] as String? ??
          'Không thể tải thông tin giới thiệu.';
      state = state.copyWith(isLoading: false, error: msg);
    } on FormatException {
      state = state.copyWith(
        isLoading: false,
        error: 'REFERRAL_CONTRACT_INVALID_RESPONSE',
      );
    } catch (_) {
      state = state.copyWith(isLoading: false, error: 'Có lỗi xảy ra.');
    }
  }
}

Map<String, dynamic> _requiredObject(dynamic value, String field) {
  if (value is Map) {
    return Map<String, dynamic>.from(value);
  }
  throw FormatException('Invalid referral object field: $field');
}

String _requiredString(Map<String, dynamic> json, String field) {
  final value = json[field];
  if (value is String && value.trim().isNotEmpty) {
    return value;
  }
  throw FormatException('Missing required referral string field: $field');
}

int _requiredInt(Map<String, dynamic> json, String field) {
  final value = json[field];
  if (value is int && value >= 0) {
    return value;
  }
  if (value is num && value.isFinite && value >= 0 && value % 1 == 0) {
    return value.toInt();
  }
  throw FormatException('Invalid referral integer field: $field');
}
