import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:foodflow_customer/customer/widgets/promo_banner.dart';

void main() {
  testWidgets('fits the customer home carousel height without overflow', (
    tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: SizedBox(
            height: 140,
            child: PromoBanner(
              title: 'FREESHIP',
              subtitle: 'Miễn phí giao hàng cho đơn đủ điều kiện',
              color: Colors.purple,
            ),
          ),
        ),
      ),
    );

    expect(find.text('FREESHIP'), findsOneWidget);
    expect(find.text('Nhận ngay'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
