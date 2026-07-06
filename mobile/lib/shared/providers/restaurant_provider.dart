import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../api/api_client.dart';
import '../models/restaurant.dart';
import '../models/menu_item.dart';

final restaurantProvider =
    StateNotifierProvider<RestaurantNotifier, RestaurantState>((ref) {
      return RestaurantNotifier();
    });

class RestaurantState {
  final bool isLoading;
  final String? error;
  final List<RestaurantModel> nearbyRestaurants;
  final RestaurantModel? selectedRestaurant;
  final List<MenuItemModel> menuItems;
  final bool isLoadingMenu;
  final List<RestaurantModel> searchResults;
  final bool isSearching;

  const RestaurantState({
    this.isLoading = false,
    this.error,
    this.nearbyRestaurants = const [],
    this.selectedRestaurant,
    this.menuItems = const [],
    this.isLoadingMenu = false,
    this.searchResults = const [],
    this.isSearching = false,
  });

  RestaurantState copyWith({
    bool? isLoading,
    String? error,
    List<RestaurantModel>? nearbyRestaurants,
    RestaurantModel? selectedRestaurant,
    List<MenuItemModel>? menuItems,
    bool? isLoadingMenu,
    List<RestaurantModel>? searchResults,
    bool? isSearching,
  }) {
    return RestaurantState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      nearbyRestaurants: nearbyRestaurants ?? this.nearbyRestaurants,
      selectedRestaurant: selectedRestaurant ?? this.selectedRestaurant,
      menuItems: menuItems ?? this.menuItems,
      isLoadingMenu: isLoadingMenu ?? this.isLoadingMenu,
      searchResults: searchResults ?? this.searchResults,
      isSearching: isSearching ?? this.isSearching,
    );
  }
}

class RestaurantNotifier extends StateNotifier<RestaurantState> {
  final ApiClient _api = ApiClient.instance;

  RestaurantNotifier() : super(const RestaurantState());

  Future<void> fetchNearbyRestaurants({
    double? latitude,
    double? longitude,
    String? cuisine,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final queryParams = <String, dynamic>{};
      if (latitude != null) queryParams['latitude'] = latitude;
      if (longitude != null) queryParams['longitude'] = longitude;
      if (cuisine != null) queryParams['cuisine'] = cuisine;

      final response = await _api.get(
        '/restaurants/nearby',
        queryParameters: queryParams,
      );
      final dataList = response.data as List<dynamic>;
      final restaurants = dataList
          .map((e) => RestaurantModel.fromJson(e as Map<String, dynamic>))
          .toList();

      state = state.copyWith(isLoading: false, nearbyRestaurants: restaurants);
    } on DioException catch (e) {
      final message =
          e.response?.data?['message'] as String? ??
          'Không thể tải danh sách nhà hàng.';
      state = state.copyWith(isLoading: false, error: message);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Có lỗi xảy ra khi tải nhà hàng.',
      );
    }
  }

  Future<void> fetchRestaurantDetail(String restaurantId) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.get('/restaurants/$restaurantId');
      final restaurant = RestaurantModel.fromJson(
        response.data as Map<String, dynamic>,
      );
      state = state.copyWith(isLoading: false, selectedRestaurant: restaurant);
    } on DioException catch (e) {
      final message =
          e.response?.data?['message'] as String? ??
          'Không thể tải thông tin nhà hàng.';
      state = state.copyWith(isLoading: false, error: message);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Có lỗi xảy ra khi tải thông tin nhà hàng.',
      );
    }
  }

  Future<void> fetchMenu(String restaurantId) async {
    state = state.copyWith(isLoadingMenu: true, error: null);
    try {
      final response = await _api.get('/restaurants/$restaurantId/menu');
      final menuItems = _parseRestaurantMenu(response.data, restaurantId);

      state = state.copyWith(isLoadingMenu: false, menuItems: menuItems);
    } on DioException catch (e) {
      final message =
          e.response?.data?['message'] as String? ?? 'Không thể tải thực đơn.';
      state = state.copyWith(isLoadingMenu: false, error: message);
    } on FormatException {
      state = state.copyWith(
        isLoadingMenu: false,
        error: 'MENU_CONTRACT_INVALID_RESPONSE',
        menuItems: const [],
      );
    } catch (e) {
      state = state.copyWith(
        isLoadingMenu: false,
        error: 'Có lỗi xảy ra khi tải thực đơn.',
        menuItems: const [],
      );
    }
  }

  Future<void> searchRestaurants(String query) async {
    if (query.isEmpty) {
      state = state.copyWith(searchResults: [], isSearching: false);
      return;
    }
    state = state.copyWith(isSearching: true);
    try {
      final response = await _api.get(
        '/restaurants/search',
        queryParameters: {'q': query},
      );
      final dataList = response.data as List<dynamic>;
      final results = dataList
          .map((e) => RestaurantModel.fromJson(e as Map<String, dynamic>))
          .toList();
      state = state.copyWith(searchResults: results, isSearching: false);
    } catch (e) {
      state = state.copyWith(isSearching: false);
    }
  }

  void clearSelectedRestaurant() {
    state = state.copyWith(selectedRestaurant: null, menuItems: []);
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

List<MenuItemModel> _parseRestaurantMenu(dynamic value, String restaurantId) {
  if (value is! Map) {
    throw const FormatException('Restaurant menu response must be an object');
  }
  final data = Map<String, dynamic>.from(value);
  final categories = data['categories'];
  if (categories is! List) {
    throw const FormatException('Restaurant menu categories must be a list');
  }

  return categories.expand((categoryValue) {
    final category = _requiredObject(categoryValue, 'categories[]');
    final categoryName = _requiredString(category, 'categories[].name');
    final items = category['items'];
    if (items is! List) {
      throw const FormatException(
        'Restaurant menu category items must be a list',
      );
    }
    return items.map((itemValue) {
      final item = _requiredObject(itemValue, 'categories[].items[]');
      return MenuItemModel.fromJson({
        ...item,
        'restaurantId': item['restaurantId'] ?? restaurantId,
        'category': item['category'] ?? categoryName,
      });
    });
  }).toList();
}

Map<String, dynamic> _requiredObject(dynamic value, String field) {
  if (value is Map) {
    return Map<String, dynamic>.from(value);
  }
  throw FormatException('Invalid restaurant menu object field: $field');
}

String _requiredString(Map<String, dynamic> json, String field) {
  final value = json['name'];
  if (value is String && value.trim().isNotEmpty) return value;
  throw FormatException('Missing restaurant menu string field: $field');
}
