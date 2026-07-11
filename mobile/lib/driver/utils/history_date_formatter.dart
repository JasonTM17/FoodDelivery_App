import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../l10n/app_localizations.dart';

String formatDriverHistoryDateTime(
  BuildContext context,
  DateTime value, {
  DateTime? now,
}) {
  final localValue = value.toLocal();
  final localNow = (now ?? DateTime.now()).toLocal();
  final calendarDays = DateUtils.dateOnly(
    localNow,
  ).difference(DateUtils.dateOnly(localValue)).inDays;
  final locale = Localizations.localeOf(context).toLanguageTag();
  final l10n = AppLocalizations.of(context);
  final time = DateFormat.jm(locale).format(localValue);

  if (calendarDays == 0) return l10n.driverHistoryTodayAt(time);
  if (calendarDays == 1) return l10n.driverHistoryYesterdayAt(time);
  return DateFormat.yMd(locale).format(localValue);
}
