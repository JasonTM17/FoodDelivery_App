import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../l10n/app_localizations.dart';
import '../../shared/maps/lat_lng_validation.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/utils/currency_formatter.dart';
import '../providers/driver_provider.dart';
import '../providers/heatmap_provider.dart';
import '../widgets/heatmap_canvas.dart';

class HeatmapScreen extends ConsumerStatefulWidget {
  const HeatmapScreen({super.key});

  @override
  ConsumerState<HeatmapScreen> createState() => _HeatmapScreenState();
}

class _HeatmapScreenState extends ConsumerState<HeatmapScreen> {
  String _selectedWindow = 'now';
  HeatmapPoint? _selectedPoint;
  String _lastHeatmapSignature = '';

  Color _demandColor(int level) => switch (level) {
    2 => const Color(0xFFEF4444),
    1 => const Color(0xFFF97316),
    _ => const Color(0xFF3B82F6),
  };

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final heatmapState = ref.watch(heatmapProvider);
    final driverState = ref.watch(driverProvider);
    final centerLat = driverState.currentLat;
    final centerLng = driverState.currentLng;
    final hasDriverLocation = isValidDeliveryLatLng(centerLat, centerLng);

    if (hasDriverLocation) {
      _scheduleHeatmapLoad(centerLat!, centerLng!);
    }

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        title: Text(
          l10n.driver_heatmap_title,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: Column(
        children: [
          _buildWindowSelector(l10n, centerLat, centerLng),
          Expanded(
            child: !hasDriverLocation
                ? _buildMissingLocationState(l10n)
                : heatmapState.isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: AppColors.primary),
                  )
                : heatmapState.points.isEmpty
                ? _buildEmptyState(l10n)
                : Stack(
                    children: [
                      Container(
                        margin: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E1E1E),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFF374151)),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: HeatmapCanvas(
                            points: heatmapState.points,
                            centerLat: centerLat!,
                            centerLng: centerLng!,
                            onPointTap: (point) {
                              setState(() => _selectedPoint = point);
                            },
                          ),
                        ),
                      ),
                      if (_selectedPoint != null)
                        Positioned(
                          bottom: 16,
                          left: 16,
                          right: 16,
                          child: _buildPointDetail(),
                        ),
                    ],
                  ),
          ),
          _buildLegend(l10n),
        ],
      ),
    );
  }

  void _scheduleHeatmapLoad(double lat, double lng) {
    final signature =
        '${lat.toStringAsFixed(5)}|${lng.toStringAsFixed(5)}|$_selectedWindow';
    if (signature == _lastHeatmapSignature) return;
    _lastHeatmapSignature = signature;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      ref
          .read(heatmapProvider.notifier)
          .loadHeatmap(lat, lng, window: _selectedWindow);
    });
  }

  List<(String, String)> _windows(AppLocalizations l10n) => [
    ('now', l10n.driver_heatmap_window_now),
    ('1h', l10n.driver_heatmap_window_next_hour),
    ('3h', l10n.driver_heatmap_window_next_three_hours),
    ('today', l10n.driver_heatmap_window_today),
  ];

  Widget _buildWindowSelector(
    AppLocalizations l10n,
    double? centerLat,
    double? centerLng,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: _windows(l10n).map((window) {
          final isActive = _selectedWindow == window.$1;
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 3),
              child: GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedWindow = window.$1;
                    _selectedPoint = null;
                  });
                  if (isValidDeliveryLatLng(centerLat, centerLng)) {
                    ref
                        .read(heatmapProvider.notifier)
                        .setWindow(window.$1, centerLat!, centerLng!);
                    _lastHeatmapSignature =
                        '${centerLat.toStringAsFixed(5)}|${centerLng.toStringAsFixed(5)}|${window.$1}';
                  }
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: isActive
                        ? AppColors.primary.withValues(alpha: 0.15)
                        : const Color(0xFF1E1E1E),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isActive
                          ? AppColors.primary
                          : const Color(0xFF374151),
                    ),
                  ),
                  child: Text(
                    window.$2,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: isActive
                          ? AppColors.primary
                          : const Color(0xFF6B7280),
                    ),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildPointDetail() {
    final l10n = AppLocalizations.of(context);
    final point = _selectedPoint!;
    return GestureDetector(
      onTap: () => setState(() => _selectedPoint = null),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1E1E1E),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.3),
              blurRadius: 12,
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: _demandColor(point.demandLevel).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                Icons.location_on,
                color: _demandColor(point.demandLevel),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    l10n.driver_heatmap_order_count(point.orderCount),
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    l10n.driver_heatmap_avg_payout(
                      formatVnd(context, point.avgPayout),
                    ),
                    style: const TextStyle(
                      fontSize: 13,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: _demandColor(point.demandLevel).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                point.demandLevel == 2
                    ? l10n.driver_heatmap_high
                    : point.demandLevel == 1
                    ? l10n.driver_heatmap_medium
                    : l10n.driver_heatmap_low,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: _demandColor(point.demandLevel),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLegend(AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _legendItem(const Color(0xFF3B82F6), l10n.driver_heatmap_low),
          const SizedBox(width: 20),
          _legendItem(const Color(0xFFF97316), l10n.driver_heatmap_medium),
          const SizedBox(width: 20),
          _legendItem(const Color(0xFFEF4444), l10n.driver_heatmap_high),
        ],
      ),
    );
  }

  Widget _legendItem(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 14,
          height: 14,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: Color(0xFF9CA3AF)),
        ),
      ],
    );
  }

  Widget _buildEmptyState(AppLocalizations l10n) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.map_outlined,
            size: 64,
            color: const Color(0xFF6B7280).withValues(alpha: 0.5),
          ),
          const SizedBox(height: 16),
          Text(
            l10n.driver_heatmap_empty_title,
            style: const TextStyle(fontSize: 16, color: Color(0xFF9CA3AF)),
          ),
          const SizedBox(height: 8),
          Text(
            l10n.driver_heatmap_empty_description,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
          ),
        ],
      ),
    );
  }

  Widget _buildMissingLocationState(AppLocalizations l10n) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.my_location_outlined,
              size: 64,
              color: const Color(0xFF6B7280).withValues(alpha: 0.5),
            ),
            const SizedBox(height: 16),
            Text(
              l10n.driver_heatmap_missing_location_title,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 16, color: Color(0xFF9CA3AF)),
            ),
            const SizedBox(height: 8),
            Text(
              l10n.driver_heatmap_missing_location_description,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
            ),
          ],
        ),
      ),
    );
  }
}
