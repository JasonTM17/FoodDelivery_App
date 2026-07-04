import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../shared/api/api_client.dart';
import '../../shared/utils/backend_date_time.dart';

class DriverReview {
  final String id;
  final String customerName;
  final String? customerAvatarUrl;
  final int rating; // 1-5 stars
  final String? comment;
  final DateTime date;
  final String orderId;

  const DriverReview({
    required this.id,
    required this.customerName,
    this.customerAvatarUrl,
    required this.rating,
    this.comment,
    required this.date,
    required this.orderId,
  });

  factory DriverReview.fromJson(Map<String, dynamic> json) {
    final orderCode = json['orderCode']?.toString();
    final orderId = json['orderId']?.toString() ?? '';
    return DriverReview(
      id: json['id']?.toString() ?? '',
      customerName: json['customerName']?.toString() ?? 'Customer',
      customerAvatarUrl: json['customerAvatarUrl']?.toString(),
      rating: _readInt(json['rating']).clamp(1, 5).toInt(),
      comment: json['comment']?.toString(),
      date: parseBackendDateTimeOrUnknown(json['date']),
      orderId: orderCode?.isNotEmpty == true ? orderCode! : orderId,
    );
  }
}

class RatingStats {
  final double average;
  final int totalReviews;
  final Map<int, int> distribution; // 1-5 → count

  const RatingStats({
    required this.average,
    required this.totalReviews,
    required this.distribution,
  });

  factory RatingStats.fromJson(Map<String, dynamic> json) {
    final rawDistribution = json['distribution'];
    final distribution = <int, int>{};
    for (var star = 1; star <= 5; star += 1) {
      if (rawDistribution is Map) {
        distribution[star] = _readInt(
          rawDistribution[star] ?? rawDistribution[star.toString()],
        );
      } else {
        distribution[star] = 0;
      }
    }
    return RatingStats(
      average: _readDouble(json['average']),
      totalReviews: _readInt(json['totalReviews']),
      distribution: distribution,
    );
  }
}

class RatingHistoryState {
  final List<DriverReview> reviews;
  final RatingStats? stats;
  final bool isLoading;
  final String? error;
  final int? starFilter; // null = all, 1-5
  final bool hasMore;

  const RatingHistoryState({
    this.reviews = const [],
    this.stats,
    this.isLoading = false,
    this.error,
    this.starFilter,
    this.hasMore = true,
  });

  RatingHistoryState copyWith({
    List<DriverReview>? reviews,
    RatingStats? stats,
    bool? isLoading,
    String? error,
    int? starFilter,
    bool? hasMore,
  }) {
    return RatingHistoryState(
      reviews: reviews ?? this.reviews,
      stats: stats ?? this.stats,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      starFilter: starFilter,
      hasMore: hasMore ?? this.hasMore,
    );
  }
}

class RatingHistoryNotifier extends StateNotifier<RatingHistoryState> {
  RatingHistoryNotifier({ApiClient? api})
    : _api = api ?? ApiClient.instance,
      super(const RatingHistoryState());

  final ApiClient _api;

  Future<void> loadReviews({int? starFilter}) async {
    state = state.copyWith(
      isLoading: true,
      error: null,
      starFilter: starFilter,
    );
    try {
      final response = await _api.get<Map<String, dynamic>>(
        '/driver/ratings',
        queryParameters: starFilter == null ? null : {'star': starFilter},
      );
      final data = response.data ?? {};
      final rawReviews = data['reviews'];
      final reviews = rawReviews is List
          ? rawReviews
                .whereType<Map>()
                .map(
                  (review) =>
                      DriverReview.fromJson(Map<String, dynamic>.from(review)),
                )
                .toList(growable: false)
          : <DriverReview>[];
      final rawStats = data['stats'];
      state = state.copyWith(
        isLoading: false,
        reviews: reviews,
        stats: rawStats is Map
            ? RatingStats.fromJson(Map<String, dynamic>.from(rawStats))
            : const RatingStats(
                average: 0,
                totalReviews: 0,
                distribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
              ),
        hasMore: data['hasMore'] == true,
        starFilter: starFilter,
      );
    } catch (_) {
      state = state.copyWith(
        isLoading: false,
        error: 'DRIVER_RATINGS_UNAVAILABLE',
        starFilter: starFilter,
      );
    }
  }

  void refresh() {
    loadReviews(starFilter: state.starFilter);
  }
}

final ratingHistoryProvider =
    StateNotifierProvider<RatingHistoryNotifier, RatingHistoryState>((ref) {
      return RatingHistoryNotifier();
    });

int _readInt(Object? value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? 0;
}

double _readDouble(Object? value) {
  if (value is double) return value;
  if (value is num) return value.toDouble();
  return double.tryParse(value?.toString() ?? '') ?? 0;
}
