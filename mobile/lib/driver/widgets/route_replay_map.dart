import 'package:flutter/material.dart';
import '../../shared/theme/app_colors.dart';

class RouteReplayMap extends StatefulWidget {
  final List<RoutePointData> points;
  final double fromLat;
  final double fromLng;
  final double toLat;
  final double toLng;
  final double width;
  final double height;

  const RouteReplayMap({
    super.key,
    required this.points,
    required this.fromLat,
    required this.fromLng,
    required this.toLat,
    required this.toLng,
    this.width = double.infinity,
    this.height = 280,
  });

  @override
  State<RouteReplayMap> createState() => _RouteReplayMapState();
}

class RoutePointData {
  final double lat;
  final double lng;

  const RoutePointData({required this.lat, required this.lng});
}

class _RouteReplayMapState extends State<RouteReplayMap>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(seconds: 8),
      vsync: this,
    );
    _animation = CurvedAnimation(parent: _controller, curve: Curves.easeInOut);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _toggleReplay() {
    if (_controller.isAnimating) {
      _controller.stop();
    } else if (_controller.isCompleted) {
      _controller.reset();
    }
    if (_controller.isCompleted || _controller.isDismissed) {
      _controller.forward();
    } else {
      _controller.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            color: const Color(0xFF1E1E1E),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF374151)),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: AnimatedBuilder(
              animation: _animation,
              builder: (context, _) {
                return CustomPaint(
                  size: Size(widget.width, widget.height),
                  painter: _RoutePainter(
                    points: widget.points,
                    progress: _animation.value,
                    fromLat: widget.fromLat,
                    fromLng: widget.fromLng,
                    toLat: widget.toLat,
                    toLng: widget.toLng,
                  ),
                );
              },
            ),
          ),
        ),
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: IconButton(
                icon: Icon(
                  _controller.isAnimating
                      ? Icons.pause
                      : _controller.isDismissed
                          ? Icons.play_arrow
                          : Icons.replay,
                  color: AppColors.primary,
                ),
                onPressed: _toggleReplay,
                tooltip: 'Phát lại lộ trình',
              ),
            ),
            const SizedBox(width: 12),
            Text(
              _controller.isAnimating
                  ? 'Đang phát...'
                  : _controller.isDismissed
                      ? 'Nhấn để phát lại'
                      : 'Đã phát xong',
              style: const TextStyle(
                fontSize: 13,
                color: Color(0xFF9CA3AF),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _RoutePainter extends CustomPainter {
  final List<RoutePointData> points;
  final double progress;
  final double fromLat;
  final double fromLng;
  final double toLat;
  final double toLng;

  _RoutePainter({
    required this.points,
    required this.progress,
    required this.fromLat,
    required this.fromLng,
    required this.toLat,
    required this.toLng,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (points.isEmpty) return;

    final padding = 30.0;
    final drawWidth = size.width - padding * 2;
    final drawHeight = size.height - padding * 2;
    final latRange = (toLat - fromLat).abs().clamp(0.001, 0.1);
    final lngRange = (toLng - fromLng).abs().clamp(0.001, 0.1);

    Offset toDraw(double lat, double lng) {
      final x = padding + ((lng - fromLng) / lngRange) * drawWidth;
      final y = padding + ((toLat - lat) / latRange) * drawHeight;
      return Offset(x, y);
    }

    // Path
    final pathPaint = Paint()
      ..color = const Color(0xFF3B82F6)
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;

    final path = Path();
    final animatedCount = (points.length * progress).ceil().clamp(0, points.length);
    for (int i = 0; i < animatedCount; i++) {
      final pt = toDraw(points[i].lat, points[i].lng);
      if (i == 0) {
        path.moveTo(pt.dx, pt.dy);
      } else {
        path.lineTo(pt.dx, pt.dy);
      }
    }
    canvas.drawPath(path, pathPaint);

    // Pickup pin (green dot)
    if (points.isNotEmpty) {
      final pickupPt = toDraw(points.first.lat, points.first.lng);
      canvas.drawCircle(pickupPt, 6, Paint()..color = AppColors.primary);
      final pickupBorder = Paint()
        ..color = Colors.white
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2;
      canvas.drawCircle(pickupPt, 6, pickupBorder);
    }

    // Delivery pin (orange dot)
    if (points.isNotEmpty) {
      final deliveryPt = toDraw(points.last.lat, points.last.lng);
      canvas.drawCircle(
          deliveryPt, 6, Paint()..color = const Color(0xFFF97316));
      final deliveryBorder = Paint()
        ..color = Colors.white
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2;
      canvas.drawCircle(deliveryPt, 6, deliveryBorder);
    }

    // Animated marker at current position
    if (animatedCount > 0 && animatedCount <= points.length) {
      final idx = (animatedCount - 1).clamp(0, points.length - 1);
      final currentPt = toDraw(points[idx].lat, points[idx].lng);
      canvas.drawCircle(
          currentPt, 8, Paint()..color = const Color(0xFF3B82F6));
      final markerBorder = Paint()
        ..color = Colors.white
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2;
      canvas.drawCircle(currentPt, 8, markerBorder);
    }
  }

  @override
  bool shouldRepaint(covariant _RoutePainter oldDelegate) =>
      progress != oldDelegate.progress || points != oldDelegate.points;
}
