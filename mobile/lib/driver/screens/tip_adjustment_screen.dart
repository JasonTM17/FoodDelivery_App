import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';
import '../providers/tip_provider.dart';
import '../widgets/tip_amount_picker.dart';

class TipAdjustmentScreen extends ConsumerStatefulWidget {
  final String tripId;
  final String restaurantName;
  final String customerName;

  const TipAdjustmentScreen({
    super.key,
    required this.tripId,
    required this.restaurantName,
    required this.customerName,
  });

  @override
  ConsumerState<TipAdjustmentScreen> createState() => _TipAdjustmentScreenState();
}

class _TipAdjustmentScreenState extends ConsumerState<TipAdjustmentScreen> {
  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final tipState = ref.watch(tipProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        title: Text(
          l10n.driver_tip_title,
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _TipHeader(
                title: l10n.driver_tip_header_title,
                restaurantName: widget.restaurantName,
                customerName: widget.customerName,
              ),
              const SizedBox(height: 24),
              const TipAmountPicker(),
              const SizedBox(height: 32),
              _buildActions(l10n),
              if (tipState.isSubmitting) ...[
                const SizedBox(height: 16),
                const LinearProgressIndicator(
                  color: AppColors.primary,
                  backgroundColor: Color(0xFF374151),
                ),
              ],
              if (tipState.error != null) ...[
                const SizedBox(height: 16),
                _TipStatusCard(
                  icon: Icons.error_outline,
                  color: const Color(0xFFF87171),
                  message: tipState.error!,
                ),
              ],
              if (tipState.isSubmitted) ...[
                const SizedBox(height: 16),
                _TipStatusCard(
                  icon: Icons.check_circle,
                  color: AppColors.primary,
                  message: l10n.driver_tip_success_message,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActions(AppLocalizations l10n) {
    final tipState = ref.watch(tipProvider);
    final effective = ref.read(tipProvider.notifier).effectiveAmount;

    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: tipState.isSubmitting ? null : () => Navigator.of(context).pop(false),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF6B7280),
              side: const BorderSide(color: Color(0xFF374151)),
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: Text(l10n.driver_tip_skip),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton(
            onPressed: (tipState.isSubmitting || effective <= 0)
                ? null
                : () async {
                    final success = await ref.read(tipProvider.notifier).submitTip(widget.tripId);
                    if (mounted && success) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text(l10n.driver_tip_success_snackbar)),
                      );
                    }
                  },
            child: effective > 0
                ? Text('${l10n.driver_tip_confirm} ${effective.toStringAsFixed(0)}đ')
                : Text(l10n.driver_tip_confirm),
          ),
        ),
      ],
    );
  }
}

class _TipHeader extends StatelessWidget {
  final String title;
  final String restaurantName;
  final String customerName;

  const _TipHeader({
    required this.title,
    required this.restaurantName,
    required this.customerName,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF374151)),
      ),
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(Icons.card_giftcard, color: Color(0xFFF59E0B), size: 32),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${l10n.driver_tip_order_prefix} $restaurantName · ${l10n.driver_tip_customer_prefix} $customerName',
            style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _TipStatusCard extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String message;

  const _TipStatusCard({
    required this.icon,
    required this.color,
    required this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                color: color,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
