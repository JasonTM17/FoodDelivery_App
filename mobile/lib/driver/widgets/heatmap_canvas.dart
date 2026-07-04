import 'package:flutter/material.dart';
import '../providers/heatmap_provider.dart';

class HeatmapCanvas extends StatelessWidget {
  final List<HeatmapPoint> points;
  final double centerLat;
  final double centerLng;
  final ValueChanged<HeatmapPoint>? onPointTap;

  const HeatmapCanvas({
    super.key,
    required this.points,
    required this.centerLat,
    required this.centerLng,
    this.onPointTap,
  });

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return GestureDetector(
          onTapDown: (details) {
            if (onPointTap == null || points.isEmpty) return;
            final nearest = _findNearest(details.localPosition, constraints);
            if (nearest != null) onPointTap!(nearest);
          },
          child: CustomPaint(
            size: Size(constraints.maxWidth, constraints.maxHeight),
            painter: _HeatmapPainter(
              points: points,
              centerLat: centerLat,
              centerLng: centerLng,
            ),
          ),
        );
      },
    );
  }

  HeatmapPoint? _findNearest(Offset tap, BoxConstraints constraints) {
    HeatmapPoint? nearest;
    double minDist = double.infinity;
    final latRange = 0.06;
    final lngRange = 0.06;
    for (final p in points) {
      final dx =
          ((p.lng - centerLng + lngRange / 2) / lngRange) *
          constraints.maxWidth;
      final dy =
          ((centerLat + latRange / 2 - p.lat) / latRange) *
          constraints.maxHeight;
      final dist = (dx - tap.dx).abs() + (dy - tap.dy).abs();
      if (dist < minDist && dist < 40) {
        minDist = dist;
        nearest = p;
      }
    }
    return nearest;
  }
}

class _HeatmapPainter extends CustomPainter {
  final List<HeatmapPoint> points;
  final double centerLat;
  final double centerLng;

  _HeatmapPainter({
    required this.points,
    required this.centerLat,
    required this.centerLng,
  });

  static const _lowColor = Color(0xFF3B82F6);
  static const _medColor = Color(0xFFF97316);
  static const _highColor = Color(0xFFEF4444);

  @override
  void paint(Canvas canvas, Size size) {
    if (points.isEmpty) return;
    final latRange = 0.06;
    final lngRange = 0.06;

    for (final point in points) {
      final x =
          ((point.lng - centerLng + lngRange / 2) / lngRange) * size.width;
      final y =
          ((centerLat + latRange / 2 - point.lat) / latRange) * size.height;
      final radius = 8.0 + point.demandLevel * 6.0;
      final color = point.demandLevel == 2
          ? _highColor
          : point.demandLevel == 1
          ? _medColor
          : _lowColor;
      final paint = Paint()
        ..shader = RadialGradient(
          colors: [color.withValues(alpha: 0.8), color.withValues(alpha: 0.0)],
        ).createShader(Rect.fromCircle(center: Offset(x, y), radius: radius))
        ..style = PaintingStyle.fill;
      canvas.drawCircle(Offset(x, y), radius, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _HeatmapPainter oldDelegate) =>
      points != oldDelegate.points;
}
