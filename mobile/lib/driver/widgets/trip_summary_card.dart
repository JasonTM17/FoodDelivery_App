import 'package:flutter/material.dart';
import '../../shared/theme/app_colors.dart';

class TripSummaryCard extends StatelessWidget {
  final double distanceKm;
  final int durationSeconds;
  final double avgSpeedKmh;
  final double payout;
  final int? rating;
  final String? tipNote;

  const TripSummaryCard({
    super.key,
    required this.distanceKm,
    required this.durationSeconds,
    required this.avgSpeedKmh,
    required this.payout,
    this.rating,
    this.tipNote,
  });

  @override
  Widget build(BuildContext context) {
    final minutes = (durationSeconds / 60).ceil();
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF374151)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Chi tiết chuyến đi',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _buildStat('Khoảng cách', '${distanceKm.toStringAsFixed(1)} km', Icons.route)),
              Expanded(child: _buildStat('Thời gian', '$minutes phút', Icons.timer)),
              Expanded(child: _buildStat('Tốc độ TB', '${avgSpeedKmh.toStringAsFixed(1)} km/h', Icons.speed)),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                const Icon(Icons.monetization_on, color: AppColors.primary, size: 20),
                const SizedBox(width: 10),
                const Text(
                  'Thu nhập',
                  style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
                ),
                const Spacer(),
                Text(
                  '${payout.toStringAsFixed(0)}đ',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
          if (rating != null) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                ...List.generate(5, (i) => Icon(
                  i < rating! ? Icons.star : Icons.star_border,
                  size: 16,
                  color: i < rating! ? const Color(0xFFF59E0B) : const Color(0xFF4B5563),
                )),
                const SizedBox(width: 8),
                const Text(
                  'Đánh giá từ khách',
                  style: TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
                ),
              ],
            ),
          ],
          if (tipNote != null && tipNote!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF3E0).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.card_giftcard, color: Color(0xFFF59E0B), size: 18),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      tipNote!,
                      style: const TextStyle(
                        fontSize: 13,
                        color: Color(0xFFF59E0B),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStat(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: const Color(0xFF6B7280), size: 20),
        const SizedBox(height: 6),
        Text(
          value,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
        ),
      ],
    );
  }
}
