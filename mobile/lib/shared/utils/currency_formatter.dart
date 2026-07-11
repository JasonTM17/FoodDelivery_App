import 'package:flutter/widgets.dart';
import 'package:intl/intl.dart';

String formatVnd(BuildContext context, num amount) {
  final locale = Localizations.localeOf(context).toLanguageTag();
  return NumberFormat.currency(
    locale: locale,
    symbol: '₫',
    decimalDigits: 0,
  ).format(amount);
}

String formatSignedVnd(BuildContext context, num amount) {
  final formatted = formatVnd(context, amount.abs());
  if (amount > 0) return '+$formatted';
  if (amount < 0) return '-$formatted';
  return formatted;
}
