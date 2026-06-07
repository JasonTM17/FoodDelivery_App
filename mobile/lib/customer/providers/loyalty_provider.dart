import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../shared/api/api_client.dart';

class LoyaltyTransaction {
  final String id;
  final int points;
  final bool isCredit;
  final String description;
  final DateTime createdAt;

  const LoyaltyTransaction({
    required this.id,
    required this.points,
    required this.isCredit,
    required this.description,
    required this.createdAt,
  });

  factory LoyaltyTransaction.fromJson(Map<String, dynamic> json) {
    return LoyaltyTransaction(
      id: json['id'] as String,
      points: json['points'] as int,
      isCredit: (json['type'] as String?) == 'credit',
      description: json['description'] as String? ?? '',
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

class LoyaltyState {
  final bool isLoading;
  final String? error;
  final int totalPoints;
  final String tier;
  final int pointsToNextTier;
  final List<LoyaltyTransaction> transactions;

  const LoyaltyState({
    this.isLoading = false,
    this.error,
    this.totalPoints = 0,
    this.tier = 'bronze',
    this.pointsToNextTier = 100,
    this.transactions = const [],
  });

  LoyaltyState copyWith({
    bool? isLoading,
    String? error,
    int? totalPoints,
    String? tier,
    int? pointsToNextTier,
    List<LoyaltyTransaction>? transactions,
  }) {
    return LoyaltyState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      totalPoints: totalPoints ?? this.totalPoints,
      tier: tier ?? this.tier,
      pointsToNextTier: pointsToNextTier ?? this.pointsToNextTier,
      transactions: transactions ?? this.transactions,
    );
  }
}

final loyaltyProvider = StateNotifierProvider<LoyaltyNotifier, LoyaltyState>((ref) {
  return LoyaltyNotifier();
});

class LoyaltyNotifier extends StateNotifier<LoyaltyState> {
  final ApiClient _api = ApiClient.instance;

  LoyaltyNotifier() : super(const LoyaltyState());

  Future<void> fetchLoyalty() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.get('/users/loyalty');
      final data = response.data as Map<String, dynamic>;
      final txList = (data['transactions'] as List<dynamic>? ?? [])
          .map((e) => LoyaltyTransaction.fromJson(e as Map<String, dynamic>))
          .toList();
      state = state.copyWith(
        isLoading: false,
        totalPoints: data['totalPoints'] as int? ?? 0,
        tier: data['tier'] as String? ?? 'bronze',
        pointsToNextTier: data['pointsToNextTier'] as int? ?? 100,
        transactions: txList,
      );
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] as String? ?? 'Không thể tải thông tin điểm thưởng.';
      state = state.copyWith(isLoading: false, error: msg);
    } catch (_) {
      state = state.copyWith(isLoading: false, error: 'Có lỗi xảy ra.');
    }
  }
}
