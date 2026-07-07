import '../../l10n/app_localizations.dart';

String localizedCuisineLabel(AppLocalizations l10n, String cuisine) {
  final normalized = _normalizeCuisine(cuisine);
  switch (normalized) {
    case 'fast_food':
      return l10n.cuisineFastFood;
    case 'vietnamese':
      return l10n.cuisineVietnamese;
    case 'japanese':
      return l10n.cuisineJapanese;
    case 'korean':
      return l10n.cuisineKorean;
    case 'chinese':
      return l10n.cuisineChinese;
    case 'italian':
      return l10n.cuisineItalian;
    case 'dessert':
    case 'desserts':
      return l10n.cuisineDessert;
    case 'drink':
    case 'drinks':
    case 'beverage':
    case 'beverages':
      return l10n.cuisineDrinks;
    default:
      return cuisine.trim();
  }
}

String _normalizeCuisine(String cuisine) {
  final trimmed = cuisine.trim().toLowerCase();
  switch (trimmed) {
    case 'đồ ăn nhanh':
      return 'fast_food';
    case 'việt nam':
      return 'vietnamese';
    case 'nhật bản':
      return 'japanese';
    case 'hàn quốc':
      return 'korean';
    case 'trung hoa':
      return 'chinese';
    case 'tráng miệng':
      return 'dessert';
    case 'đồ uống':
      return 'drinks';
    default:
      return trimmed
          .replaceAll(RegExp(r'[^a-z0-9]+'), '_')
          .replaceAll(RegExp(r'^_+|_+$'), '');
  }
}
