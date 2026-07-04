import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/theme/app_colors.dart';
import '../providers/heatmap_provider.dart';
import '../widgets/heatmap_canvas.dart';
import '../../l10n/app_localizations.dart';

class HeatmapScreen extends ConsumerStatefulWidget {
  const HeatmapScreen({super.key});

  @override
  ConsumerState<HeatmapScreen> createState() => _HeatmapScreenState();
}

class _HeatmapScreenState extends ConsumerState<HeatmapScreen> {
  String _selectedWindow = 'now';
  HeatmapPoint? _selectedPoint;

  static const _windows = [
    ('now', 'Hiện tại'),
    ('1h', '1h tới'),
    ('3h', '3h tới'),
    ('today', 'Hôm nay'),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(heatmapProvider.notifier).loadHeatmap(10.8231, 106.6297);
    });
  }

  Color _demandColor(int level) => switch (level) {
    2 => const Color(0xFFEF4444),
    1 => const Color(0xFFF97316),
    _ => const Color(0xFF3B82F6),
  };

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(heatmapProvider);

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
          _buildWindowSelector(),
          Expanded(
            child: state.isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: AppColors.primary),
                  )
                : state.points.isEmpty
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
                            points: state.points,
                            centerLat: 10.8231,
                            centerLng: 106.6297,
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

  Widget _buildWindowSelector() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: _windows.map((w) {
          final isActive = _selectedWindow == w.$1;
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 3),
              child: GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedWindow = w.$1;
                    _selectedPoint = null;
                  });
                  ref
                      .read(heatmapProvider.notifier)
                      .setWindow(w.$1, 10.8231, 106.6297);
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
                    w.$2,
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
    final p = _selectedPoint!;
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
                color: _demandColor(p.demandLevel).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                Icons.location_on,
                color: _demandColor(p.demandLevel),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '${p.orderCount} đơn hàng',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    'Trung bình ${p.avgPayout.toStringAsFixed(0)}đ/đơn',
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
                color: _demandColor(p.demandLevel).withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                p.demandLevel == 2
                    ? 'Cao'
                    : p.demandLevel == 1
                    ? 'TB'
                    : 'Thấp',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: _demandColor(p.demandLevel),
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
          const Text(
            'Chưa có dữ liệu nhu cầu',
            style: TextStyle(fontSize: 16, color: Color(0xFF9CA3AF)),
          ),
          const SizedBox(height: 8),
          const Text(
            'Dữ liệu sẽ hiển thị khi có đơn hàng trong khu vực',
            style: TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
          ),
        ],
      ),
    );
  }
}
