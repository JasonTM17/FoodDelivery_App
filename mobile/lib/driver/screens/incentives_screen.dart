import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/theme/app_colors.dart';
import '../../l10n/app_localizations.dart';
import '../providers/incentives_provider.dart';
import '../widgets/incentive_list.dart';

class IncentivesScreen extends ConsumerStatefulWidget {
  const IncentivesScreen({super.key});

  @override
  ConsumerState<IncentivesScreen> createState() => _IncentivesScreenState();
}

class _IncentivesScreenState extends ConsumerState<IncentivesScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final incentives = ref.watch(driverIncentivesProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        title: Text(
          l10n.driver_incentives_title,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: const Color(0xFF6B7280),
          tabs: [
            Tab(text: l10n.driver_incentives_active),
            Tab(text: l10n.driver_incentives_completed),
          ],
        ),
      ),
      body: incentives.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppColors.primary),
        ),
        error: (_, __) => IncentiveErrorState(
          l10n: l10n,
          onRetry: () => ref.invalidate(driverIncentivesProvider),
        ),
        data: (data) => TabBarView(
          controller: _tabController,
          children: [
            IncentiveList(incentives: data.active, l10n: l10n),
            IncentiveList(incentives: data.completed, l10n: l10n),
          ],
        ),
      ),
    );
  }
}
