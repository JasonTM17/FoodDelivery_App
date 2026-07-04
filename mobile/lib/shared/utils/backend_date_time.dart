final DateTime unknownBackendDateTime = DateTime.fromMillisecondsSinceEpoch(
  0,
  isUtc: true,
);

DateTime parseBackendDateTimeOrUnknown(dynamic value) {
  if (value is DateTime) return value;
  final parsed = DateTime.tryParse(value?.toString() ?? '');
  return parsed ?? unknownBackendDateTime;
}

DateTime? parseBackendDateTimeOrNull(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  return DateTime.tryParse(value.toString());
}
