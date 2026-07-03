import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';
import '../providers/earnings_chart_provider.dart';
import 'earnings_daily_bar_chart.dart';

class EarningsChartSection extends ConsumerWidget {
  const EarningsChartSection({super.key, required this.l10n});

  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chartState = ref.watch(earningsChartProvider);
    if (chartState.isLoading) {
      return const Padding(
        padding: EdgeInsets.all(24),
        child: Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
      );
    }
    if (chartState.error != null) {
      return _ChartErrorState(l10n: l10n, chartState: chartState);
    }
    if (chartState.summary == null || chartState.summary!.byDay.isEmpty) {
      return const SizedBox.shrink();
    }
    return EarningsDailyBarChart(
      byDay: chartState.summary!.byDay,
      maxAmount: chartState.summary!.totalVnd,
    );
  }
}

class _ChartErrorState extends ConsumerWidget {
  const _ChartErrorState({required this.l10n, required this.chartState});

  final AppLocalizations l10n;
  final EarningsChartState chartState;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          const Icon(Icons.bar_chart_outlined, color: Color(0xFF6B7280)),
          const SizedBox(height: 8),
          Text(
            l10n.driverEarningsChartError,
            style: const TextStyle(color: Color(0xFF9CA3AF)),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () => ref
                .read(earningsChartProvider.notifier)
                .load(chartState.selectedPeriod),
            child: Text(l10n.driverEarningsChartRetry),
          ),
        ],
      ),
    );
  }
}
