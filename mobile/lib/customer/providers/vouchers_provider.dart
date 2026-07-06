import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../shared/api/api_client.dart';

class Voucher {
  final String id;
  final String code;
  final String title;
  final String description;
  final int? percentOff;
  final int? maxDiscount;
  final int minOrderAmount;
  final DateTime expiresAt;
  final bool isUsed;
  final String status; // available | used | expired

  const Voucher({
    required this.id,
    required this.code,
    required this.title,
    required this.description,
    this.percentOff,
    this.maxDiscount,
    required this.minOrderAmount,
    required this.expiresAt,
    required this.isUsed,
    required this.status,
  });

  factory Voucher.fromJson(Map<String, dynamic> json) {
    final status = _requiredString(json, 'status');
    if (status != 'available' && status != 'used' && status != 'expired') {
      throw FormatException('Invalid voucher status: $status');
    }

    return Voucher(
      id: _requiredString(json, 'id'),
      code: _requiredString(json, 'code'),
      title: _requiredString(json, 'title'),
      description: _requiredNullableString(json, 'description'),
      percentOff: _optionalInt(json, 'percentOff', max: 100),
      maxDiscount: _optionalInt(json, 'maxDiscount'),
      minOrderAmount: _requiredInt(json, 'minOrderAmount'),
      expiresAt: _requiredDateTime(json, 'expiresAt'),
      isUsed: _requiredBool(json, 'isUsed'),
      status: status,
    );
  }
}

class VouchersState {
  final bool isLoading;
  final String? error;
  final List<Voucher> myVouchers;
  final List<Voucher> availableVouchers;
  final List<Voucher> expiredVouchers;
  final int selectedTab;

  const VouchersState({
    this.isLoading = false,
    this.error,
    this.myVouchers = const [],
    this.availableVouchers = const [],
    this.expiredVouchers = const [],
    this.selectedTab = 0,
  });

  VouchersState copyWith({
    bool? isLoading,
    String? error,
    List<Voucher>? myVouchers,
    List<Voucher>? availableVouchers,
    List<Voucher>? expiredVouchers,
    int? selectedTab,
  }) {
    return VouchersState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      myVouchers: myVouchers ?? this.myVouchers,
      availableVouchers: availableVouchers ?? this.availableVouchers,
      expiredVouchers: expiredVouchers ?? this.expiredVouchers,
      selectedTab: selectedTab ?? this.selectedTab,
    );
  }
}

final vouchersProvider = StateNotifierProvider<VouchersNotifier, VouchersState>(
  (ref) {
    return VouchersNotifier();
  },
);

class VouchersNotifier extends StateNotifier<VouchersState> {
  final ApiClient _api = ApiClient.instance;

  VouchersNotifier() : super(const VouchersState());

  void setTab(int index) {
    state = state.copyWith(selectedTab: index);
  }

  Future<void> fetchVouchers() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final results = await Future.wait([
        _api.get('/promotions/my'),
        _api.get('/promotions/available'),
      ]);
      final myData = _parseVoucherList(results[0].data, '/promotions/my');
      final availData = _parseVoucherList(
        results[1].data,
        '/promotions/available',
      );
      final now = DateTime.now();
      final my = myData.where((v) {
        if (v.isUsed) return false;
        if (v.expiresAt.isBefore(now)) return false;
        return true;
      }).toList();
      final expired = myData.where((v) {
        if (v.isUsed) return true;
        if (v.expiresAt.isBefore(now)) return true;
        return false;
      }).toList();
      state = state.copyWith(
        isLoading: false,
        myVouchers: my,
        availableVouchers: availData,
        expiredVouchers: expired,
      );
    } on DioException catch (e) {
      final msg =
          e.response?.data?['message'] as String? ??
          'Không thể tải danh sách voucher.';
      state = state.copyWith(
        isLoading: false,
        error: msg,
        myVouchers: const [],
        availableVouchers: const [],
        expiredVouchers: const [],
      );
    } on FormatException {
      state = state.copyWith(
        isLoading: false,
        error: 'VOUCHERS_CONTRACT_INVALID_RESPONSE',
        myVouchers: const [],
        availableVouchers: const [],
        expiredVouchers: const [],
      );
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        error: 'Có lỗi xảy ra khi tải voucher.',
        myVouchers: const [],
        availableVouchers: const [],
        expiredVouchers: const [],
      );
    }
  }
}

List<Voucher> _parseVoucherList(dynamic value, String endpoint) {
  if (value is! List) {
    throw FormatException('Invalid voucher list response: $endpoint');
  }

  return value
      .map((item) => Voucher.fromJson(_requiredObject(item, '$endpoint[]')))
      .toList();
}

Map<String, dynamic> _requiredObject(dynamic value, String field) {
  if (value is Map) {
    return Map<String, dynamic>.from(value);
  }
  throw FormatException('Invalid voucher object field: $field');
}

String _requiredString(Map<String, dynamic> json, String field) {
  final value = json[field];
  if (value is String && value.trim().isNotEmpty) {
    return value;
  }
  throw FormatException('Missing required voucher string field: $field');
}

String _requiredNullableString(Map<String, dynamic> json, String field) {
  if (!json.containsKey(field)) {
    throw FormatException('Missing required voucher string field: $field');
  }
  final value = json[field];
  if (value == null) return '';
  if (value is String) return value;
  throw FormatException('Invalid voucher string field: $field');
}

bool _requiredBool(Map<String, dynamic> json, String field) {
  final value = json[field];
  if (value is bool) {
    return value;
  }
  throw FormatException('Invalid voucher boolean field: $field');
}

int _requiredInt(Map<String, dynamic> json, String field) {
  final value = _readInt(json[field], field);
  if (value >= 0) return value;
  throw FormatException('Invalid voucher integer field: $field');
}

int? _optionalInt(Map<String, dynamic> json, String field, {int? max}) {
  if (!json.containsKey(field) || json[field] == null) return null;
  final value = _readInt(json[field], field);
  if (value < 0) {
    throw FormatException('Invalid voucher integer field: $field');
  }
  if (max != null && value > max) {
    throw FormatException('Voucher integer field out of range: $field');
  }
  return value;
}

int _readInt(dynamic value, String field) {
  if (value is int) return value;
  if (value is num && value.isFinite && value % 1 == 0) {
    return value.toInt();
  }
  throw FormatException('Invalid voucher integer field: $field');
}

DateTime _requiredDateTime(Map<String, dynamic> json, String field) {
  final value = _requiredString(json, field);
  final parsed = DateTime.tryParse(value);
  if (parsed != null) return parsed;
  throw FormatException('Invalid voucher timestamp field: $field');
}
