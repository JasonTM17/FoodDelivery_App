import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/widgets/loading_shimmer.dart';
import '../providers/cancel_order_provider.dart';
import '../widgets/cancel_reason_picker.dart';

class CancelOrderScreen extends ConsumerStatefulWidget {
  final String orderId;
  final String? restaurantName;
  final String? orderSummary;
  final int? totalAmount;

  const CancelOrderScreen({
    super.key,
    required this.orderId,
    this.restaurantName,
    this.orderSummary,
    this.totalAmount,
  });

  @override
  ConsumerState<CancelOrderScreen> createState() => _CancelOrderScreenState();
}

class _CancelOrderScreenState extends ConsumerState<CancelOrderScreen> {
  final _noteController = TextEditingController();

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _handleCancel() async {
    final provider = ref.read(cancelOrderProvider.notifier);
    final ok = await provider.cancelOrder(widget.orderId);
    if (!mounted) return;
    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Đã hủy đơn hàng thành công'),
          backgroundColor: AppColors.success,
        ),
      );
      context.pop(true);
    } else {
      final state = ref.read(cancelOrderProvider);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(state.error ?? 'Không thể hủy đơn hàng'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(cancelOrderProvider);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: const BackButton(color: AppColors.textPrimary),
        title: const Text('Hủy đơn hàng', style: AppTextStyles.headline3),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Order summary card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.cardBackground,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.shadow,
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Thông tin đơn hàng',
                    style: AppTextStyles.bodySmall.copyWith(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  if (widget.restaurantName != null)
                    Text(
                      widget.restaurantName!,
                      style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w500),
                    ),
                  if (widget.orderSummary != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        widget.orderSummary!,
                        style: AppTextStyles.bodySmall,
                      ),
                    ),
                  if (widget.totalAmount != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        _formatCurrency(widget.totalAmount!),
                        style: AppTextStyles.priceMedium,
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Reason picker
            Text(
              'Chọn lý do hủy',
              style: AppTextStyles.headline4,
            ),
            const SizedBox(height: 4),
            Text(
              'Chúng tôi rất tiếc nếu có điều gì không như ý',
              style: AppTextStyles.bodySmall,
            ),
            const SizedBox(height: 16),
            CancelReasonPicker(
              selectedReason: state.selectedReason,
              onSelected: (reason) => ref.read(cancelOrderProvider.notifier).selectReason(reason),
            ),
            const SizedBox(height: 20),

            // Note field
            TextField(
              controller: _noteController,
              maxLines: 3,
              onChanged: (v) => ref.read(cancelOrderProvider.notifier).updateNote(v),
              decoration: InputDecoration(
                hintText: 'Ghi chú thêm (tùy chọn)',
                hintStyle: AppTextStyles.bodySmall.copyWith(color: AppColors.textHint),
                filled: true,
                fillColor: AppColors.cardBackground,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.all(14),
              ),
            ),
            const SizedBox(height: 24),

            // Refund note
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.info.withOpacity(0.08),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, color: AppColors.info, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Hoàn tiền trong 3-5 ngày làm việc',
                      style: AppTextStyles.bodySmall.copyWith(color: AppColors.info),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Cancel CTA
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: state.isLoading || state.selectedReason == null ? null : _handleCancel,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.error,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  disabledBackgroundColor: AppColors.border,
                ),
                child: state.isLoading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text(
                        'Xác nhận hủy',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                      ),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  String _formatCurrency(int vnd) {
    if (vnd >= 1000) {
      return '${(vnd / 1000).round()}K₫';
    }
    return '$vnd₫';
  }
}
