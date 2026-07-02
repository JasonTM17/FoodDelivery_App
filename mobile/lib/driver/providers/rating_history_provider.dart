import 'package:flutter_riverpod/flutter_riverpod.dart';

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
  RatingHistoryNotifier() : super(const RatingHistoryState());

  Future<void> loadReviews({int? starFilter}) async {
    state = state.copyWith(isLoading: true, error: null, starFilter: starFilter);
    // TODO: Replace with real API GET /driver/ratings?star=...
    await Future.delayed(const Duration(milliseconds: 500));
    state = state.copyWith(
      isLoading: false,
      reviews: _sampleReviews(),
      stats: _sampleStats(),
      hasMore: false,
    );
  }

  void refresh() {
    loadReviews(starFilter: state.starFilter);
  }

  RatingStats _sampleStats() {
    return const RatingStats(
      average: 4.8,
      totalReviews: 156,
      distribution: {5: 98, 4: 36, 3: 14, 2: 5, 1: 3},
    );
  }

  List<DriverReview> _sampleReviews() {
    return [
      DriverReview(id: 'r1', customerName: 'Nguyễn Thị Hương', rating: 5,
          comment: 'Giao hàng nhanh, đồ ăn còn nóng. Tài xế rất lịch sự.',
          date: DateTime(2026, 6, 9), orderId: 'ORD-001'),
      DriverReview(id: 'r2', customerName: 'Trần Văn Nam', rating: 4,
          comment: 'Giao đúng giờ, đồ ăn ổn.',
          date: DateTime(2026, 6, 9), orderId: 'ORD-002'),
      DriverReview(id: 'r3', customerName: 'Lê Thị Mai', rating: 5,
          date: DateTime(2026, 6, 8), orderId: 'ORD-003'),
      DriverReview(id: 'r4', customerName: 'Phạm Minh Tuấn', rating: 4,
          comment: 'Nên gọi trước khi tới.',
          date: DateTime(2026, 6, 8), orderId: 'ORD-004'),
      DriverReview(id: 'r5', customerName: 'Hoàng Thị Lan', rating: 5,
          comment: 'Tài xế thân thiện, giao nhanh.',
          date: DateTime(2026, 6, 7), orderId: 'ORD-005'),
      DriverReview(id: 'r6', customerName: 'Đặng Văn Hải', rating: 3,
          comment: 'Giao hơi chậm hơn dự kiến.',
          date: DateTime(2026, 6, 7), orderId: 'ORD-006'),
    ];
  }
}

final ratingHistoryProvider = StateNotifierProvider<RatingHistoryNotifier, RatingHistoryState>((ref) {
  return RatingHistoryNotifier();
});
