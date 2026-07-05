DateTime parseBackendDateTimeOrUnknown(dynamic value) {
  if (value is DateTime) return value;

  final raw = value?.toString().trim();
  if (raw == null || raw.isEmpty) {
    throw const FormatException('Missing required backend timestamp');
  }

  final parsed = DateTime.tryParse(raw);
  if (parsed == null) {
    throw FormatException('Invalid required backend timestamp', raw);
  }
  return parsed;
}

DateTime? parseBackendDateTimeOrNull(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  return DateTime.tryParse(value.toString());
}
