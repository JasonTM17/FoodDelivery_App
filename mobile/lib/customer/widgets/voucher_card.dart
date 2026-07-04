import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../providers/vouchers_provider.dart';

class VoucherCard extends StatelessWidget {
  final Voucher voucher;
  final VoidCallback? onUse;
  final String? percentOffLabel;
  final String? minOrderLabel;
  final String? expiresAtLabel;
  final String? useNowLabel;

  const VoucherCard({
    super.key,
    required this.voucher,
    this.onUse,
    this.percentOffLabel,
    this.minOrderLabel,
    this.expiresAtLabel,
    this.useNowLabel,
  });

  @override
  Widget build(BuildContext context) {
    final isExpired = voucher.status == 'expired' || voucher.isUsed;
    final currencyFmt = NumberFormat.currency(
      locale: 'vi_VN',
      symbol: '₫',
      decimalDigits: 0,
    );

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: isExpired ? AppColors.surface : AppColors.cardBackground,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isExpired
              ? AppColors.border
              : AppColors.primary.withValues(alpha: 0.3),
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.shadow,
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        children: [
          // Left colored strip
          Container(
            width: 4,
            height: 110,
            decoration: BoxDecoration(
              color: isExpired ? AppColors.textHint : AppColors.primary,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                bottomLeft: Radius.circular(12),
              ),
            ),
          ),
          // Content
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              voucher.title,
                              style: AppTextStyles.bodyMedium.copyWith(
                                fontWeight: FontWeight.w600,
                                color: isExpired
                                    ? AppColors.textHint
                                    : AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            if (voucher.percentOff != null)
                              Text(
                                percentOffLabel ??
                                    'Giảm ${voucher.percentOff}%',
                                style: AppTextStyles.priceMedium.copyWith(
                                  color: isExpired
                                      ? AppColors.textHint
                                      : AppColors.error,
                                ),
                              ),
                          ],
                        ),
                      ),
                      // Code badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: isExpired
                              ? AppColors.border
                              : AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          voucher.code,
                          style: AppTextStyles.caption.copyWith(
                            fontWeight: FontWeight.w700,
                            color: isExpired
                                ? AppColors.textHint
                                : AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  if (voucher.minOrderAmount != null)
                    Text(
                      minOrderLabel ??
                          'Đơn tối thiểu ${currencyFmt.format(voucher.minOrderAmount)}',
                      style: AppTextStyles.caption,
                    ),
                  if (voucher.expiresAt != null)
                    Text(
                      expiresAtLabel ??
                          'HSD: ${DateFormat('dd/MM/yyyy').format(voucher.expiresAt!)}',
                      style: AppTextStyles.caption.copyWith(
                        color: voucher.expiresAt!.isBefore(DateTime.now())
                            ? AppColors.error
                            : AppColors.textHint,
                      ),
                    ),
                  const SizedBox(height: 8),
                  if (!isExpired && onUse != null)
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: onUse,
                        icon: const Icon(Icons.local_offer, size: 16),
                        label: Text(useNowLabel ?? 'Dùng ngay'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
