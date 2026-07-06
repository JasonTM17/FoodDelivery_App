import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/customer/providers/wallet_provider.dart';
import 'package:foodflow_customer/shared/api/api_client.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('WalletTransaction.fromJson', () {
    test('parses the confirmed backend ledger contract', () {
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

    test('rejects missing ledger type or reason instead of faking labels', () {
      final missingType = _walletTransactionPayload()..remove('type');
      final missingReason = _walletTransactionPayload()..remove('reason');

      expect(
        () => WalletTransaction.fromJson(missingType),
        throwsA(isA<FormatException>()),
      );
      expect(
        () => WalletTransaction.fromJson(missingReason),
        throwsA(isA<FormatException>()),
      );
    });
  });

  group('WalletNotifier.fetchWallet', () {
    late _WalletApiInterceptor apiInterceptor;

    setUp(() {
      FlutterSecureStorage.setMockInitialValues({});
      apiInterceptor = _WalletApiInterceptor();
      ApiClient.instance.dio.interceptors.add(apiInterceptor);
    });

    tearDown(() {
      ApiClient.instance.dio.interceptors.remove(apiInterceptor);
    });

    test('accepts the backend wallet snapshot contract', () async {
      final notifier = WalletNotifier();

      await notifier.fetchWallet();

      expect(notifier.state.error, isNull);
      expect(notifier.state.isLoading, isFalse);
      expect(notifier.state.balance, 150000);
      expect(notifier.state.transactions, hasLength(2));
      expect(notifier.state.transactions.first.isCredit, isTrue);
      expect(notifier.state.transactions.last.isCredit, isFalse);
    });

    test('accepts an explicitly empty wallet snapshot', () async {
      apiInterceptor.payload = {'balance': 0, 'transactions': []};
      final notifier = WalletNotifier();

      await notifier.fetchWallet();

      expect(notifier.state.error, isNull);
      expect(notifier.state.balance, 0);
      expect(notifier.state.transactions, isEmpty);
    });

    test(
      'rejects missing balance instead of showing a fake zero balance',
      () async {
        apiInterceptor.payload = _walletPayload()..remove('balance');
        final notifier = WalletNotifier();

        await notifier.fetchWallet();

        expect(notifier.state.isLoading, isFalse);
        expect(notifier.state.error, 'WALLET_CONTRACT_INVALID_RESPONSE');
        expect(notifier.state.transactions, isEmpty);
      },
    );

    test(
      'rejects missing transactions instead of faking an empty ledger',
      () async {
        apiInterceptor.payload = _walletPayload()..remove('transactions');
        final notifier = WalletNotifier();

        await notifier.fetchWallet();

        expect(notifier.state.isLoading, isFalse);
        expect(notifier.state.error, 'WALLET_CONTRACT_INVALID_RESPONSE');
      },
    );
  });
}

class _WalletApiInterceptor extends Interceptor {
  Map<String, dynamic> payload = _walletPayload();

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.path == '/users/wallet' && options.method == 'GET') {
      handler.resolve(
        Response<Map<String, dynamic>>(
          requestOptions: options,
          statusCode: 200,
          data: payload,
        ),
      );
      return;
    }

    handler.next(options);
  }
}

Map<String, dynamic> _walletPayload() => {
  'balance': 150000,
  'transactions': [
    {
      'id': 'transaction-credit',
      'amountDelta': 250000,
      'type': 'credit',
      'reason': 'order_refund',
      'createdAt': '2026-07-04T00:00:00.000Z',
    },
    _walletTransactionPayload(),
  ],
};

Map<String, dynamic> _walletTransactionPayload() => {
  'id': 'transaction-debit',
  'amountDelta': -100000,
  'type': 'debit',
  'reason': 'order_payment',
  'refId': 'order-1',
  'createdAt': '2026-07-04T01:00:00.000Z',
};
