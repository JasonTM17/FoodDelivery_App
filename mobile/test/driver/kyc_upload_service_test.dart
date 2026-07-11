import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:foodflow_customer/driver/models/driver_onboarding_draft.dart';
import 'package:foodflow_customer/driver/services/kyc_upload_service.dart';

void main() {
  test('detects only the image signatures accepted by the backend', () {
    expect(
      detectKycImageContentType(Uint8List.fromList([0xff, 0xd8, 0xff, 0x00])),
      'image/jpeg',
    );
    expect(
      detectKycImageContentType(
        Uint8List.fromList([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
      'image/png',
    );
    expect(
      detectKycImageContentType(Uint8List.fromList('RIFF0000WEBP'.codeUnits)),
      'image/webp',
    );
    expect(
      detectKycImageContentType(Uint8List.fromList('not-an-image'.codeUnits)),
      isNull,
    );
  });

  test('uploads bytes with the exact private grant contract', () async {
    final api = Dio(BaseOptions(baseUrl: 'https://api.test'));
    final upload = Dio();
    late RequestOptions grantRequest;
    late RequestOptions uploadRequest;
    api.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          grantRequest = options;
          handler.resolve(
            Response<dynamic>(
              requestOptions: options,
              statusCode: 201,
              data: {
                'uploadUrl': 'https://storage.test/signed-upload?token=private',
                'objectKey':
                    'kyc/driver-1/1720612800000-0123456789abcdef01234567-idCardFront.jpg',
                'headers': {
                  'cache-control': 'private, max-age=0, no-store',
                  'content-type': 'image/jpeg',
                  'x-upsert': 'false',
                },
              },
            ),
          );
        },
      ),
    );
    upload.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          uploadRequest = options;
          handler.resolve(
            Response<dynamic>(requestOptions: options, statusCode: 200),
          );
        },
      ),
    );
    final service = KycUploadService(apiDio: api, uploadDio: upload);
    final bytes = _jpegBytes();

    final result = await service.uploadImageBytes(
      documentType: KycDocumentType.idCardFront,
      bytes: bytes,
    );

    expect(result.isSuccess, isTrue);
    expect(result.objectKey, startsWith('kyc/driver-1/'));
    expect(grantRequest.path, '/driver/kyc/uploads');
    expect(grantRequest.data, {
      'documentType': 'idCardFront',
      'contentType': 'image/jpeg',
      'sizeBytes': bytes.length,
    });
    expect(uploadRequest.uri.host, 'storage.test');
    expect(uploadRequest.data, same(bytes));
    expect(uploadRequest.headers['content-type'], 'image/jpeg');
    expect(
      uploadRequest.headers['cache-control'],
      'private, max-age=0, no-store',
    );
    expect(uploadRequest.headers['x-upsert'], 'false');
    expect(uploadRequest.headers['content-length'], bytes.length);
    expect(uploadRequest.headers.containsKey('authorization'), isFalse);
  });

  test('rejects a grant that attempts to forward credentials', () async {
    final api = Dio(BaseOptions(baseUrl: 'https://api.test'));
    final upload = Dio();
    var uploadCalled = false;
    api.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) => handler.resolve(
          Response<dynamic>(
            requestOptions: options,
            statusCode: 201,
            data: {
              'uploadUrl': 'https://storage.test/signed-upload',
              'objectKey': 'kyc/driver-1/object.jpg',
              'headers': {'authorization': 'Bearer must-not-forward'},
            },
          ),
        ),
      ),
    );
    upload.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          uploadCalled = true;
          handler.next(options);
        },
      ),
    );
    final service = KycUploadService(apiDio: api, uploadDio: upload);

    final result = await service.uploadImageBytes(
      documentType: KycDocumentType.idCardBack,
      bytes: _jpegBytes(),
    );

    expect(result.error, KycUploadError.invalidGrant);
    expect(uploadCalled, isFalse);
  });

  test(
    'rejects an incomplete image before requesting an upload grant',
    () async {
      final api = Dio(BaseOptions(baseUrl: 'https://api.test'));
      var apiCalled = false;
      api.interceptors.add(
        InterceptorsWrapper(
          onRequest: (options, handler) {
            apiCalled = true;
            handler.next(options);
          },
        ),
      );
      final service = KycUploadService(apiDio: api, uploadDio: Dio());

      final result = await service.uploadImageBytes(
        documentType: KycDocumentType.driverLicense,
        bytes: Uint8List.fromList([0xff, 0xd8, 0xff, 0xe0]),
      );

      expect(result.error, KycUploadError.fileTooSmall);
      expect(apiCalled, isFalse);
    },
  );

  test('submits normalized vehicle data and private object keys', () async {
    final api = Dio(BaseOptions(baseUrl: 'https://api.test'));
    late RequestOptions submitRequest;
    api.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          submitRequest = options;
          handler.resolve(
            Response<dynamic>(
              requestOptions: options,
              statusCode: 201,
              data: {
                'submissionId': 'submission-1',
                'status': 'pending',
                'submittedAt': '2026-07-10T15:00:00.000Z',
              },
            ),
          );
        },
      ),
    );
    final service = KycUploadService(apiDio: api, uploadDio: Dio());
    final draft = DriverOnboardingDraft.normalized(
      licenseNumber: ' ab-12345 ',
      vehicleType: 'MOTORBIKE',
      vehiclePlate: ' 51a-123.45 ',
    );
    final documents = {
      for (final type in KycDocumentType.values)
        type: 'kyc/driver-1/${type.name}.jpg',
    };

    final receipt = await service.submitKyc(draft: draft, documents: documents);

    expect(receipt.submissionId, 'submission-1');
    expect(submitRequest.path, '/driver/kyc');
    expect(submitRequest.data, {
      'licenseNumber': 'AB-12345',
      'vehicleType': 'motorbike',
      'vehiclePlate': '51A-123.45',
      'documents': {
        'idCardFront': documents[KycDocumentType.idCardFront],
        'idCardBack': documents[KycDocumentType.idCardBack],
        'driverLicense': documents[KycDocumentType.driverLicense],
        'vehicleRegistration': documents[KycDocumentType.vehicleRegistration],
      },
    });
  });

  test(
    'fails closed when any required private document key is missing',
    () async {
      final service = KycUploadService(apiDio: Dio(), uploadDio: Dio());
      final draft = DriverOnboardingDraft.normalized(
        licenseNumber: 'AB-12345',
        vehicleType: 'car',
        vehiclePlate: '51A-123.45',
      );

      await expectLater(
        service.submitKyc(
          draft: draft,
          documents: const {
            KycDocumentType.idCardFront: 'kyc/private/front.jpg',
          },
        ),
        throwsA(isA<FormatException>()),
      );
    },
  );
}

Uint8List _jpegBytes() {
  final bytes = Uint8List(kKycMinUploadBytes);
  bytes.setAll(0, const [0xff, 0xd8, 0xff, 0xe0]);
  return bytes;
}
