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
    return WalletTransaction(
      id: json['id'] as String,
      amount: (json['amount'] as num).toDouble(),
      isCredit: (json['type'] as String?) == 'credit',
      description: json['description'] as String? ?? '',
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

class WalletState {
  final bool isLoading;
  final bool isTopUpLoading;
  final String? error;
  final double balance;
  final List<WalletTransaction> transactions;

  const WalletState({
    this.isLoading = false,
    this.isTopUpLoading = false,
    this.error,
    this.balance = 0.0,
    this.transactions = const [],
  });

  WalletState copyWith({
    bool? isLoading,
    bool? isTopUpLoading,
    String? error,
    double? balance,
    List<WalletTransaction>? transactions,
  }) {
    return WalletState(
      isLoading: isLoading ?? this.isLoading,
      isTopUpLoading: isTopUpLoading ?? this.isTopUpLoading,
      error: error,
      balance: balance ?? this.balance,
      transactions: transactions ?? this.transactions,
    );
  }
}

final walletProvider = StateNotifierProvider<WalletNotifier, WalletState>((ref) {
  return WalletNotifier();
});

class WalletNotifier extends StateNotifier<WalletState> {
  final ApiClient _api = ApiClient.instance;

  WalletNotifier() : super(const WalletState());

  Future<void> fetchWallet() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.get('/users/wallet');
      final data = response.data as Map<String, dynamic>;
      final txList = (data['transactions'] as List<dynamic>? ?? [])
          .map((e) => WalletTransaction.fromJson(e as Map<String, dynamic>))
          .toList();
      state = state.copyWith(
        isLoading: false,
        balance: (data['balance'] as num? ?? 0).toDouble(),
        transactions: txList,
      );
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] as String? ?? 'Không thể tải thông tin ví.';
      state = state.copyWith(isLoading: false, error: msg);
    } catch (_) {
      state = state.copyWith(isLoading: false, error: 'Có lỗi xảy ra.');
    }
  }

  Future<bool> topUp(double amount) async {
    state = state.copyWith(isTopUpLoading: true, error: null);
    try {
      final response = await _api.post('/users/wallet/topup', data: {'amount': amount});
      final data = response.data as Map<String, dynamic>;
      state = state.copyWith(
        isTopUpLoading: false,
        balance: (data['balance'] as num? ?? state.balance).toDouble(),
      );
      return true;
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] as String? ?? 'Nạp tiền thất bại.';
      state = state.copyWith(isTopUpLoading: false, error: msg);
      return false;
    } catch (_) {
      state = state.copyWith(isTopUpLoading: false, error: 'Có lỗi xảy ra.');
      return false;
    }
  }
}
