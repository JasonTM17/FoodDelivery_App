import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';
import '../providers/rating_history_provider.dart';
import '../widgets/driver_rating_distribution.dart';
import '../widgets/rating_history_review_card.dart';

class RatingHistoryScreen extends ConsumerStatefulWidget {
  const RatingHistoryScreen({super.key});

  @override
  ConsumerState<RatingHistoryScreen> createState() =>
      _RatingHistoryScreenState();
}

class _RatingHistoryScreenState extends ConsumerState<RatingHistoryScreen> {
  int? _starFilter;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(ratingHistoryProvider.notifier).loadReviews();
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(ratingHistoryProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        title: Text(
          l10n.driverRatingsTitle,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
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
            _buildFilterChips(l10n),
            const SizedBox(height: 16),
            if (state.isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
              )
            else if (state.error != null)
              _buildErrorState(l10n)
            else if (state.reviews.isEmpty)
              _buildEmptyState(l10n)
            else
              ...state.reviews.map(
                (review) => RatingHistoryReviewCard(
                  review: review,
                  dateLabel: _formatDate(review.date, l10n),
                  orderLabel: l10n.driverRatingsOrder(review.orderId),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChips(AppLocalizations l10n) {
    final filters = [
      (null, l10n.driverRatingsAll),
      (5, l10n.driverRatingsStars(5)),
      (4, l10n.driverRatingsStars(4)),
      (3, l10n.driverRatingsStars(3)),
      (2, l10n.driverRatingsStars(2)),
      (1, l10n.driverRatingsStars(1)),
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: filters.map((filter) {
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
                color: isActive ? AppColors.primary : const Color(0xFF374151),
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

  Widget _buildEmptyState(AppLocalizations l10n) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.star_border,
              size: 56,
              color: const Color(0xFF6B7280).withValues(alpha: 0.4),
            ),
            const SizedBox(height: 16),
            Text(
              l10n.driverRatingsEmpty,
              style: const TextStyle(fontSize: 15, color: Color(0xFF6B7280)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(AppLocalizations l10n) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.error_outline,
              size: 52,
              color: AppColors.error.withValues(alpha: 0.75),
            ),
            const SizedBox(height: 16),
            Text(
              l10n.driverRatingsError,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 15, color: Color(0xFFD1D5DB)),
            ),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: () => ref
                  .read(ratingHistoryProvider.notifier)
                  .loadReviews(starFilter: _starFilter),
              child: Text(l10n.driverRatingsRetry),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date, AppLocalizations l10n) {
    final now = DateTime.now();
    final diff = now.difference(date);
    if (diff.inDays == 0) return l10n.driverRatingsToday;
    if (diff.inDays == 1) return l10n.driverRatingsYesterday;
    return '${date.day}/${date.month}';
  }
}
