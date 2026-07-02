import 'package:flutter/material.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../providers/membership_provider.dart';

class MembershipTierCard extends StatelessWidget {
  final MembershipTier tier;
  final bool isCurrentTier;
  final VoidCallback? onUpgrade;
  final String tierLabel;
  final String currentBadgeLabel;
  final String freeLabel;
  final String pricePerMonthSuffix;
  final String upgradeCtaLabel;
  final List<String> benefits;

  const MembershipTierCard({
    super.key,
    required this.tier,
    this.isCurrentTier = false,
    this.onUpgrade,
    required this.tierLabel,
    required this.currentBadgeLabel,
    required this.freeLabel,
    required this.pricePerMonthSuffix,
    required this.upgradeCtaLabel,
    required this.benefits,
  });

  @override
  Widget build(BuildContext context) {
    final price = tier.monthlyPriceVnd();
    final isFree = tier == MembershipTier.free;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: isCurrentTier
            ? LinearGradient(
                colors: [AppColors.primary, AppColors.primaryDark],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              )
            : null,
        color: isCurrentTier ? null : AppColors.cardBackground,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isCurrentTier ? AppColors.primary : AppColors.border,
          width: isCurrentTier ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: isCurrentTier
                ? AppColors.primary.withOpacity(0.3)
                : AppColors.shadow,
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                tierLabel,
                style: AppTextStyles.headline4.copyWith(
                  color: isCurrentTier ? Colors.white : AppColors.textPrimary,
                ),
              ),
              if (isCurrentTier)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    currentBadgeLabel,
                    style: AppTextStyles.caption.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            isFree ? freeLabel : '${tier.monthlyPriceVnd().toString()}${pricePerMonthSuffix}',
            style: AppTextStyles.headline3.copyWith(
              color: isCurrentTier ? Colors.white : AppColors.primary,
            ),
          ),
          const SizedBox(height: 16),
          ...benefits.map((benefit) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Icon(
                      Icons.check_circle,
                      size: 18,
                      color: isCurrentTier ? Colors.white : AppColors.success,
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        benefit,
                        style: AppTextStyles.bodySmall.copyWith(
                          color: isCurrentTier ? Colors.white70 : AppColors.textSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
              )).toList(),
          if (!isCurrentTier && !isFree && onUpgrade != null) ...[
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: onUpgrade,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: Text(upgradeCtaLabel),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
