import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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
  ConsumerState<TipAdjustmentScreen> createState() =>
      _TipAdjustmentScreenState();
}

class _TipAdjustmentScreenState extends ConsumerState<TipAdjustmentScreen> {
  @override
  Widget build(BuildContext context) {
    final tipState = ref.watch(tipProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
        title: const Text(
          'Điều chỉnh Tip',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              const SizedBox(height: 24),
              const TipAmountPicker(),
              const SizedBox(height: 32),
              _buildActions(),
              if (tipState.isSubmitting) ...[
                const SizedBox(height: 16),
                const LinearProgressIndicator(
                  color: AppColors.primary,
                  backgroundColor: Color(0xFF374151),
                ),
              ],
              if (tipState.isSubmitted)
                _buildSuccessState(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
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
            child: const Icon(
              Icons.card_giftcard,
              color: Color(0xFFF59E0B),
              size: 32,
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Khách hàng tip thêm?',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Đơn từ ${widget.restaurantName} - Khách: ${widget.customerName}',
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFF6B7280),
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildActions() {
    final tipState = ref.watch(tipProvider);
    final tipNotifier = ref.read(tipProvider.notifier);
    final effective = tipNotifier.effectiveAmount;

    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: tipState.isSubmitting
                ? null
                : () => Navigator.of(context).pop(false),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF6B7280),
              side: const BorderSide(color: Color(0xFF374151)),
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: const Text('Bỏ qua'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton(
            onPressed: (tipState.isSubmitting || effective <= 0)
                ? null
                : () async {
                    final success = await ref
                        .read(tipProvider.notifier)
                        .submitTip(widget.tripId);
                    if (mounted && success) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Đã gửi tip thành công!')),
                      );
                    }
                  },
            child: effective > 0
                ? Text('Xác nhận ${effective.toStringAsFixed(0)}đ')
                : const Text('Xác nhận'),
          ),
        ),
      ],
    );
  }

  Widget _buildSuccessState() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
      ),
      child: const Row(
        children: [
          Icon(Icons.check_circle, color: AppColors.primary),
          SizedBox(width: 10),
          Expanded(
            child: Text(
              'Tip đã được gửi thành công! Cảm ơn bạn.',
              style: TextStyle(
                color: AppColors.primary,
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
