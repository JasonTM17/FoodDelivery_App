import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../models/driver_flow_args.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';

class PickupConfirmationScreen extends StatefulWidget {
  final PickupConfirmationArgs? args;

  const PickupConfirmationScreen({super.key, this.args});

  @override
  State<PickupConfirmationScreen> createState() =>
      _PickupConfirmationScreenState();
}

class _PickupConfirmationScreenState extends State<PickupConfirmationScreen> {
  late List<bool> _checked;

  @override
  void initState() {
    super.initState();
    _checked = List.filled(widget.args?.items.length ?? 0, false);
  }

  @override
  void didUpdateWidget(covariant PickupConfirmationScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.args?.items.length != widget.args?.items.length) {
      _checked = List.filled(widget.args?.items.length ?? 0, false);
    }
  }

  bool get _allChecked => _checked.isNotEmpty && _checked.every((c) => c);

  @override
  Widget build(BuildContext context) {
    final args = widget.args;
    final l10n = AppLocalizations.of(context);
    if (args == null || !args.hasPickupData) {
      return _buildMissingOrderState(context, l10n);
    }

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: Text(
          l10n.driverPickupTitle,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.driverNavItemsToPickup,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 12),
                    ...List.generate(
                      args.items.length,
                      (i) => _itemTile(args.items[i], i),
                    ),
                    const SizedBox(height: 20),
                    _restaurantNote(l10n, args.restaurantNote),
                    if (args.restaurantNote != null) const SizedBox(height: 12),
                    if (!_allChecked) _hintCard(l10n),
                  ],
                ),
              ),
            ),
            _bottomBar(context, l10n),
          ],
        ),
      ),
    );
  }

  Widget _buildMissingOrderState(BuildContext context, AppLocalizations l10n) {
    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: Text(
          l10n.driverPickupTitle,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: Center(
        key: const Key('pickup-confirmation-missing-state'),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.inventory_2_outlined,
                size: 48,
                color: Color(0xFF6B7280),
              ),
              const SizedBox(height: 12),
              Text(
                l10n.driverPickupMissingTitle,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                l10n.driverPickupMissingDescription,
                style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () => context.go('/home'),
                child: Text(l10n.driverNavGoHome),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _itemTile(DriverPickupItem item, int index) {
    final checked = _checked[index];
    return GestureDetector(
      onTap: () => setState(() => _checked[index] = !checked),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFF1E1E1E),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: checked
                ? AppColors.primary.withValues(alpha: 0.4)
                : Colors.transparent,
          ),
        ),
        child: Row(
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                color: checked ? AppColors.primary : Colors.transparent,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                  color: checked ? AppColors.primary : const Color(0xFF6B7280),
                  width: 1.5,
                ),
              ),
              child: checked
                  ? const Icon(Icons.check, color: Colors.white, size: 14)
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                item.label,
                style: TextStyle(
                  fontSize: 14,
                  color: checked ? Colors.white : const Color(0xFFD1D5DB),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _restaurantNote(AppLocalizations l10n, String? note) {
    if (note == null || note.trim().isEmpty) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: const BoxDecoration(
        color: Color(0xFF1E1E1E),
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(12),
          topRight: Radius.circular(12),
          bottomLeft: Radius.circular(12),
          bottomRight: Radius.circular(12),
        ),
        border: Border(left: BorderSide(color: AppColors.warning, width: 4)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            l10n.driverPickupRestaurantNoteTitle,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: AppColors.warning,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            note,
            style: const TextStyle(fontSize: 13, color: Color(0xFFD1D5DB)),
          ),
        ],
      ),
    );
  }

  Widget _hintCard(AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline, color: Color(0xFF6B7280), size: 16),
          const SizedBox(width: 8),
          Text(
            l10n.driverPickupHint,
            style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
          ),
        ],
      ),
    );
  }

  Widget _bottomBar(BuildContext context, AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      decoration: const BoxDecoration(
        color: Color(0xFF1A1A1A),
        border: Border(top: BorderSide(color: Color(0xFF374151))),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: double.infinity,
            height: 56,
            child: ElevatedButton(
              key: const Key('pickup-confirmation-complete-button'),
              onPressed: _allChecked
                  ? () => context.go(
                      '/delivery-complete',
                      extra: widget.args!.toDeliveryCompleteArgs(),
                    )
                  : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Text(
                l10n.driverNavConfirmPickup,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          TextButton(
            onPressed: () => _showReportDialog(context, l10n),
            child: Text(
              l10n.driverPickupReportIssue,
              style: const TextStyle(
                color: AppColors.warning,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showReportDialog(BuildContext context, AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: const Color(0xFF1E1E1E),
        title: Text(
          l10n.driverPickupReportIssue,
          style: const TextStyle(color: Colors.white),
        ),
        content: Text(
          l10n.driverPickupReportSupportMessage,
          style: const TextStyle(color: Color(0xFFD1D5DB)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              l10n.close,
              style: const TextStyle(color: AppColors.primary),
            ),
          ),
        ],
      ),
    );
  }
}
