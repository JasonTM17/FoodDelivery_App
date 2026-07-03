import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../providers/driver_provider.dart';
import '../providers/earnings_chart_provider.dart';
import '../widgets/earnings_chart_section.dart';
import '../widgets/earnings_history_list.dart';
import '../widgets/earnings_kpi_cards.dart';

class EarningsScreen extends ConsumerStatefulWidget {
  const EarningsScreen({super.key});

  @override
  ConsumerState<EarningsScreen> createState() => _EarningsScreenState();
}

class _EarningsScreenState extends ConsumerState<EarningsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  static const _periods = ['today', 'week', 'month'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(_onTabChanged);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(driverProvider.notifier).fetchEarnings('today');
      ref.read(earningsChartProvider.notifier).load(EarningsPeriod.sevenDays);
    });
  }

  void _onTabChanged() {
    if (!_tabController.indexIsChanging) {
      ref
          .read(driverProvider.notifier)
          .fetchEarnings(_periods[_tabController.index]);
    }
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(driverProvider);
    final earnings = state.earnings;

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        title: Text(
          l10n.driverEarningsTitle,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          indicatorSize: TabBarIndicatorSize.tab,
          labelColor: AppColors.primary,
          unselectedLabelColor: const Color(0xFF6B7280),
          labelStyle: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
          tabs: [
            Tab(text: l10n.driverEarningsPeriodToday),
            Tab(text: l10n.driverEarningsPeriodWeek),
            Tab(text: l10n.driverEarningsPeriodMonth),
          ],
        ),
      ),
      body: state.isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (earnings != null) ...[
                    EarningsKpiCards(earnings: earnings, l10n: l10n),
                    const SizedBox(height: 16),
                  ],
                  EarningsChartSection(l10n: l10n),
                  const SizedBox(height: 24),
                  Text(
                    l10n.driverEarningsHistory,
                    style: AppTextStyles.headline4.copyWith(
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 12),
                  EarningsHistoryList(earnings: earnings, l10n: l10n),
                ],
              ),
            ),
    );
  }
}
