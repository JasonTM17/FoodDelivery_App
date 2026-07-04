import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/providers/tip_provider.dart';

void main() {
  test(
    'TipState effectiveAmount prefers custom amount over suggested amount',
    () {
      const state = TipState(suggestedAmount: 10000, customAmount: 15000);

      expect(state.effectiveAmount, 15000);
    },
  );

  test('TipState copyWith can clear the opposite amount source', () {
    const state = TipState(suggestedAmount: 10000);

    final updated = state.copyWith(
      customAmount: 25000,
      clearSuggestedAmount: true,
    );

    expect(updated.suggestedAmount, isNull);
    expect(updated.customAmount, 25000);
    expect(updated.effectiveAmount, 25000);
  });
}
