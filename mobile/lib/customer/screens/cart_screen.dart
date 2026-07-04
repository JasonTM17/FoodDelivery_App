import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../shared/providers/cart_provider.dart';
import '../widgets/cart_item_tile.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/widgets/empty_state.dart';
import '../../l10n/app_localizations.dart';
import '../router/route_names.dart';

class CartScreen extends ConsumerStatefulWidget {
  const CartScreen({super.key});

  @override
  ConsumerState<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends ConsumerState<CartScreen> {
  final _promoController = TextEditingController();
  bool _isApplyingPromo = false;

  @override
  void dispose() {
    _promoController.dispose();
    super.dispose();
  }

  Future<void> _applyPromo() async {
    final code = _promoController.text.trim();
    if (code.isEmpty) return;

    setState(() => _isApplyingPromo = true);
    await ref.read(cartProvider.notifier).applyPromoCode(code);
    if (mounted) setState(() => _isApplyingPromo = false);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final cartState = ref.watch(cartProvider);

    if (cartState.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: Text(l10n.cartTitle)),
        body: EmptyState(
          icon: Icons.shopping_cart_outlined,
          title: l10n.cartEmpty,
          subtitle: l10n.cartEmptySubtitle,
        ),
      );
    }

    final cart = cartState.currentCart!;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(l10n.cartTitle),
        actions: [
          TextButton(
            onPressed: () {
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: Text(l10n.cartClearTitle),
                  content: Text(l10n.cartClearContent),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: Text(l10n.cartKeep),
                    ),
                    TextButton(
                      onPressed: () {
                        ref.read(cartProvider.notifier).clearCart();
                        Navigator.of(context).pop();
                      },
                      child: Text(
                        l10n.cartDelete,
                        style: const TextStyle(color: AppColors.error),
                      ),
                    ),
                  ],
                ),
              );
            },
            child: Text(
              l10n.cartClearAll,
              style: const TextStyle(color: AppColors.error, fontSize: 13),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Restaurant info
                Container(
                  padding: const EdgeInsets.all(12),
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
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: SizedBox(
                          width: 44,
                          height: 44,
                          child: cart.restaurantLogoUrl != null
                              ? CachedNetworkImage(
                                  imageUrl: cart.restaurantLogoUrl!,
                                  fit: BoxFit.cover,
                                  errorWidget: (_, __, ___) => Container(
                                    color: AppColors.surface,
                                    child: const Icon(
                                      Icons.restaurant,
                                      size: 24,
                                      color: AppColors.textHint,
                                    ),
                                  ),
                                )
                              : Container(
                                  color: AppColors.surface,
                                  child: const Icon(
                                    Icons.restaurant,
                                    size: 24,
                                    color: AppColors.textHint,
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          cart.restaurantName,
                          style: AppTextStyles.bodyMedium.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Cart items
                ...cart.items.asMap().entries.map((entry) {
                  final index = entry.key;
                  final item = entry.value;
                  return CartItemTile(
                    item: item,
                    index: index,
                    onRemove: () =>
                        ref.read(cartProvider.notifier).removeItem(index),
                    onQuantityChanged: (qty) => ref
                        .read(cartProvider.notifier)
                        .updateItemQuantity(index, qty),
                  );
                }),

                const SizedBox(height: 16),

                // Promo code
                Container(
                  padding: const EdgeInsets.all(12),
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
                      Text(l10n.cartPromoCode, style: AppTextStyles.bodyMedium),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _promoController,
                              decoration: InputDecoration(
                                hintText: l10n.cartPromoHint,
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 10,
                                ),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                enabled: cartState.promoCode == null,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          if (cartState.promoCode != null)
                            TextButton(
                              onPressed: () {
                                _promoController.clear();
                                ref.read(cartProvider.notifier).removePromo();
                              },
                              child: Text(
                                l10n.cartPromoRemove,
                                style: const TextStyle(color: AppColors.error),
                              ),
                            )
                          else
                            ElevatedButton(
                              onPressed: _isApplyingPromo ? null : _applyPromo,
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 10,
                                ),
                              ),
                              child: _isApplyingPromo
                                  ? const SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : Text(
                                      l10n.cartPromoApply,
                                      style: const TextStyle(fontSize: 13),
                                    ),
                            ),
                        ],
                      ),
                      if (cartState.promoCode != null) ...[
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.success.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            l10n.cartPromoApplied(cartState.promoCode!),
                            style: const TextStyle(
                              color: AppColors.success,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                      if (cartState.error != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          cartState.error!,
                          style: const TextStyle(
                            color: AppColors.error,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 16),

                // Price breakdown
                Container(
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
                    children: [
                      _buildPriceRow(
                        l10n.cartSubtotal,
                        _formatPrice(cartState.subtotal),
                      ),
                      const SizedBox(height: 8),
                      _buildPriceRow(
                        l10n.cartDeliveryFee,
                        cartState.deliveryFee > 0
                            ? _formatPrice(cartState.deliveryFee)
                            : l10n.cartFreeDelivery,
                      ),
                      if (cartState.discount > 0) ...[
                        const SizedBox(height: 8),
                        _buildPriceRow(
                          l10n.cartDiscountLabel,
                          '-${_formatPrice(cartState.discount)}',
                          valueColor: AppColors.success,
                        ),
                      ],
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 8),
                        child: Divider(),
                      ),
                      _buildPriceRow(
                        l10n.cartGrandTotal,
                        _formatPrice(cartState.total),
                        isTotal: true,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Checkout button
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            decoration: BoxDecoration(
              color: AppColors.background,
              boxShadow: [
                BoxShadow(
                  color: AppColors.shadowMedium,
                  blurRadius: 12,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: SafeArea(
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: () => context.push(Routes.checkout),
                  child: Text(
                    '${l10n.cartPlaceOrder} · ${_formatPrice(cartState.total)}',
                    style: const TextStyle(fontSize: 16),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPriceRow(
    String label,
    String value, {
    bool isTotal = false,
    Color? valueColor,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: isTotal
              ? AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w700)
              : AppTextStyles.bodyMedium,
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isTotal ? 16 : 14,
            fontWeight: isTotal ? FontWeight.w700 : FontWeight.w500,
            color: valueColor ?? AppColors.textPrimary,
          ),
        ),
      ],
    );
  }

  String _formatPrice(double price) {
    return '${price.round().toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (match) => '${match[1]}.')}đ';
  }
}
