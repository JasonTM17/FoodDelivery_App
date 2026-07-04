import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../models/driver_flow_args.dart';
import '../../shared/theme/app_colors.dart';

class DeliveryCompleteScreen extends StatefulWidget {
  final DeliveryCompleteArgs? args;

  const DeliveryCompleteScreen({super.key, this.args});

  @override
  State<DeliveryCompleteScreen> createState() => _DeliveryCompleteScreenState();
}

class _DeliveryCompleteScreenState extends State<DeliveryCompleteScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _scale;
  late Animation<double> _ripple;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _scale = CurvedAnimation(parent: _ctrl, curve: Curves.elasticOut);
    _ripple = Tween<double>(
      begin: 0.8,
      end: 1.4,
    ).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOut));
    _ctrl.forward();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final args = widget.args;
    if (args == null || !args.hasEarningsData) {
      return _buildMissingEarningsState(context);
    }

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final minHeight = constraints.maxHeight > 48
                ? constraints.maxHeight - 48
                : 0.0;
            return SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: minHeight),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _successIcon(),
                    const SizedBox(height: 20),
                    const Text(
                      'Giao hàng thành công!',
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Cảm ơn bạn đã hoàn thành chuyến giao hàng',
                      style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 32),
                    _earningsCard(args),
                    const SizedBox(height: 32),
                    _actionButtons(context),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildMissingEarningsState(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      body: SafeArea(
        child: Center(
          key: const Key('delivery-complete-missing-state'),
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.receipt_long_outlined,
                  size: 48,
                  color: Color(0xFF6B7280),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Không có dữ liệu thu nhập chuyến giao.',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                const Text(
                  'Vui lòng mở màn này từ đơn vừa hoàn thành.',
                  style: TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () => context.go('/home'),
                  child: const Text('Về trang chủ'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _successIcon() {
    return ScaleTransition(
      scale: _scale,
      child: AnimatedBuilder(
        animation: _ripple,
        builder: (_, child) {
          final alpha =
              (1 - (_ripple.value - 0.8) / 0.6).clamp(0.0, 1.0) * 0.18;
          return Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: 96 * _ripple.value,
                height: 96 * _ripple.value,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.primary.withValues(alpha: alpha),
                ),
              ),
              child!,
            ],
          );
        },
        child: Container(
          width: 96,
          height: 96,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            color: AppColors.primary,
          ),
          child: const Icon(Icons.check, color: Colors.white, size: 52),
        ),
      ),
    );
  }

  Widget _earningsCard(DeliveryCompleteArgs args) {
    return Container(
      key: const Key('delivery-complete-earnings-card'),
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          const Text(
            'Thu nhập chuyến này',
            style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
          ),
          const SizedBox(height: 8),
          Text(
            _formatVnd(args.total),
            style: const TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.w800,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 16),
          const Divider(color: Color(0xFF374151)),
          const SizedBox(height: 12),
          _earningRow('Phí giao hàng', _formatVnd(args.deliveryFee)),
          if (args.bonus > 0) ...[
            const SizedBox(height: 8),
            _earningRow(
              'Thưởng',
              '+${_formatVnd(args.bonus)}',
              highlight: true,
            ),
          ],
        ],
      ),
    );
  }

  Widget _earningRow(String label, String value, {bool highlight = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 14, color: Color(0xFFD1D5DB)),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: highlight ? AppColors.primary : Colors.white,
          ),
        ),
      ],
    );
  }

  Widget _actionButtons(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: () => context.go('/home'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: const Text(
              'TIẾP TỤC NHẬN ĐƠN',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Colors.white,
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          height: 56,
          child: OutlinedButton(
            onPressed: () => context.go('/home'),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: AppColors.primary, width: 1.5),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: const Text(
              'VỀ TRANG CHỦ',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppColors.primary,
              ),
            ),
          ),
        ),
      ],
    );
  }

  String _formatVnd(double amount) => '${amount.toStringAsFixed(0)}đ';
}
