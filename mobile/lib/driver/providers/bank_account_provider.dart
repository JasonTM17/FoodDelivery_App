import 'package:flutter_riverpod/flutter_riverpod.dart';

class BankAccount {
  final String id;
  final String bankCode;
  final String bankName;
  final String accountNumber;
  final String accountHolderName;
  final bool isDefault;

  const BankAccount({
    required this.id,
    required this.bankCode,
    required this.bankName,
    required this.accountNumber,
    required this.accountHolderName,
    this.isDefault = false,
  });

  BankAccount copyWith({
    String? id,
    String? bankCode,
    String? bankName,
    String? accountNumber,
    String? accountHolderName,
    bool? isDefault,
  }) {
    return BankAccount(
      id: id ?? this.id,
      bankCode: bankCode ?? this.bankCode,
      bankName: bankName ?? this.bankName,
      accountNumber: accountNumber ?? this.accountNumber,
      accountHolderName: accountHolderName ?? this.accountHolderName,
      isDefault: isDefault ?? this.isDefault,
    );
  }
}

class VnBank {
  final String code;
  final String name;
  final String shortName;
  final String logoUrl;

  const VnBank({
    required this.code,
    required this.name,
    required this.shortName,
    required this.logoUrl,
  });
}

const vnBanks = [
  VnBank(code: 'vcb', name: 'Ngân hàng TMCP Ngoại thương Việt Nam', shortName: 'Vietcombank', logoUrl: ''),
  VnBank(code: 'bidv', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam', shortName: 'BIDV', logoUrl: ''),
  VnBank(code: 'tcb', name: 'Ngân hàng TMCP Kỹ Thương Việt Nam', shortName: 'Techcombank', logoUrl: ''),
  VnBank(code: 'mbb', name: 'Ngân hàng TMCP Quân đội', shortName: 'MB Bank', logoUrl: ''),
  VnBank(code: 'acb', name: 'Ngân hàng TMCP Á Châu', shortName: 'ACB', logoUrl: ''),
  VnBank(code: 'vpb', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng', shortName: 'VPBank', logoUrl: ''),
  VnBank(code: 'stb', name: 'Ngân hàng TMCP Sài Gòn Thương Tín', shortName: 'Sacombank', logoUrl: ''),
  VnBank(code: 'shb', name: 'Ngân hàng TMCP Sài Gòn – Hà Nội', shortName: 'SHB', logoUrl: ''),
  VnBank(code: 'tpb', name: 'Ngân hàng TMCP Tiên Phong', shortName: 'TPBank', logoUrl: ''),
  VnBank(code: 'ctg', name: 'Ngân hàng TMCP Công Thương Việt Nam', shortName: 'VietinBank', logoUrl: ''),
];

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
  BankAccountsNotifier() : super(const BankAccountsState());

  Future<void> load() async {
    state = state.copyWith(isLoading: true, error: null);
    // TODO: Replace with real API GET /driver/bank-accounts
    await Future.delayed(const Duration(milliseconds: 300));
    state = state.copyWith(
      isLoading: false,
      accounts: [
        const BankAccount(id: 'ba1', bankCode: 'vcb', bankName: 'Vietcombank',
            accountNumber: '001100223344', accountHolderName: 'Nguyễn Văn A', isDefault: true),
      ],
    );
  }

  Future<void> addAccount(BankAccount account) async {
    state = state.copyWith(isLoading: true);
    // TODO: Replace with real API POST /driver/bank-accounts
    await Future.delayed(const Duration(milliseconds: 300));
    state = state.copyWith(
      isLoading: false,
      accounts: [...state.accounts, account],
    );
  }

  Future<void> deleteAccount(String id) async {
    // TODO: Replace with real API DELETE /driver/bank-accounts/{id}
    state = state.copyWith(
      accounts: state.accounts.where((a) => a.id != id).toList(),
    );
  }

  Future<void> setDefault(String id) async {
    state = state.copyWith(
      accounts: state.accounts.map((a) => a.copyWith(isDefault: a.id == id)).toList(),
    );
  }
}

final bankAccountsProvider = StateNotifierProvider<BankAccountsNotifier, BankAccountsState>((ref) {
  return BankAccountsNotifier();
});
