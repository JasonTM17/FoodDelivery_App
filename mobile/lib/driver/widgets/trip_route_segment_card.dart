import 'package:flutter/material.dart';

import '../../shared/theme/app_colors.dart';
import '../providers/trip_route_provider.dart';

class TripRouteSegmentCard extends StatelessWidget {
  final RouteSegment segment;

  const TripRouteSegmentCard({super.key, required this.segment});

  @override
  Widget build(BuildContext context) {
    final minutes = (segment.durationSeconds / 60).ceil();

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
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(
              Icons.turn_right,
              color: AppColors.primary,
              size: 16,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              segment.instruction,
              style: const TextStyle(fontSize: 13, color: Color(0xFFD1D5DB)),
            ),
          ),
          Text(
            '${segment.distanceKm.toStringAsFixed(1)} km · $minutes min',
            style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
          ),
        ],
      ),
    );
  }
}
