import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../shared/api/api_client.dart';

class WalletTransaction {
  final String id;
  final double amount;
  final bool isCredit;
  final String description;
  final DateTime createdAt;

  const WalletTransaction({
    required this.id,
    required this.amount,
    required this.isCredit,
    required this.description,
    required this.createdAt,
  });

  factory WalletTransaction.fromJson(Map<String, dynamic> json) {
    final type = _requiredString(json, 'type');
    if (type != 'credit' && type != 'debit') {
      throw FormatException('Invalid wallet transaction type: $type');
    }

    return WalletTransaction(
      id: _requiredString(json, 'id'),
      amount: _requiredDouble(json, 'amountDelta'),
      isCredit: type == 'credit',
      description: _requiredString(json, 'reason'),
      createdAt: DateTime.parse(_requiredString(json, 'createdAt')),
    );
  }
}

class WalletState {
  final bool isLoading;
  final String? error;
  final double balance;
  final List<WalletTransaction> transactions;

  const WalletState({
    this.isLoading = false,
    this.error,
    this.balance = 0.0,
    this.transactions = const [],
  });

  WalletState copyWith({
    bool? isLoading,
    String? error,
    double? balance,
    List<WalletTransaction>? transactions,
  }) {
    return WalletState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      balance: balance ?? this.balance,
      transactions: transactions ?? this.transactions,
    );
  }
}

final walletProvider = StateNotifierProvider<WalletNotifier, WalletState>((
  ref,
) {
  return WalletNotifier();
});

class WalletNotifier extends StateNotifier<WalletState> {
  final ApiClient _api = ApiClient.instance;

  WalletNotifier() : super(const WalletState());

  Future<void> fetchWallet() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.get('/users/wallet');
      final data = _requiredObject(response.data, 'wallet');
      final txList = _requiredList(data, 'transactions')
          .map(
            (e) => WalletTransaction.fromJson(
              _requiredObject(e, 'transactions[]'),
            ),
          )
          .toList();
      state = state.copyWith(
        isLoading: false,
        balance: _requiredDouble(data, 'balance'),
        transactions: txList,
      );
    } on DioException catch (e) {
      final msg =
          e.response?.data?['message'] as String? ??
          'Không thể tải thông tin ví.';
      state = state.copyWith(isLoading: false, error: msg);
    } on FormatException {
      state = state.copyWith(
        isLoading: false,
        error: 'WALLET_CONTRACT_INVALID_RESPONSE',
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
  throw FormatException('Invalid wallet object field: $field');
}

List<dynamic> _requiredList(Map<String, dynamic> json, String field) {
  final value = json[field];
  if (value is List) {
    return value;
  }
  throw FormatException('Invalid wallet list field: $field');
}

String _requiredString(Map<String, dynamic> json, String field) {
  final value = json[field];
  if (value is String && value.trim().isNotEmpty) {
    return value;
  }
  throw FormatException('Missing required wallet string field: $field');
}

double _requiredDouble(Map<String, dynamic> json, String field) {
  final value = json[field];
  if (value is num && value.isFinite) {
    return value.toDouble();
  }
  throw FormatException('Invalid wallet numeric field: $field');
}
