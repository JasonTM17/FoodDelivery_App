import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../shared/api/api_client.dart';

class FavoriteItem {
  final String id;
  final String type; // restaurant | food
  final String name;
  final String imageUrl;
  final double? rating;
  final String? subtitle;
  final DateTime addedAt;

  const FavoriteItem({
    required this.id,
    required this.type,
    required this.name,
    this.imageUrl = '',
    this.rating,
    this.subtitle,
    required this.addedAt,
  });

  factory FavoriteItem.fromJson(Map<String, dynamic> json) {
    return FavoriteItem(
      id: json['id'] as String,
      type: json['type'] as String? ?? 'restaurant',
      name: json['name'] as String? ?? '',
      imageUrl: json['imageUrl'] as String? ?? '',
      rating: (json['rating'] as num?)?.toDouble(),
      subtitle: json['subtitle'] as String?,
      addedAt: json['addedAt'] != null
          ? DateTime.tryParse(json['addedAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

class FavoritesState {
  final bool isLoading;
  final String? error;
  final List<FavoriteItem> items;
  final Set<String> togglingIds;

  const FavoritesState({
    this.isLoading = false,
    this.error,
    this.items = const [],
    this.togglingIds = const {},
  });

  FavoritesState copyWith({
    bool? isLoading,
    String? error,
    List<FavoriteItem>? items,
    Set<String>? togglingIds,
  }) {
    return FavoritesState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      items: items ?? this.items,
      togglingIds: togglingIds ?? this.togglingIds,
    );
  }
}

final favoritesProvider =
    StateNotifierProvider<FavoritesNotifier, FavoritesState>((ref) {
  return FavoritesNotifier();
});

class FavoritesNotifier extends StateNotifier<FavoritesState> {
  final ApiClient _api = ApiClient.instance;

  FavoritesNotifier() : super(const FavoritesState());

  Future<void> fetchFavorites() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.get('/users/me/favorites');
      final dataList = response.data as List<dynamic>;
      final items = dataList
          .map((e) => FavoriteItem.fromJson(e as Map<String, dynamic>))
          .toList();
      state = state.copyWith(isLoading: false, items: items);
    } on DioException catch (e) {
      final msg = e.response?.data?['message'] as String? ??
          'Không thể tải danh sách yêu thích.';
      state = state.copyWith(isLoading: false, error: msg);
    } catch (_) {
      state = state.copyWith(isLoading: false, error: 'Có lỗi xảy ra khi tải danh sách yêu thích.');
    }
  }

  Future<void> toggle(String id, {required String type}) async {
    final isFav = state.items.any((item) => item.id == id);
    // Optimistic toggle
    state = state.copyWith(
      togglingIds: {...state.togglingIds, id},
    );
    try {
      if (isFav) {
        await _api.delete('/users/me/favorites/$id');
        state = state.copyWith(
          items: state.items.where((item) => item.id != id).toList(),
          togglingIds: state.togglingIds.difference({id}),
        );
      } else {
        await _api.post('/users/me/favorites', data: {'id': id, 'type': type});
        // Re-fetch to get full data
        await fetchFavorites();
      }
    } on DioException catch (_) {
      // Rollback — re-fetch real state
      state = state.copyWith(
        togglingIds: state.togglingIds.difference({id}),
      );
      await fetchFavorites();
    }
  }

  bool isFavorite(String id) {
    return state.items.any((item) => item.id == id);
  }
}
