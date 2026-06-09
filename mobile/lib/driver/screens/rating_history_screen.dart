import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/theme/app_colors.dart';
import '../providers/rating_history_provider.dart';
import '../widgets/rating_stars_row.dart';
import '../widgets/driver_rating_distribution.dart';


class RatingHistoryScreen extends ConsumerStatefulWidget {
  const RatingHistoryScreen({super.key});

  @override
  ConsumerState<RatingHistoryScreen> createState() =>
      _RatingHistoryScreenState();
}

class _RatingHistoryScreenState extends ConsumerState<RatingHistoryScreen> {
  int? _starFilter;

  static const _filters = [
    (null, 'Tất cả'),
    (5, '5 sao'),
    (4, '4 sao'),
    (3, '3 sao'),
    (2, '2 sao'),
    (1, '1 sao'),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(ratingHistoryProvider.notifier).loadReviews();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(ratingHistoryProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        title: const Text(
          'Lịch sử đánh giá',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (state.stats != null)
              DriverRatingDistribution(
                average: state.stats!.average,
                totalReviews: state.stats!.totalReviews,
                distribution: state.stats!.distribution,
              ),
            const SizedBox(height: 20),
            _buildFilterChips(),
            const SizedBox(height: 16),
            if (state.isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child:
                      CircularProgressIndicator(color: AppColors.primary),
                ),
              )
            else if (state.reviews.isEmpty)
              _buildEmptyState()
            else
              ...state.reviews.map(_buildReviewCard),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChips() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: _filters.map((filter) {
          final isActive = _starFilter == filter.$1;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(filter.$2),
              selected: isActive,
              onSelected: (_) {
                setState(() => _starFilter = filter.$1);
                ref
                    .read(ratingHistoryProvider.notifier)
                    .loadReviews(starFilter: filter.$1);
              },
              selectedColor: AppColors.primary.withValues(alpha: 0.15),
              backgroundColor: const Color(0xFF1E1E1E),
              labelStyle: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: isActive ? AppColors.primary : const Color(0xFF9CA3AF),
              ),
              side: BorderSide(
                color: isActive
                    ? AppColors.primary
                    : const Color(0xFF374151),
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildReviewCard(DriverReview review) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                child: Text(
                  review.customerName.isNotEmpty
                      ? review.customerName[0].toUpperCase()
                      : '?',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      review.customerName,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 2),
                    RatingStarsRow(rating: review.rating, size: 14),
                  ],
                ),
              ),
              Text(
                _formatDate(review.date),
                style: const TextStyle(
                  fontSize: 11,
                  color: Color(0xFF6B7280),
                ),
              ),
            ],
          ),
          if (review.comment != null && review.comment!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              review.comment!,
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFFD1D5DB),
                height: 1.4,
              ),
            ),
          ],
          const SizedBox(height: 8),
          Text(
            'ĐH: ${review.orderId}',
            style: const TextStyle(
              fontSize: 11,
              color: Color(0xFF6B7280),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.star_border,
                size: 56,
                color: const Color(0xFF6B7280).withValues(alpha: 0.4)),
            const SizedBox(height: 16),
            const Text(
              'Chưa có đánh giá nào',
              style: TextStyle(fontSize: 15, color: Color(0xFF6B7280)),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);
    if (diff.inDays == 0) return 'Hôm nay';
    if (diff.inDays == 1) return 'Hôm qua';
    return '${date.day}/${date.month}';
  }
}
