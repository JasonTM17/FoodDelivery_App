import 'package:flutter_riverpod/flutter_riverpod.dart';

enum RestaurantViewMode { list, map }

class RestaurantFilterState {
  final RestaurantViewMode viewMode;
  final String selectedFilter;

  const RestaurantFilterState({
    this.viewMode = RestaurantViewMode.list,
    this.selectedFilter = 'Tất cả',
  });

  RestaurantFilterState copyWith({
    RestaurantViewMode? viewMode,
    String? selectedFilter,
  }) {
    return RestaurantFilterState(
      viewMode: viewMode ?? this.viewMode,
      selectedFilter: selectedFilter ?? this.selectedFilter,
    );
  }
}

class RestaurantFilterNotifier extends StateNotifier<RestaurantFilterState> {
  RestaurantFilterNotifier() : super(const RestaurantFilterState());

  void setViewMode(RestaurantViewMode mode) =>
      state = state.copyWith(viewMode: mode);

  void setFilter(String filter) =>
      state = state.copyWith(selectedFilter: filter);
}

final restaurantFilterProvider =
    StateNotifierProvider<RestaurantFilterNotifier, RestaurantFilterState>(
      (ref) => RestaurantFilterNotifier(),
    );
