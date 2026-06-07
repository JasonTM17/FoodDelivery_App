import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/theme/app_colors.dart';
import '../../l10n/app_localizations.dart';

// TODO: backend metric API — replace stub grid with real zone demand data
class HeatmapScreen extends ConsumerWidget {
  const HeatmapScreen({super.key});

  // Stub 6x8 demand grid: 0=low, 1=medium, 2=high
  static const _grid = [
    [0, 1, 2, 2, 1, 0, 0, 1],
    [0, 1, 2, 2, 2, 1, 0, 0],
    [1, 2, 2, 1, 1, 2, 1, 0],
    [1, 1, 2, 2, 1, 1, 2, 1],
    [0, 0, 1, 2, 2, 1, 1, 0],
    [0, 0, 0, 1, 2, 2, 1, 0],
  ];

  static const _highColor = Color(0xFFEF4444);
  static const _medColor = Color(0xFFF97316);
  static const _lowColor = Color(0xFF374151);

  Color _cellColor(int level) => switch (level) {
        2 => Color.fromRGBO(
            _highColor.r.toInt(), _highColor.g.toInt(), _highColor.b.toInt(), 0.7),
        1 => Color.fromRGBO(
            _medColor.r.toInt(), _medColor.g.toInt(), _medColor.b.toInt(), 0.5),
        _ => _lowColor,
      };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        title: Text(
          l10n.driver_heatmap_title,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.driver_heatmap_subtitle,
              style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 14),
            ),
            const SizedBox(height: 20),
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF1E1E1E),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF374151)),
                ),
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    for (final row in _grid)
                      Expanded(
                        child: Row(
                          children: [
                            for (final cell in row)
                              Expanded(
                                child: Container(
                                  margin: const EdgeInsets.all(2),
                                  decoration: BoxDecoration(
                                    color: _cellColor(cell),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              l10n.driver_heatmap_legend,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 10),
            _LegendRow(
              color: _highColor.withValues(alpha: 0.7),
              label: l10n.driver_heatmap_high,
            ),
            const SizedBox(height: 6),
            _LegendRow(
              color: _medColor.withValues(alpha: 0.5),
              label: l10n.driver_heatmap_medium,
            ),
            const SizedBox(height: 6),
            _LegendRow(color: _lowColor, label: l10n.driver_heatmap_low),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}

class _LegendRow extends StatelessWidget {
  const _LegendRow({required this.color, required this.label});

  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 22,
          height: 22,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(width: 10),
        Text(label, style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 13)),
      ],
    );
  }
}
