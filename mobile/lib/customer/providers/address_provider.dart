import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

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
  final ApiClient _api;

  AddressNotifier({ApiClient? apiClient})
    : _api = apiClient ?? ApiClient.instance,
      super(const AddressState());

  Future<void> fetchAddresses() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.get<dynamic>('/users/addresses');
      final addresses = _requiredList(
        response.data,
        'addresses',
      ).map(_parseSavedAddress).toList(growable: false);
      state = state.copyWith(isLoading: false, addresses: addresses);
    } on DioException catch (e) {
      final message =
          e.response?.data?['message'] as String? ??
          e.response?.data?['error'] as String? ??
          'Không thể tải danh sách địa chỉ.';
      state = state.copyWith(isLoading: false, error: message);
    } on FormatException {
      state = state.copyWith(
        isLoading: false,
        addresses: const [],
        error: 'ADDRESSES_CONTRACT_INVALID_RESPONSE',
      );
    } catch (_) {
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
      final response = await _api.post<dynamic>(
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
      final newAddress = _parseSavedAddress(response.data);
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
    } on FormatException {
      state = state.copyWith(
        isLoading: false,
        error: 'ADDRESSES_CONTRACT_INVALID_RESPONSE',
      );
      return false;
    } catch (_) {
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

      final response = await _api.put<dynamic>(
        '/users/addresses/$id',
        data: data,
      );
      final updatedAddress = _parseSavedAddress(response.data);
      final updatedAddresses = state.addresses.map((a) {
        if (a.id != id) {
          if (updatedAddress.isDefault) return a.copyWith(isDefault: false);
          return a;
        }
        return updatedAddress;
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
    } on FormatException {
      state = state.copyWith(
        isLoading: false,
        error: 'ADDRESSES_CONTRACT_INVALID_RESPONSE',
      );
      return false;
    } catch (_) {
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
    } catch (_) {
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

List<dynamic> _requiredList(dynamic value, String field) {
  if (value is List) return value;
  throw FormatException('Missing required address list field: $field');
}

AddressModel _parseSavedAddress(dynamic value) {
  if (value is! Map) {
    throw const FormatException('Invalid address row');
  }
  final address = AddressModel.fromJson(Map<String, dynamic>.from(value));
  if (address.id.trim().isEmpty || address.address.trim().isEmpty) {
    throw const FormatException('Missing required saved address fields');
  }
  if (!isValidDeliveryLatLng(address.latitude, address.longitude)) {
    throw const FormatException('Missing required saved address coordinates');
  }
  return address;
}
