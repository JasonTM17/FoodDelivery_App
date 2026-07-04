import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/customer/providers/wallet_provider.dart';

void main() {
  test('WalletTransaction parses the confirmed backend ledger contract', () {
    final transaction = WalletTransaction.fromJson({
      'id': 'transaction-1',
      'amountDelta': -125000,
      'type': 'debit',
      'reason': 'order_payment',
      'refId': 'order-1',
      'createdAt': '2026-07-04T00:00:00.000Z',
    });

    expect(transaction.id, 'transaction-1');
    expect(transaction.amount, -125000);
    expect(transaction.isCredit, isFalse);
    expect(transaction.description, 'order_payment');
    expect(transaction.createdAt, DateTime.utc(2026, 7, 4));
  });
}
