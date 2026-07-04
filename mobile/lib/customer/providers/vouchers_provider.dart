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
  final int? minOrderAmount;
  final DateTime? expiresAt;
  final bool isUsed;
  final String status; // available | used | expired

  const Voucher({
    required this.id,
    required this.code,
    required this.title,
    this.description = '',
    this.percentOff,
    this.maxDiscount,
    this.minOrderAmount,
    this.expiresAt,
    this.isUsed = false,
    this.status = 'available',
  });

  factory Voucher.fromJson(Map<String, dynamic> json) {
    return Voucher(
      id: json['id'] as String,
      code: json['code'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      percentOff: json['percentOff'] as int?,
      maxDiscount: json['maxDiscount'] as int?,
      minOrderAmount: json['minOrderAmount'] as int?,
      expiresAt: json['expiresAt'] != null
          ? DateTime.tryParse(json['expiresAt'] as String)
          : null,
      isUsed: json['isUsed'] as bool? ?? false,
      status: json['status'] as String? ?? 'available',
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
      final myData =
          (results[0].data as List<dynamic>?)
              ?.map((e) => Voucher.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [];
      final availData =
          (results[1].data as List<dynamic>?)
              ?.map((e) => Voucher.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [];
      final now = DateTime.now();
      final my = myData.where((v) {
        if (v.isUsed) return false;
        if (v.expiresAt != null && v.expiresAt!.isBefore(now)) return false;
        return true;
      }).toList();
      final expired = myData.where((v) {
        if (v.isUsed) return true;
        if (v.expiresAt != null && v.expiresAt!.isBefore(now)) return true;
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
      state = state.copyWith(isLoading: false, error: msg);
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        error: 'Có lỗi xảy ra khi tải voucher.',
      );
    }
  }
}
