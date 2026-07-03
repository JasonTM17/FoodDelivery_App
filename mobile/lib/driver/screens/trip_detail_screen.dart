import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';
import '../providers/trip_route_provider.dart';
import '../widgets/route_replay_map.dart';
import '../widgets/trip_detail_header_card.dart';
import '../widgets/trip_route_segment_card.dart';
import '../widgets/trip_summary_card.dart';

class TripDetailScreen extends ConsumerStatefulWidget {
  final String tripId;
  final String? restaurantName;
  final double? fromLat;
  final double? fromLng;
  final double? toLat;
  final double? toLng;

  const TripDetailScreen({
    super.key,
    required this.tripId,
    this.restaurantName,
    this.fromLat,
    this.fromLng,
    this.toLat,
    this.toLng,
  });

  @override
  ConsumerState<TripDetailScreen> createState() => _TripDetailScreenState();
}

class _TripDetailScreenState extends ConsumerState<TripDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(tripRouteProvider.notifier).loadRoute(widget.tripId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(tripRouteProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        title: Text(
          l10n.driverTripDetailTitle,
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
            if (widget.restaurantName != null) ...[
              TripDetailHeaderCard(
                restaurantName: widget.restaurantName!,
                tripId: widget.tripId,
              ),
              const SizedBox(height: 16),
            ],
            if (state.isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(40),
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
              )
            else if (state.error != null)
              _buildError(l10n)
            else if (state.route == null || state.route!.points.isEmpty)
              _buildEmptyState(l10n)
            else
              _buildRouteDetail(l10n, state.route!),
          ],
        ),
      ),
    );
  }

  Widget _buildRouteDetail(AppLocalizations l10n, TripRouteDetail route) {
    final firstPoint = route.points.first;
    final lastPoint = route.points.last;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        RouteReplayMap(
          points: route.points
              .map((point) => RoutePointData(lat: point.lat, lng: point.lng))
              .toList(growable: false),
          fromLat: widget.fromLat ?? firstPoint.lat,
          fromLng: widget.fromLng ?? firstPoint.lng,
          toLat: widget.toLat ?? lastPoint.lat,
          toLng: widget.toLng ?? lastPoint.lng,
        ),
        const SizedBox(height: 16),
        TripSummaryCard(
          distanceKm: route.totalDistanceKm,
          durationSeconds: route.totalDurationSeconds,
          avgSpeedKmh: route.avgSpeedKmh,
          payout: route.payout,
          rating: null,
          tipNote: null,
        ),
        if (route.segments.isNotEmpty) ...[
          const SizedBox(height: 20),
          Text(
            l10n.driverTripDetailSegments,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 10),
          ...route.segments.map(
            (segment) => TripRouteSegmentCard(segment: segment),
          ),
        ],
      ],
    );
  }

  Widget _buildError(AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFFEF4444).withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: Color(0xFFEF4444)),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              l10n.driverTripDetailLoadError,
              style: const TextStyle(color: Color(0xFFEF4444), fontSize: 14),
            ),
          ),
          TextButton(
            onPressed: () =>
                ref.read(tripRouteProvider.notifier).loadRoute(widget.tripId),
            child: Text(l10n.driverTripDetailRetry),
          ),
        ],
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
              Icons.route,
              size: 56,
              color: const Color(0xFF6B7280).withValues(alpha: 0.4),
            ),
            const SizedBox(height: 16),
            Text(
              l10n.driverTripDetailNoRoute,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 15, color: Color(0xFF6B7280)),
            ),
          ],
        ),
      ),
    );
  }
}
