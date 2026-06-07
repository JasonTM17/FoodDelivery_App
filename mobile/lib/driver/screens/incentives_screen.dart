import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/theme/app_colors.dart';
import '../../l10n/app_localizations.dart';

// Stub model — replaced when backend incentive API is ready
class _Incentive {
  final String title;
  final int current;
  final int target;
  final String reward;
  final String expires;
  final bool completed;

  const _Incentive({
    required this.title,
    required this.current,
    required this.target,
    required this.reward,
    required this.expires,
    this.completed = false,
  });
}

const _stubActive = [
  _Incentive(
    title: 'Giao 20 đơn trong tuần',
    current: 12,
    target: 20,
    reward: '150,000đ',
    expires: '12/06/2026',
  ),
  _Incentive(
    title: 'Duy trì 5 sao liên tiếp (10 đơn)',
    current: 7,
    target: 10,
    reward: '80,000đ',
    expires: '10/06/2026',
  ),
];

const _stubCompleted = [
  _Incentive(
    title: 'Giao 50 đơn tháng 5',
    current: 50,
    target: 50,
    reward: '500,000đ',
    expires: '31/05/2026',
    completed: true,
  ),
];

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
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        title: Text(
          l10n.driver_incentives_title,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
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
      body: TabBarView(
        controller: _tabController,
        children: [
          _IncentiveList(incentives: _stubActive, l10n: l10n),
          _IncentiveList(incentives: _stubCompleted, l10n: l10n),
        ],
      ),
    );
  }
}

class _IncentiveList extends StatelessWidget {
  const _IncentiveList({required this.incentives, required this.l10n});

  final List<_Incentive> incentives;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    if (incentives.isEmpty) {
      return Center(
        child: Text(
          l10n.driver_incentives_empty,
          style: const TextStyle(color: Color(0xFF6B7280)),
        ),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: incentives.length,
      itemBuilder: (_, i) => _IncentiveCard(item: incentives[i], l10n: l10n),
    );
  }
}

class _IncentiveCard extends StatelessWidget {
  const _IncentiveCard({required this.item, required this.l10n});

  final _Incentive item;
  final AppLocalizations l10n;

  @override
  Widget build(BuildContext context) {
    final progress = item.current / item.target;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF374151)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  item.title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                ),
              ),
              if (item.completed)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.green.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    '✓',
                    style: TextStyle(color: Colors.green, fontSize: 12),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress.clamp(0.0, 1.0),
              backgroundColor: const Color(0xFF374151),
              valueColor: AlwaysStoppedAnimation<Color>(
                item.completed ? Colors.green : AppColors.primary,
              ),
              minHeight: 6,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                l10n.driver_incentives_progress(item.current, item.target),
                style: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 12),
              ),
              Text(
                l10n.driver_incentives_reward(item.reward),
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            l10n.driver_incentives_expires(item.expires),
            style: const TextStyle(color: Color(0xFF6B7280), fontSize: 11),
          ),
        ],
      ),
    );
  }
}
