import 'package:flutter_riverpod/flutter_riverpod.dart';

enum RestaurantViewMode { list, map }

class RestaurantFilterIds {
  static const all = 'all';
  static const nearest = 'nearest';
  static const openNow = 'open_now';
  static const _cuisinePrefix = 'cuisine:';

  static String cuisine(String value) => '$_cuisinePrefix$value';

  static String? cuisineValue(String id) {
    if (!id.startsWith(_cuisinePrefix)) return null;
    return id.substring(_cuisinePrefix.length);
  }
}

class RestaurantFilterState {
  final RestaurantViewMode viewMode;
  final String selectedFilterId;

  const RestaurantFilterState({
    this.viewMode = RestaurantViewMode.list,
    this.selectedFilterId = RestaurantFilterIds.all,
  });

  RestaurantFilterState copyWith({
    RestaurantViewMode? viewMode,
    String? selectedFilterId,
  }) {
    return RestaurantFilterState(
      viewMode: viewMode ?? this.viewMode,
      selectedFilterId: selectedFilterId ?? this.selectedFilterId,
    );
  }
}

class RestaurantFilterNotifier extends StateNotifier<RestaurantFilterState> {
  RestaurantFilterNotifier() : super(const RestaurantFilterState());

  void setViewMode(RestaurantViewMode mode) =>
      state = state.copyWith(viewMode: mode);

  void setFilter(String filterId) =>
      state = state.copyWith(selectedFilterId: filterId);
}

final restaurantFilterProvider =
    StateNotifierProvider<RestaurantFilterNotifier, RestaurantFilterState>(
      (ref) => RestaurantFilterNotifier(),
    );
