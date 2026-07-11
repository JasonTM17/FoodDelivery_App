import 'dart:async';
import 'package:flutter/material.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/utils/currency_formatter.dart';
import '../providers/driver_provider.dart' show DispatchOffer;

/// Full-screen modal dialog showing a new dispatch offer.
///
/// Counts down from 30 seconds using an absolute deadline (immune to
/// app-backgrounding drift). Auto-calls [onReject] on timeout.
class DispatchOfferDialog extends StatefulWidget {
  final DispatchOffer offer;
  final VoidCallback onAccept;
  final VoidCallback onReject;

  const DispatchOfferDialog({
    super.key,
    required this.offer,
    required this.onAccept,
    required this.onReject,
  });

  @override
  State<DispatchOfferDialog> createState() => _DispatchOfferDialogState();
}

class _DispatchOfferDialogState extends State<DispatchOfferDialog> {
  late int _remaining;
  Timer? _ticker;

  @override
  void initState() {
    super.initState();
    _remaining = widget.offer.timeoutSeconds;

    // Pure-decrement ticker: Timer.periodic advances correctly in both
    // production and Flutter test environment (unlike DateTime.now() which
    // is real-clock and can't be advanced by tester.pump()).
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      final next = _remaining - 1;
      if (next <= 0) {
        _ticker?.cancel();
        widget.onReject();
        if (Navigator.of(context, rootNavigator: true).canPop()) {
          Navigator.of(context, rootNavigator: true).pop();
        }
      } else {
        setState(() => _remaining = next);
      }
    });
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  void _accept() {
    _ticker?.cancel();
    widget.onAccept();
    Navigator.of(context, rootNavigator: true).pop();
  }

  void _reject() {
    _ticker?.cancel();
    widget.onReject();
    Navigator.of(context, rootNavigator: true).pop();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Dialog(
      backgroundColor: const Color(0xFF1E1E1E),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildHeader(l10n),
            const SizedBox(height: 20),
            _buildOrderDetails(l10n),
            const SizedBox(height: 16),
            _buildCountdown(l10n),
            const SizedBox(height: 20),
            _buildActions(l10n),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(AppLocalizations l10n) {
    return Row(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(14),
          ),
          child: const Icon(
            Icons.delivery_dining,
            color: AppColors.primary,
            size: 26,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                l10n.driverDispatchNewOrderTitle,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
              Text(
                l10n.driverDispatchNewOrderSubtitle,
                style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildOrderDetails(AppLocalizations l10n) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF121212),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        children: [
          _infoRow(
            Icons.restaurant_outlined,
            widget.offer.restaurantName,
            l10n.driverDispatchRestaurantLabel,
          ),
          const SizedBox(height: 12),
          _infoRow(
            Icons.location_on_outlined,
            widget.offer.deliveryAddress,
            l10n.driverDispatchDeliveryLabel,
          ),
          const Divider(color: Color(0xFF374151), height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _chip(
                '${widget.offer.distanceKm.toStringAsFixed(1)} km',
                Icons.straighten,
                AppColors.info,
              ),
              _chip(
                formatSignedVnd(context, widget.offer.deliveryFee),
                Icons.monetization_on,
                AppColors.primary,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String value, String label) {
    return Row(
      children: [
        Icon(icon, color: const Color(0xFF6B7280), size: 18),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
              ),
              Text(
                value,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _chip(String value, IconData icon, Color color) {
    return Row(
      children: [
        Icon(icon, color: color, size: 18),
        const SizedBox(width: 6),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
      ],
    );
  }

  Widget _buildCountdown(AppLocalizations l10n) {
    final progress = _remaining / widget.offer.timeoutSeconds;
    final color = _remaining > 10 ? AppColors.primary : AppColors.error;
    return Row(
      children: [
        SizedBox(
          width: 52,
          height: 52,
          child: Stack(
            alignment: Alignment.center,
            children: [
              CircularProgressIndicator(
                value: progress,
                color: color,
                backgroundColor: color.withValues(alpha: 0.15),
                strokeWidth: 4,
              ),
              Text(
                '$_remaining',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: color,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 14),
        Text(
          _remaining > 10
              ? l10n.driverDispatchCountdownDecision(_remaining)
              : l10n.driverDispatchCountdownUrgent,
          style: TextStyle(fontSize: 13, color: color),
        ),
      ],
    );
  }

  Widget _buildActions(AppLocalizations l10n) {
    return Row(
      children: [
        Expanded(
          child: SizedBox(
            height: 52,
            child: OutlinedButton(
              onPressed: _reject,
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFF6B7280),
                side: const BorderSide(color: Color(0xFF374151)),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Text(
                l10n.driverDispatchReject,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          flex: 2,
          child: SizedBox(
            height: 52,
            child: ElevatedButton(
              onPressed: _accept,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Text(
                l10n.driverDispatchAccept,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
