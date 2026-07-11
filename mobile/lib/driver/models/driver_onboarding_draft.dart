class DriverOnboardingDraft {
  final String licenseNumber;
  final String vehicleType;
  final String vehiclePlate;

  const DriverOnboardingDraft({
    required this.licenseNumber,
    required this.vehicleType,
    required this.vehiclePlate,
  });

  factory DriverOnboardingDraft.normalized({
    required String licenseNumber,
    required String vehicleType,
    required String vehiclePlate,
  }) {
    final normalizedVehicleType = vehicleType.trim().toLowerCase();
    if (!const {
      'bicycle',
      'motorbike',
      'car',
    }.contains(normalizedVehicleType)) {
      throw const FormatException('Unsupported driver vehicle type');
    }

    return DriverOnboardingDraft(
      licenseNumber: licenseNumber.trim().toUpperCase(),
      vehicleType: normalizedVehicleType,
      vehiclePlate: vehiclePlate.trim().toUpperCase(),
    );
  }

  Map<String, dynamic> toSubmissionJson({
    required Map<String, String> documents,
  }) {
    return {
      'licenseNumber': licenseNumber,
      'vehicleType': vehicleType,
      'vehiclePlate': vehiclePlate,
      'documents': documents,
    };
  }
}

bool isValidDriverIdentifier(
  String value, {
  required int min,
  required int max,
}) {
  final normalized = value.trim().toUpperCase();
  return normalized.length >= min &&
      normalized.length <= max &&
      RegExp(r'^[A-Z0-9./-]+$').hasMatch(normalized);
}
