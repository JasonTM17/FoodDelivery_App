String normalizePhoneForApi(String value) {
  var normalized = value.trim().replaceAll(RegExp(r'[\s().-]'), '');
  if (normalized.startsWith('00')) {
    normalized = '+${normalized.substring(2)}';
  }
  if (normalized.startsWith('0') &&
      RegExp(r'^0\d{8,10}$').hasMatch(normalized)) {
    normalized = '+84${normalized.substring(1)}';
  }
  return normalized;
}

bool isValidApiPhone(String value) =>
    RegExp(r'^\+?[1-9]\d{6,14}$').hasMatch(normalizePhoneForApi(value));

bool isValidRegistrationPassword(String value) {
  if (value.length < 8 || value.length > 72) return false;
  return RegExp(r'[a-z]').hasMatch(value) &&
      RegExp(r'[A-Z]').hasMatch(value) &&
      RegExp(r'\d').hasMatch(value);
}
