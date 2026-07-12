import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/shared/utils/auth_validators.dart';

void main() {
  group('AuthValidators.password', () {
    test('requires min 8 chars and complexity', () {
      expect(AuthValidators.passwordError(null), 'required');
      expect(AuthValidators.passwordError(''), 'required');
      expect(AuthValidators.passwordError('Ab1'), 'minLength');
      expect(AuthValidators.passwordError('abcdefgh'), 'complexity');
      expect(AuthValidators.passwordError('ABCDEFGH'), 'complexity');
      expect(AuthValidators.passwordError('Abcdefgh'), 'complexity');
      expect(AuthValidators.passwordError('Abcdefg1'), isNull);
      expect(AuthValidators.isPasswordValid('Test1234'), isTrue);
    });

    test('login mode can skip complexity', () {
      expect(
        AuthValidators.passwordError('password', requireComplexity: false),
        isNull,
      );
    });
  });

  group('AuthValidators.phone', () {
    test('accepts E.164-ish numbers', () {
      expect(AuthValidators.phoneError(null), 'required');
      expect(AuthValidators.phoneError(''), 'required');
      expect(AuthValidators.phoneError('0123'), 'invalid');
      expect(AuthValidators.phoneError('+84901234567'), isNull);
      expect(AuthValidators.phoneError('84901234567'), isNull);
      expect(AuthValidators.isPhoneValid('+12025550123'), isTrue);
    });
  });
}
