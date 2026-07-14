import 'dart:math';

final _secureRandom = Random.secure();

class FcmTokenRegistration {
  const FcmTokenRegistration({
    required this.token,
    required this.registrationId,
  });

  final String token;
  final String registrationId;
}

/// Creates a UUIDv4 used to order one registration and its later cleanup.
String createFcmRegistrationId() {
  final bytes = List<int>.generate(16, (_) => _secureRandom.nextInt(256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  final hex = bytes
      .map((byte) => byte.toRadixString(16).padLeft(2, '0'))
      .join();
  return '${hex.substring(0, 8)}-'
      '${hex.substring(8, 12)}-'
      '${hex.substring(12, 16)}-'
      '${hex.substring(16, 20)}-'
      '${hex.substring(20)}';
}
