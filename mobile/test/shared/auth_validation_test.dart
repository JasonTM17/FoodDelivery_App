import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/shared/utils/auth_validation.dart';

void main() {
  test('normalizes common Vietnamese local numbers to the API E.164 form', () {
    expect(normalizePhoneForApi('090 123 4567'), '+84901234567');
    expect(normalizePhoneForApi('(+84) 901-234-567'), '+84901234567');
    expect(normalizePhoneForApi('0084901234567'), '+84901234567');
  });

  test('validates the backend international phone contract', () {
    expect(isValidApiPhone('0901234567'), isTrue);
    expect(isValidApiPhone('+819012345678'), isTrue);
    expect(isValidApiPhone('not-a-phone'), isFalse);
  });

  test('matches backend registration password requirements', () {
    expect(isValidRegistrationPassword('FoodFlow8'), isTrue);
    expect(isValidRegistrationPassword('foodflow8'), isFalse);
    expect(isValidRegistrationPassword('FOODFLOW8'), isFalse);
    expect(isValidRegistrationPassword('FoodFlow'), isFalse);
    expect(isValidRegistrationPassword('Flow8'), isFalse);
  });
}
