import 'package:flutter/material.dart';
import '../../shared/theme/app_colors.dart';

class DriverStatusChip extends StatelessWidget {
  final String? vehiclePlate;
  final int? rideNumber;

  const DriverStatusChip({
    super.key,
    this.vehiclePlate,
    this.rideNumber,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (vehiclePlate != null) ...[
          _PlateChip(plate: vehiclePlate!),
          const SizedBox(width: 8),
        ],
        if (rideNumber != null)
          _RideNumberBadge(number: rideNumber!),
      ],
    );
  }
}

class _PlateChip extends StatelessWidget {
  final String plate;
  const _PlateChip({required this.plate});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFF1F2937),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF374151)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.directions_bike, size: 14, color: Color(0xFF9CA3AF)),
          const SizedBox(width: 6),
          Text(
            plate,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Colors.white,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _RideNumberBadge extends StatelessWidget {
  final int number;
  const _RideNumberBadge({required this.number});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
      ),
      child: Text(
        '#$number',
        style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w700,
          color: AppColors.primary,
        ),
      ),
    );
  }
}
