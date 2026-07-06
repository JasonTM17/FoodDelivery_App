import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/shared/models/menu_item.dart';

void main() {
  group('MenuItemModel.fromJson', () {
    test('parses the public restaurant menu item contract', () {
      final item = MenuItemModel.fromJson(_menuItemPayload());

      expect(item.id, 'item-1');
      expect(item.restaurantId, 'restaurant-1');
      expect(item.name, 'Phở bò');
      expect(item.price, 65000);
      expect(item.category, 'Phở');
      expect(item.isAvailable, isTrue);
      expect(item.isPopular, isTrue);
      expect(item.optionGroups.single.name, 'Size');
      expect(item.optionGroups.single.type, 'single');
      expect(item.optionGroups.single.required, isTrue);
      expect(item.optionGroups.single.options.single.name, 'Lớn');
      expect(item.optionGroups.single.options.single.price, 15000);
    });

    test('rejects missing required fields instead of faking menu cards', () {
      final missingName = _menuItemPayload()..remove('name');
      final missingPrice = _menuItemPayload()..remove('basePrice');
      final missingCategory = _menuItemPayload()..remove('category');

      expect(
        () => MenuItemModel.fromJson(missingName),
        throwsA(isA<FormatException>()),
      );
      expect(
        () => MenuItemModel.fromJson(missingPrice),
        throwsA(isA<FormatException>()),
      );
      expect(
        () => MenuItemModel.fromJson(missingCategory),
        throwsA(isA<FormatException>()),
      );
    });

    test(
      'rejects incomplete option values instead of defaulting price/name',
      () {
        final payload = _menuItemPayload();
        final option =
            (payload['options'] as List<dynamic>).single
                as Map<String, dynamic>;
        option['values'] = [
          {'id': 'value-1', 'priceModifier': 0},
        ];

        expect(
          () => MenuItemModel.fromJson(payload),
          throwsA(isA<FormatException>()),
        );
      },
    );
  });
}

Map<String, dynamic> _menuItemPayload() => {
  'id': 'item-1',
  'restaurantId': 'restaurant-1',
  'name': 'Phở bò',
  'description': '',
  'imageUrl': '',
  'basePrice': 65000,
  'category': 'Phở',
  'isAvailable': true,
  'isPopular': true,
  'options': [
    {
      'id': 'option-1',
      'name': 'Size',
      'isRequired': true,
      'isMultiple': false,
      'values': [
        {'id': 'value-1', 'value': 'Lớn', 'priceModifier': 15000},
      ],
    },
  ],
};
