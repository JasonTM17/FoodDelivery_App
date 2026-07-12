import 'dart:math';
import 'package:flutter/material.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';
import '../providers/earnings_chart_provider.dart';

class EarningsDailyBarChart extends StatelessWidget {
  final List<DailyEarning> byDay;
  final int maxAmount;

  const EarningsDailyBarChart({
    super.key,
    required this.byDay,
    this.maxAmount = 0,
  });

  @override
  Widget build(BuildContext context) {
    if (byDay.isEmpty) return const SizedBox.shrink();
    final l10n = AppLocalizations.of(context);
    final effectiveMax = maxAmount > 0
        ? maxAmount
        : byDay.map((d) => d.amount).reduce(max);
    final chartHeight = 180.0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.bar_chart, color: AppColors.primary, size: 18),
              const SizedBox(width: 8),
              Text(
                l10n.driverEarningsDaily,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  l10n.driverDaysCount(byDay.length),
                  style: TextStyle(
                    fontSize: 11,
                    color: AppColors.primary,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: chartHeight,
            child: CustomPaint(
              size: const Size(double.infinity, double.infinity),
              painter: _BarChartPainter(byDay: byDay, maxAmount: effectiveMax),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: byDay.map((d) {
              return Text(
                '${d.date.day}/${d.date.month}',
                style: const TextStyle(fontSize: 9, color: Color(0xFF6B7280)),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _BarChartPainter extends CustomPainter {
  final List<DailyEarning> byDay;
  final int maxAmount;

  _BarChartPainter({required this.byDay, required this.maxAmount});

  @override
  void paint(Canvas canvas, Size size) {
    if (byDay.isEmpty) return;

    final barWidth = (size.width / byDay.length) * 0.7;
    final gap = size.width / byDay.length;
    final paint = Paint()..style = PaintingStyle.fill;
    final gridPaint = Paint()
      ..color = const Color(0xFF374151)
      ..strokeWidth = 0.5;

    for (int i = 0; i <= 4; i++) {
      final y = size.height * i / 4;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), gridPaint);
    }

    for (int i = 0; i < byDay.length; i++) {
      final ratio = maxAmount > 0 ? byDay[i].amount / maxAmount : 0.0;
      final barHeight = ratio.clamp(0.02, 1.0) * size.height;
      final x = i * gap + (gap - barWidth) / 2;
      final y = size.height - barHeight;

      final rect = RRect.fromRectAndRadius(
        Rect.fromLTWH(x, y, barWidth, barHeight),
        const Radius.circular(3),
      );

      final gradient = LinearGradient(
        colors: [AppColors.primary, AppColors.primary.withValues(alpha: 0.5)],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      );

      paint.shader = gradient.createShader(
        Rect.fromLTWH(0, y, size.width, barHeight),
      );

      canvas.drawRRect(rect, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _BarChartPainter oldDelegate) =>
      byDay != oldDelegate.byDay || maxAmount != oldDelegate.maxAmount;
}
