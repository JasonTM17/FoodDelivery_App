import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../shared/api/api_client.dart';
import 'bank_account_models.dart';

export 'bank_account_models.dart';

class BankAccountsState {
  final List<BankAccount> accounts;
  final bool isLoading;
  final String? error;

  const BankAccountsState({
    this.accounts = const [],
    this.isLoading = false,
    this.error,
  });

  BankAccountsState copyWith({
    List<BankAccount>? accounts,
    bool? isLoading,
    String? error,
  }) {
    return BankAccountsState(
      accounts: accounts ?? this.accounts,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class BankAccountsNotifier extends StateNotifier<BankAccountsState> {
  final ApiClient _api;

  BankAccountsNotifier({ApiClient? apiClient})
      : _api = apiClient ?? ApiClient.instance,
        super(const BankAccountsState());

  Future<void> load() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.get<dynamic>('/driver/bank-accounts');
      state = state.copyWith(
        isLoading: false,
        accounts: _parseAccountList(response.data),
      );
    } catch (error) {
      state = state.copyWith(isLoading: false, error: _errorMessage(error));
    }
  }

  Future<void> addAccount(BankAccount account) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.post<dynamic>(
        '/driver/bank-accounts',
        data: account.toCreateJson(),
      );
      final created = BankAccount.fromJson(_asMap(response.data));
      state = state.copyWith(
        isLoading: false,
        accounts: _upsertAccount(state.accounts, created),
      );
    } catch (error) {
      state = state.copyWith(isLoading: false, error: _errorMessage(error));
      rethrow;
    }
  }

  Future<void> deleteAccount(String id) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _api.delete<dynamic>('/driver/bank-accounts/$id');
      final remaining = state.accounts.where((account) => account.id != id).toList();
      state = state.copyWith(isLoading: false, accounts: _ensureDefault(remaining));
    } catch (error) {
      state = state.copyWith(isLoading: false, error: _errorMessage(error));
      rethrow;
    }
  }

  Future<void> setDefault(String id) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.patch<dynamic>('/driver/bank-accounts/$id/default');
      final selected = BankAccount.fromJson(_asMap(response.data));
      state = state.copyWith(
        isLoading: false,
        accounts: state.accounts
            .map((account) => account.copyWith(isDefault: account.id == selected.id))
            .toList(),
      );
    } catch (error) {
      state = state.copyWith(isLoading: false, error: _errorMessage(error));
      rethrow;
    }
  }
}

final bankAccountsProvider = StateNotifierProvider<BankAccountsNotifier, BankAccountsState>((ref) {
  return BankAccountsNotifier();
});

List<BankAccount> _parseAccountList(dynamic data) {
  if (data is List) {
    return data
        .whereType<Map>()
        .map((item) => BankAccount.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }
  if (data is Map && data['data'] is List) {
    return _parseAccountList(data['data']);
  }
  return const [];
}

Map<String, dynamic> _asMap(dynamic data) {
  if (data is Map<String, dynamic>) return data;
  if (data is Map) return Map<String, dynamic>.from(data);
  return const {};
}

List<BankAccount> _upsertAccount(List<BankAccount> current, BankAccount account) {
  final withoutAccount = current.where((item) => item.id != account.id).toList();
  final normalized = account.isDefault
      ? withoutAccount.map((item) => item.copyWith(isDefault: false)).toList()
      : withoutAccount;
  return [account, ...normalized];
}

List<BankAccount> _ensureDefault(List<BankAccount> accounts) {
  if (accounts.isEmpty || accounts.any((account) => account.isDefault)) return accounts;
  return [
    accounts.first.copyWith(isDefault: true),
    ...accounts.skip(1),
  ];
}

String _errorMessage(Object error) {
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map && data['detail'] is String) return data['detail'] as String;
    if (data is Map && data['message'] is String) return data['message'] as String;
    if (error.message != null && error.message!.isNotEmpty) return error.message!;
  }
  return error.toString();
}
