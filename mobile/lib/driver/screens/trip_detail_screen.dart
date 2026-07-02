import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/theme/app_colors.dart';
import '../providers/trip_route_provider.dart';
import '../widgets/route_replay_map.dart';
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
    final state = ref.watch(tripRouteProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        title: Text(
          'Chi tiết chuyến đi',
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
            if (widget.restaurantName != null)
              _buildHeader(),
            const SizedBox(height: 16),
            if (state.isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(40),
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
              )
            else if (state.error != null)
              _buildError(state.error!)
            else if (state.route != null) ...[
              RouteReplayMap(
                points: state.route!.points
                    .map((p) => RoutePointData(lat: p.lat, lng: p.lng))
                    .toList(),
                fromLat: widget.fromLat ?? state.route!.points.first.lat,
                fromLng: widget.fromLng ?? state.route!.points.first.lng,
                toLat: widget.toLat ?? state.route!.points.last.lat,
                toLng: widget.toLng ?? state.route!.points.last.lng,
              ),
              const SizedBox(height: 16),
              TripSummaryCard(
                distanceKm: state.route!.totalDistanceKm,
                durationSeconds: state.route!.totalDurationSeconds,
                avgSpeedKmh: state.route!.avgSpeedKmh,
                payout: state.route!.payout,
                rating: 5,
                tipNote: null,
              ),
              if (state.route!.segments.isNotEmpty) ...[
                const SizedBox(height: 20),
                const Text(
                  'Hướng dẫn từng chặng',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 10),
                ...state.route!.segments.map((seg) =>
                    _buildSegment(seg.instruction, seg.distanceKm, seg.durationSeconds)),
              ],
            ] else
              _buildEmptyState(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF374151)),
      ),
      child: Row(
        children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.restaurant_outlined,
                color: AppColors.primary, size: 22),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.restaurantName!,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              Text(
                'ĐH: ${widget.tripId.substring(0, 8).toUpperCase()}',
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF6B7280),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSegment(String instruction, double distanceKm, int durationSec) {
    final minutes = (durationSec / 60).ceil();
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF374151)),
      ),
      child: Row(
        children: [
          Container(
            width: 32, height: 32,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.turn_right, color: AppColors.primary, size: 16),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              instruction,
              style: const TextStyle(fontSize: 13, color: Color(0xFFD1D5DB)),
            ),
          ),
          Text(
            '${distanceKm.toStringAsFixed(1)}km · ${minutes}ph',
            style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
          ),
        ],
      ),
    );
  }

  Widget _buildError(String error) {
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
              error,
              style: const TextStyle(color: Color(0xFFEF4444), fontSize: 14),
            ),
          ),
          TextButton(
            onPressed: () =>
                ref.read(tripRouteProvider.notifier).loadRoute(widget.tripId),
            child: const Text('Thử lại'),
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
            Icon(Icons.route, size: 56,
                color: const Color(0xFF6B7280).withValues(alpha: 0.4)),
            const SizedBox(height: 16),
            const Text(
              'Không có dữ liệu lộ trình',
              style: TextStyle(fontSize: 15, color: Color(0xFF6B7280)),
            ),
          ],
        ),
      ),
    );
  }
}
