import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/providers/bank_account_provider.dart';
import 'package:foodflow_customer/shared/api/api_client.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

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

  test(
    'BankAccount copyWith updates default flag without losing account details',
    () {
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
    },
  );

  test('BankAccount rejects incomplete API rows instead of blank accounts', () {
    final payload = _bankAccountPayload()..remove('accountNumber');

    expect(
      () => BankAccount.fromJson(payload),
      throwsA(isA<FormatException>()),
    );
  });

  group('BankAccountsNotifier.load', () {
    late _BankAccountsApiInterceptor apiInterceptor;

    setUp(() {
      FlutterSecureStorage.setMockInitialValues({});
      apiInterceptor = _BankAccountsApiInterceptor();
      ApiClient.instance.dio.interceptors.add(apiInterceptor);
    });

    tearDown(() {
      ApiClient.instance.dio.interceptors.remove(apiInterceptor);
    });

    test('loads the backend bank account list contract', () async {
      final notifier = BankAccountsNotifier();

      await notifier.load();

      expect(notifier.state.error, isNull);
      expect(notifier.state.accounts, hasLength(1));
      expect(notifier.state.accounts.single.id, 'account-1');
    });

    test(
      'rejects non-list responses instead of faking an empty account list',
      () async {
        apiInterceptor.payload = {'accounts': []};
        final notifier = BankAccountsNotifier();

        await notifier.load();

        expect(notifier.state.isLoading, isFalse);
        expect(notifier.state.error, 'BANK_ACCOUNTS_CONTRACT_INVALID_RESPONSE');
        expect(notifier.state.accounts, isEmpty);
      },
    );

    test('rejects incomplete rows instead of dropping them', () async {
      apiInterceptor.payload = [_bankAccountPayload()..remove('bankName')];
      final notifier = BankAccountsNotifier();

      await notifier.load();

      expect(notifier.state.error, 'BANK_ACCOUNTS_CONTRACT_INVALID_RESPONSE');
      expect(notifier.state.accounts, isEmpty);
    });
  });
}

class _BankAccountsApiInterceptor extends Interceptor {
  dynamic payload = [_bankAccountPayload()];

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (options.path == '/driver/bank-accounts' && options.method == 'GET') {
      handler.resolve(
        Response<dynamic>(
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

Map<String, dynamic> _bankAccountPayload() => {
  'id': 'account-1',
  'bankCode': 'vcb',
  'bankName': 'Vietcombank',
  'accountNumber': '001100223344',
  'accountHolderName': 'NGUYEN VAN A',
  'isDefault': true,
};
