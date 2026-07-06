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
    final type = _requiredString(json, 'type');
    if (type != 'credit' && type != 'debit') {
      throw FormatException('Invalid loyalty transaction type: $type');
    }

    return LoyaltyTransaction(
      id: _requiredString(json, 'id'),
      points: _requiredInt(json, 'points'),
      isCredit: type == 'credit',
      description: _requiredString(json, 'description'),
      createdAt: DateTime.parse(_requiredString(json, 'createdAt')),
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

final loyaltyProvider = StateNotifierProvider<LoyaltyNotifier, LoyaltyState>((
  ref,
) {
  return LoyaltyNotifier();
});

class LoyaltyNotifier extends StateNotifier<LoyaltyState> {
  final ApiClient _api = ApiClient.instance;

  LoyaltyNotifier() : super(const LoyaltyState());

  Future<void> fetchLoyalty() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.get('/users/loyalty');
      final data = _requiredObject(response.data, 'loyalty');
      final txList = _requiredList(data, 'transactions')
          .map(
            (e) => LoyaltyTransaction.fromJson(
              _requiredObject(e, 'transactions[]'),
            ),
          )
          .toList();
      state = state.copyWith(
        isLoading: false,
        totalPoints: _requiredInt(data, 'totalPoints'),
        tier: _requiredString(data, 'tier'),
        pointsToNextTier: _requiredInt(data, 'pointsToNextTier'),
        transactions: txList,
      );
    } on DioException catch (e) {
      final msg =
          e.response?.data?['message'] as String? ??
          'Không thể tải thông tin điểm thưởng.';
      state = state.copyWith(isLoading: false, error: msg);
    } on FormatException {
      state = state.copyWith(
        isLoading: false,
        error: 'LOYALTY_CONTRACT_INVALID_RESPONSE',
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
  throw FormatException('Invalid object field: $field');
}

List<dynamic> _requiredList(Map<String, dynamic> json, String field) {
  final value = json[field];
  if (value is List) {
    return value;
  }
  throw FormatException('Invalid list field: $field');
}

String _requiredString(Map<String, dynamic> json, String field) {
  final value = json[field];
  if (value is String && value.trim().isNotEmpty) {
    return value;
  }
  throw FormatException('Missing required string field: $field');
}

int _requiredInt(Map<String, dynamic> json, String field) {
  final value = json[field];
  if (value is int) {
    return value;
  }
  throw FormatException('Invalid integer field: $field');
}
