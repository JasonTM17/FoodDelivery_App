import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/providers/bank_account_provider.dart';

void main() {
  test('BankAccount parses API payload and serializes create request', () {
    final account = BankAccount.fromJson({
      'id': 'account-1',
      'bankCode': 'vcb',
      'bankName': 'Vietcombank',
      'accountNumber': '001100223344',
      'accountHolderName': 'NGUYEN VAN A',
      'isDefault': true,
    });

    expect(account.id, 'account-1');
    expect(account.bankCode, 'vcb');
    expect(account.isDefault, isTrue);
    expect(account.toCreateJson(), {
      'bankCode': 'vcb',
      'bankName': 'Vietcombank',
      'accountNumber': '001100223344',
      'accountHolderName': 'NGUYEN VAN A',
    });
  });

  test('BankAccount copyWith updates default flag without losing account details', () {
    const account = BankAccount(
      id: 'account-1',
      bankCode: 'vcb',
      bankName: 'Vietcombank',
      accountNumber: '001100223344',
      accountHolderName: 'NGUYEN VAN A',
    );

    final updated = account.copyWith(isDefault: true);

    expect(updated.id, account.id);
    expect(updated.accountNumber, account.accountNumber);
    expect(updated.isDefault, isTrue);
  });
}
