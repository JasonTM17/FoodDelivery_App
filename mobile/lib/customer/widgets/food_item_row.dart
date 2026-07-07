import 'package:flutter/material.dart';
import '../../l10n/app_localizations.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/models/menu_item.dart';

class FoodItemRow extends StatelessWidget {
  final MenuItemModel item;
  final VoidCallback? onAddToCart;
  final VoidCallback? onTap;

  const FoodItemRow({
    super.key,
    required this.item,
    this.onAddToCart,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
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
        child: IntrinsicHeight(
          child: Row(
            children: [
              _Thumbnail(imageUrl: item.imageUrl),
              Expanded(
                child: _InfoSection(item: item, onAddToCart: onAddToCart),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Thumbnail extends StatelessWidget {
  final String? imageUrl;
  const _Thumbnail({this.imageUrl});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: const BorderRadius.horizontal(left: Radius.circular(12)),
      child: SizedBox(
        width: 96,
        height: 96,
        child: imageUrl != null
            ? CachedNetworkImage(
                imageUrl: imageUrl!,
                fit: BoxFit.cover,
                placeholder: (_, __) => _placeholder(),
                errorWidget: (_, __, ___) => _placeholder(),
              )
            : _placeholder(),
      ),
    );
  }

  Widget _placeholder() => Container(
    color: AppColors.surface,
    child: const Icon(Icons.fastfood, size: 32, color: AppColors.textHint),
  );
}

class _InfoSection extends StatelessWidget {
  final MenuItemModel item;
  final VoidCallback? onAddToCart;

  const _InfoSection({required this.item, this.onAddToCart});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  item.name,
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (item.isPopular)
                const Icon(
                  Icons.local_fire_department,
                  size: 16,
                  color: AppColors.accent,
                ),
            ],
          ),
          if (item.description != null && item.description!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text(
                item.description!,
                style: AppTextStyles.bodySmall,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          _PriceRow(item: item, onAddToCart: onAddToCart),
        ],
      ),
    );
  }
}

class _PriceRow extends StatelessWidget {
  final MenuItemModel item;
  final VoidCallback? onAddToCart;

  const _PriceRow({required this.item, this.onAddToCart});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Text(_fmt(item.price), style: AppTextStyles.priceSmall),
            if (item.originalPrice != null) ...[
              const SizedBox(width: 6),
              Text(
                _fmt(item.originalPrice!),
                style: AppTextStyles.bodySmall.copyWith(
                  decoration: TextDecoration.lineThrough,
                ),
              ),
            ],
          ],
        ),
        if (item.isAvailable)
          GestureDetector(
            onTap: onAddToCart,
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.add,
                size: 18,
                color: AppColors.textOnPrimary,
              ),
            ),
          )
        else
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.error.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              l10n.foodSoldOut,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.error,
              ),
            ),
          ),
      ],
    );
  }

  String _fmt(double price) =>
      '${price.round().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.')}đ';
}
