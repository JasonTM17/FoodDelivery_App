import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/api/api_client.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';

class PromoCode {
  final String code;
  final String description;
  final double discountPercent;
  final double? maxDiscount;
  final double minOrderAmount;

  const PromoCode({
    required this.code,
    required this.description,
    required this.discountPercent,
    this.maxDiscount,
    required this.minOrderAmount,
  });

  factory PromoCode.fromJson(Map<String, dynamic> json) {
    return PromoCode(
      code: json['code'] as String,
      description: json['description'] as String? ?? '',
      discountPercent: (json['discountPercent'] as num).toDouble(),
      maxDiscount: json['maxDiscount'] != null
          ? (json['maxDiscount'] as num).toDouble()
          : null,
      minOrderAmount: (json['minOrderAmount'] as num? ?? 0).toDouble(),
    );
  }
}

final _promoLoadingProvider = StateProvider<bool>((ref) => false);
final _promosProvider = StateProvider<List<PromoCode>>((ref) => []);
final _promoErrorProvider = StateProvider<String?>((ref) => null);

Future<void> _fetchPromos(WidgetRef ref) async {
  ref.read(_promoLoadingProvider.notifier).state = true;
  ref.read(_promoErrorProvider.notifier).state = null;
  try {
    final response = await ApiClient.instance.get('/promotions/available');
    final list = (response.data as List<dynamic>? ?? [])
        .map((e) => PromoCode.fromJson(e as Map<String, dynamic>))
        .toList();
    ref.read(_promosProvider.notifier).state = list;
  } on DioException catch (e) {
    ref.read(_promoErrorProvider.notifier).state =
        e.response?.data?['message'] as String? ??
        'Không thể tải mã khuyến mãi.';
  } catch (_) {
    ref.read(_promoErrorProvider.notifier).state = 'Có lỗi xảy ra.';
  } finally {
    ref.read(_promoLoadingProvider.notifier).state = false;
  }
}

class PromoSelectorModal extends ConsumerStatefulWidget {
  final String? currentCode;
  const PromoSelectorModal({super.key, this.currentCode});

  @override
  ConsumerState<PromoSelectorModal> createState() => _PromoSelectorModalState();
}

class _PromoSelectorModalState extends ConsumerState<PromoSelectorModal> {
  String? _selectedCode;

  @override
  void initState() {
    super.initState();
    _selectedCode = widget.currentCode;
    Future.microtask(() => _fetchPromos(ref));
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final isLoading = ref.watch(_promoLoadingProvider);
    final promos = ref.watch(_promosProvider);
    final error = ref.watch(_promoErrorProvider);

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.7,
      ),
      decoration: const BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: const EdgeInsets.only(top: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(l10n.cartPromoCode, style: AppTextStyles.headline4),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          if (isLoading)
            const Expanded(child: Center(child: CircularProgressIndicator()))
          else if (error != null)
            Expanded(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text(
                    error,
                    style: AppTextStyles.bodyMedium.copyWith(
                      color: AppColors.textSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            )
          else if (promos.isEmpty)
            Expanded(
              child: Center(
                child: Text(
                  l10n.vouchersEmptyAvailable,
                  style: AppTextStyles.bodyMedium.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ),
            )
          else
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                itemCount: promos.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (ctx, i) => _buildPromoTile(promos[i]),
              ),
            ),

          // Apply button
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.of(context).pop(_selectedCode),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: Text(
                    l10n.cartPromoApply,
                    style: AppTextStyles.buttonLarge,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPromoTile(PromoCode promo) {
    final l10n = AppLocalizations.of(context);
    final isSelected = _selectedCode == promo.code;
    return GestureDetector(
      onTap: () =>
          setState(() => _selectedCode = isSelected ? null : promo.code),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withValues(alpha: 0.08)
              : AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: isSelected ? AppColors.primary : AppColors.primaryLight,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                promo.code,
                style: AppTextStyles.bodySmall.copyWith(
                  color: isSelected ? Colors.white : AppColors.primaryDark,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.vouchersPercentOff(promo.discountPercent.round()),
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    promo.description,
                    style: AppTextStyles.caption,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            if (isSelected)
              const Icon(
                Icons.check_circle,
                color: AppColors.primary,
                size: 22,
              ),
          ],
        ),
      ),
    );
  }
}
