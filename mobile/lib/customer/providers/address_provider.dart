import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../shared/api/api_client.dart';
import '../../shared/maps/lat_lng_validation.dart';
import '../../shared/models/user.dart';

final addressProvider = StateNotifierProvider<AddressNotifier, AddressState>((
  ref,
) {
  return AddressNotifier();
});

class AddressState {
  final bool isLoading;
  final String? error;
  final List<AddressModel> addresses;

  const AddressState({
    this.isLoading = false,
    this.error,
    this.addresses = const [],
  });

  AddressState copyWith({
    bool? isLoading,
    String? error,
    List<AddressModel>? addresses,
  }) {
    return AddressState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      addresses: addresses ?? this.addresses,
    );
  }
}

class AddressNotifier extends StateNotifier<AddressState> {
  final ApiClient _api = ApiClient.instance;

  AddressNotifier() : super(const AddressState());

  Future<void> fetchAddresses() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.get('/users/addresses');
      final List<dynamic> dataList = response.data is List
          ? response.data as List<dynamic>
          : (response.data as Map<String, dynamic>)['addresses']
                    as List<dynamic>? ??
                [];
      final addresses = dataList
          .map((e) => AddressModel.fromJson(e as Map<String, dynamic>))
          .toList();
      state = state.copyWith(isLoading: false, addresses: addresses);
    } on DioException catch (e) {
      final message =
          e.response?.data?['message'] as String? ??
          e.response?.data?['error'] as String? ??
          'Không thể tải danh sách địa chỉ.';
      state = state.copyWith(isLoading: false, error: message);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Có lỗi xảy ra khi tải địa chỉ.',
      );
    }
  }

  Future<bool> addAddress({
    required String label,
    required String address,
    double? latitude,
    double? longitude,
    String? apartmentNumber,
    String? note,
    bool isDefault = false,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    if (!isValidDeliveryLatLng(latitude, longitude)) {
      state = state.copyWith(
        isLoading: false,
        error: 'ADDRESS_LOCATION_REQUIRED',
      );
      return false;
    }
    try {
      final response = await _api.post(
        '/users/addresses',
        data: {
          'label': label,
          'addressLine': address.trim(),
          'latitude': latitude,
          'longitude': longitude,
          'apartmentNumber': apartmentNumber,
          'note': note,
          'isDefault': isDefault,
        },
      );
      final newAddress = AddressModel.fromJson(
        response.data as Map<String, dynamic>,
      );
      final updatedAddresses = isDefault
          ? state.addresses.map((a) => a.copyWith(isDefault: false)).toList()
          : List<AddressModel>.from(state.addresses);
      updatedAddresses.add(newAddress);
      state = state.copyWith(isLoading: false, addresses: updatedAddresses);
      return true;
    } on DioException catch (e) {
      final message =
          e.response?.data?['message'] as String? ??
          e.response?.data?['error'] as String? ??
          'Không thể thêm địa chỉ.';
      state = state.copyWith(isLoading: false, error: message);
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Có lỗi xảy ra khi thêm địa chỉ.',
      );
      return false;
    }
  }

  Future<bool> updateAddress({
    required String id,
    String? label,
    String? address,
    double? latitude,
    double? longitude,
    String? apartmentNumber,
    String? note,
    bool? isDefault,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final data = <String, dynamic>{};
      if (label != null) data['label'] = label;
      if (address != null) data['addressLine'] = address.trim();
      if (latitude != null || longitude != null) {
        if (!isValidDeliveryLatLng(latitude, longitude)) {
          state = state.copyWith(
            isLoading: false,
            error: 'ADDRESS_LOCATION_INVALID',
          );
          return false;
        }
        data['latitude'] = latitude;
        data['longitude'] = longitude;
      }
      if (apartmentNumber != null) data['apartmentNumber'] = apartmentNumber;
      if (note != null) data['note'] = note;
      if (isDefault != null) data['isDefault'] = isDefault;

      await _api.put('/users/addresses/$id', data: data);
      final updatedAddresses = state.addresses.map((a) {
        if (a.id != id) {
          if (isDefault == true) return a.copyWith(isDefault: false);
          return a;
        }
        return AddressModel(
          id: a.id,
          label: label ?? a.label,
          address: address ?? a.address,
          latitude: latitude ?? a.latitude,
          longitude: longitude ?? a.longitude,
          apartmentNumber: apartmentNumber ?? a.apartmentNumber,
          note: note ?? a.note,
          isDefault: isDefault ?? a.isDefault,
        );
      }).toList();
      state = state.copyWith(isLoading: false, addresses: updatedAddresses);
      return true;
    } on DioException catch (e) {
      final message =
          e.response?.data?['message'] as String? ??
          e.response?.data?['error'] as String? ??
          'Không thể cập nhật địa chỉ.';
      state = state.copyWith(isLoading: false, error: message);
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Có lỗi xảy ra khi cập nhật địa chỉ.',
      );
      return false;
    }
  }

  Future<bool> deleteAddress(String id) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _api.delete('/users/addresses/$id');
      final updatedAddresses = state.addresses
          .where((a) => a.id != id)
          .toList();
      state = state.copyWith(isLoading: false, addresses: updatedAddresses);
      return true;
    } on DioException catch (e) {
      final message =
          e.response?.data?['message'] as String? ??
          e.response?.data?['error'] as String? ??
          'Không thể xóa địa chỉ.';
      state = state.copyWith(isLoading: false, error: message);
      return false;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Có lỗi xảy ra khi xóa địa chỉ.',
      );
      return false;
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}
