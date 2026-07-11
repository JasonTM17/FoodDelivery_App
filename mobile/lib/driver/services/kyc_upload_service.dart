import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';

import '../../shared/api/api_client.dart';
import '../models/driver_onboarding_draft.dart';

const kKycMaxUploadBytes = 4 * 1024 * 1024;
const kKycMinUploadBytes = 1024;

enum KycDocumentType {
  idCardFront,
  idCardBack,
  driverLicense,
  vehicleRegistration,
}

extension KycDocumentTypeContract on KycDocumentType {
  String get backendKey => name;
}

enum KycUploadError {
  cancelled,
  unsupportedImage,
  fileTooSmall,
  fileTooLarge,
  invalidGrant,
  uploadFailed,
}

class KycUploadResult {
  final String? objectKey;
  final KycUploadError? error;

  const KycUploadResult.success(this.objectKey) : error = null;
  const KycUploadResult.failure(this.error) : objectKey = null;

  bool get isSuccess => objectKey != null && error == null;
}

class KycSubmissionReceipt {
  final String submissionId;
  final String status;
  final DateTime submittedAt;

  const KycSubmissionReceipt({
    required this.submissionId,
    required this.status,
    required this.submittedAt,
  });

  factory KycSubmissionReceipt.fromJson(Map<String, dynamic> json) {
    final submissionId = json['submissionId'];
    final status = json['status'];
    final submittedAt = DateTime.tryParse(json['submittedAt'] as String? ?? '');
    if (submissionId is! String ||
        submissionId.trim().isEmpty ||
        status is! String ||
        status != 'pending' ||
        submittedAt == null) {
      throw const FormatException('KYC submission response is invalid');
    }
    return KycSubmissionReceipt(
      submissionId: submissionId,
      status: status,
      submittedAt: submittedAt,
    );
  }
}

class KycUploadService {
  KycUploadService({Dio? apiDio, Dio? uploadDio, ImagePicker? picker})
    : _apiDio = apiDio ?? ApiClient.instance.dio,
      _uploadDio = uploadDio ?? Dio(),
      _picker = picker ?? ImagePicker();

  static final instance = KycUploadService();

  final Dio _apiDio;
  final Dio _uploadDio;
  final ImagePicker _picker;

  Future<KycUploadResult> pickAndUpload({
    required KycDocumentType documentType,
    required ImageSource source,
  }) async {
    try {
      final image = await _picker.pickImage(
        source: source,
        imageQuality: 85,
        maxWidth: 1920,
        maxHeight: 1920,
      );
      if (image == null) {
        return const KycUploadResult.failure(KycUploadError.cancelled);
      }
      return uploadImageBytes(
        documentType: documentType,
        bytes: await image.readAsBytes(),
      );
    } catch (_) {
      return const KycUploadResult.failure(KycUploadError.uploadFailed);
    }
  }

  @visibleForTesting
  Future<KycUploadResult> uploadImageBytes({
    required KycDocumentType documentType,
    required Uint8List bytes,
  }) async {
    final contentType = detectKycImageContentType(bytes);
    if (contentType == null) {
      return const KycUploadResult.failure(KycUploadError.unsupportedImage);
    }
    if (bytes.length < kKycMinUploadBytes) {
      return const KycUploadResult.failure(KycUploadError.fileTooSmall);
    }
    if (bytes.length > kKycMaxUploadBytes) {
      return const KycUploadResult.failure(KycUploadError.fileTooLarge);
    }

    try {
      final response = await _apiDio.post<dynamic>(
        '/driver/kyc/uploads',
        data: {
          'documentType': documentType.backendKey,
          'contentType': contentType,
          'sizeBytes': bytes.length,
        },
      );
      final grant = KycUploadGrant.fromJson(_requiredMap(response.data));
      if (grant.headers['content-type'] != contentType) {
        throw const FormatException('KYC upload content type does not match');
      }

      await _uploadDio.put<dynamic>(
        grant.uploadUrl,
        data: bytes,
        options: Options(
          headers: {
            ...grant.headers,
            Headers.contentLengthHeader: bytes.length,
          },
          followRedirects: false,
          validateStatus: (status) =>
              status != null && status >= 200 && status < 300,
          sendTimeout: const Duration(seconds: 60),
          receiveTimeout: const Duration(seconds: 30),
        ),
      );

      return KycUploadResult.success(grant.objectKey);
    } on FormatException {
      return const KycUploadResult.failure(KycUploadError.invalidGrant);
    } catch (_) {
      return const KycUploadResult.failure(KycUploadError.uploadFailed);
    }
  }

  Future<KycSubmissionReceipt> submitKyc({
    required DriverOnboardingDraft draft,
    required Map<KycDocumentType, String> documents,
  }) async {
    if (documents.length != KycDocumentType.values.length ||
        KycDocumentType.values.any(
          (type) => documents[type]?.trim().isEmpty ?? true,
        )) {
      throw const FormatException('All private KYC object keys are required');
    }

    final response = await _apiDio.post<dynamic>(
      '/driver/kyc',
      data: draft.toSubmissionJson(
        documents: {
          for (final entry in documents.entries)
            entry.key.backendKey: entry.value,
        },
      ),
    );
    return KycSubmissionReceipt.fromJson(_requiredMap(response.data));
  }
}

class KycUploadGrant {
  final String uploadUrl;
  final String objectKey;
  final Map<String, String> headers;

  const KycUploadGrant({
    required this.uploadUrl,
    required this.objectKey,
    required this.headers,
  });

  factory KycUploadGrant.fromJson(Map<String, dynamic> json) {
    final uploadUrl = json['uploadUrl'];
    final objectKey = json['objectKey'];
    final rawHeaders = json['headers'];
    final uri = uploadUrl is String ? Uri.tryParse(uploadUrl) : null;
    final validScheme =
        uri?.scheme == 'https' || (!kReleaseMode && uri?.scheme == 'http');
    if (uri == null ||
        !uri.hasAuthority ||
        !validScheme ||
        objectKey is! String ||
        objectKey.trim().isEmpty ||
        rawHeaders is! Map) {
      throw const FormatException('KYC upload grant is invalid');
    }

    final headers = <String, String>{};
    for (final entry in rawHeaders.entries) {
      final key = entry.key.toString().trim().toLowerCase();
      final value = entry.value;
      if (key.isEmpty || value is! String || value.trim().isEmpty) {
        throw const FormatException('KYC upload headers are invalid');
      }
      if (const {
        'authorization',
        'cookie',
        'apikey',
        'x-api-key',
      }.contains(key)) {
        throw const FormatException(
          'KYC upload grant contains a credential header',
        );
      }
      headers[key] = value;
    }

    return KycUploadGrant(
      uploadUrl: uri.toString(),
      objectKey: objectKey,
      headers: headers,
    );
  }
}

String? detectKycImageContentType(Uint8List bytes) {
  if (_startsWith(bytes, const [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (_startsWith(bytes, const [
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
  ])) {
    return 'image/png';
  }
  if (bytes.length >= 12 &&
      String.fromCharCodes(bytes.sublist(0, 4)) == 'RIFF' &&
      String.fromCharCodes(bytes.sublist(8, 12)) == 'WEBP') {
    return 'image/webp';
  }
  return null;
}

bool _startsWith(Uint8List bytes, List<int> signature) {
  return bytes.length >= signature.length &&
      List.generate(
        signature.length,
        (index) => bytes[index] == signature[index],
      ).every((matches) => matches);
}

Map<String, dynamic> _requiredMap(Object? value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) {
    return value.map((key, nested) => MapEntry(key.toString(), nested));
  }
  throw const FormatException('Expected an object response');
}
