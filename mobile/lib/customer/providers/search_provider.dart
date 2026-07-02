import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../shared/api/api_client.dart';

class SearchResultItem {
  final String id;
  final String type; // restaurant | food
  final String name;
  final String imageUrl;
  final double? rating;
  final String? subtitle;
  final int? price; // in VND
  final double? distanceKm;
  final bool isOpen;

  const SearchResultItem({
    required this.id,
    required this.type,
    required this.name,
    this.imageUrl = '',
    this.rating,
    this.subtitle,
    this.price,
    this.distanceKm,
    this.isOpen = true,
  });

  factory SearchResultItem.fromJson(Map<String, dynamic> json) {
    return SearchResultItem(
      id: json['id'] as String,
      type: json['type'] as String? ?? 'restaurant',
      name: json['name'] as String? ?? '',
      imageUrl: json['imageUrl'] as String? ?? '',
      rating: (json['rating'] as num?)?.toDouble(),
      subtitle: json['subtitle'] as String?,
      price: json['price'] as int?,
      distanceKm: (json['distanceKm'] as num?)?.toDouble(),
      isOpen: json['isOpen'] as bool? ?? true,
    );
  }
}

enum SearchSort { nearest, topRated, priceLowHigh, openNow }

extension SearchSortLabel on SearchSort {
  String labelVi() {
    switch (this) {
      case SearchSort.nearest:
        return 'Gần nhất';
      case SearchSort.topRated:
        return 'Đánh giá cao';
      case SearchSort.priceLowHigh:
        return 'Giá thấp → cao';
      case SearchSort.openNow:
        return 'Đang mở';
    }
  }
}

class SearchState {
  final bool isLoading;
  final String? error;
  final String query;
  final SearchSort sort;
  final List<SearchResultItem> results;
  final List<String> recentSearches;

  const SearchState({
    this.isLoading = false,
    this.error,
    this.query = '',
    this.sort = SearchSort.nearest,
    this.results = const [],
    this.recentSearches = const [],
  });

  SearchState copyWith({
    bool? isLoading,
    String? error,
    String? query,
    SearchSort? sort,
    List<SearchResultItem>? results,
    List<String>? recentSearches,
  }) {
    return SearchState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      query: query ?? this.query,
      sort: sort ?? this.sort,
      results: results ?? this.results,
      recentSearches: recentSearches ?? this.recentSearches,
    );
  }
}

final searchProvider =
    StateNotifierProvider<SearchNotifier, SearchState>((ref) {
  return SearchNotifier();
});

class SearchNotifier extends StateNotifier<SearchState> {
  final ApiClient _api = ApiClient.instance;

  SearchNotifier() : super(const SearchState());

  void updateQuery(String query) {
    state = state.copyWith(query: query);
  }

  void updateSort(SearchSort sort) {
    state = state.copyWith(sort: sort);
    if (state.query.isNotEmpty) {
      search(state.query);
    }
  }

  void addRecentSearch(String query) {
    final trimmed = query.trim();
    if (trimmed.isEmpty) return;
    final recents = [
      trimmed,
      ...state.recentSearches.where((s) => s != trimmed),
    ].take(10).toList();
    state = state.copyWith(recentSearches: recents);
  }

  void clearRecentSearches() {
    state = state.copyWith(recentSearches: const []);
  }

  Future<void> search(String query) async {
    if (query.trim().isEmpty) {
      state = state.copyWith(results: const [], error: null);
      return;
    }
    state = state.copyWith(isLoading: true, error: null, query: query);
    try {
      String sortParam;
      switch (state.sort) {
        case SearchSort.priceLowHigh:
          sortParam = 'price_asc';
          break;
        case SearchSort.topRated:
          sortParam = 'rating_desc';
          break;
        case SearchSort.openNow:
          sortParam = 'open_now';
          break;
        default:
          sortParam = 'distance';
      }
      final response = await _api.get('/restaurants/search',
          queryParameters: {'q': query, 'sort': sortParam});
      final dataList = response.data as List<dynamic>;
      final results = dataList
          .map((e) => SearchResultItem.fromJson(e as Map<String, dynamic>))
          .toList();
      state = state.copyWith(isLoading: false, results: results);
      addRecentSearch(query);
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] as String? ??
          'Không thể tìm kiếm.';
      state = state.copyWith(isLoading: false, error: msg);
    } catch (_) {
      state = state.copyWith(isLoading: false, error: 'Có lỗi xảy ra khi tìm kiếm.');
    }
  }
}
