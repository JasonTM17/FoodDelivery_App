import 'dart:io';
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';
import '../../shared/api/api_client.dart';

/// Identifies which KYC document is being uploaded.
enum KycDocumentType { cccdFront, cccdBack, driverLicense, vehicleRegistration }

extension KycDocumentTypeExt on KycDocumentType {
  String get backendKey {
    switch (this) {
      case KycDocumentType.cccdFront:
        return 'cccdFrontUrl';
      case KycDocumentType.cccdBack:
        return 'cccdBackUrl';
      case KycDocumentType.driverLicense:
        return 'driverLicenseUrl';
      case KycDocumentType.vehicleRegistration:
        return 'vehicleRegistrationUrl';
    }
  }
}

class KycUploadResult {
  final bool success;
  final String? fileUrl;
  final String? error;

  const KycUploadResult({required this.success, this.fileUrl, this.error});
}

/// Handles KYC document capture + MinIO upload via backend presigned URLs.
///
/// Flow:
///   1. [pickAndUpload] opens camera / gallery via [ImagePicker].
///   2. Calls `POST /storage/presigned-url` to obtain a MinIO PUT URL.
///   3. Streams the file bytes directly to MinIO with no app-server middleman.
///   4. Returns the public file URL on success.
///
/// [submitKyc] sends all collected URLs to `POST /driver/kyc/submit`.
class KycUploadService {
  KycUploadService._();
  static final instance = KycUploadService._();

  final _picker = ImagePicker();

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /// Pick an image from [source] and upload it as [docType].
  Future<KycUploadResult> pickAndUpload({
    required KycDocumentType docType,
    required ImageSource source,
  }) async {
    try {
      final file = await _picker.pickImage(
        source: source,
        imageQuality: 85,
        maxWidth: 1920,
        maxHeight: 1080,
      );
      if (file == null) {
        return const KycUploadResult(
          success: false,
          error: 'Không có ảnh được chọn',
        );
      }
      return _uploadFile(File(file.path), docType);
    } catch (e) {
      return KycUploadResult(success: false, error: e.toString());
    }
  }

  /// Submit all uploaded document URLs to backend for KYC review.
  ///
  /// [docUrls] maps backend key → public file URL, e.g.
  /// `{'cccdFrontUrl': 'https://…', 'driverLicenseUrl': 'https://…'}`.
  Future<bool> submitKyc(Map<String, String> docUrls) async {
    try {
      await ApiClient.instance.post('/driver/kyc/submit', data: docUrls);
      return true;
    } catch (_) {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  Future<KycUploadResult> _uploadFile(
    File file,
    KycDocumentType docType,
  ) async {
    try {
      final fileName =
          '${docType.name}_${DateTime.now().millisecondsSinceEpoch}.jpg';

      // Step 1 — request presigned PUT URL from backend.
      final presignedResp = await ApiClient.instance.post(
        '/storage/presigned-url',
        data: {
          'filename': fileName,
          'contentType': 'image/jpeg',
          'folder': 'kyc',
        },
      );

      final body = presignedResp.data as Map<String, dynamic>;
      final uploadUrl = body['url'] as String? ?? body['uploadUrl'] as String?;
      final fileUrl =
          body['fileUrl'] as String? ?? body['publicUrl'] as String?;

      if (uploadUrl == null) {
        return const KycUploadResult(
          success: false,
          error: 'Không lấy được URL upload từ server',
        );
      }

      // Step 2 — PUT bytes directly to MinIO presigned URL.
      final bytes = await file.readAsBytes();
      final uploadDio = Dio();
      await uploadDio.put(
        uploadUrl,
        data: Stream.fromIterable([bytes]),
        options: Options(
          headers: {
            'Content-Type': 'image/jpeg',
            'Content-Length': bytes.length,
          },
          sendTimeout: const Duration(seconds: 60),
          receiveTimeout: const Duration(seconds: 30),
        ),
      );

      // Derive public URL from presigned URL if backend omitted it.
      final publicUrl = fileUrl ?? uploadUrl.split('?').first;
      return KycUploadResult(success: true, fileUrl: publicUrl);
    } on DioException catch (e) {
      final msg = e.response?.data is Map
          ? (e.response!.data as Map)['message'] as String? ?? 'Upload thất bại'
          : 'Upload thất bại';
      return KycUploadResult(success: false, error: msg);
    } catch (e) {
      return KycUploadResult(success: false, error: e.toString());
    }
  }
}
