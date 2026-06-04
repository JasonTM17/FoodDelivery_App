import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../shared/providers/cart_provider.dart';
import '../../shared/models/cart.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/widgets/empty_state.dart';

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
    final cartState = ref.watch(cartProvider);

    if (cartState.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Giỏ hàng')),
        body: const EmptyState(
          icon: Icons.shopping_cart_outlined,
          title: 'Giỏ hàng trống',
          subtitle: 'Hãy thêm món ăn vào giỏ hàng',
        ),
      );
    }

    final cart = cartState.currentCart!;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Giỏ hàng'),
        actions: [
          TextButton(
            onPressed: () {
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Xóa giỏ hàng?'),
                  content: const Text('Bạn có chắc muốn xóa tất cả món trong giỏ hàng?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Giữ lại'),
                    ),
                    TextButton(
                      onPressed: () {
                        ref.read(cartProvider.notifier).clearCart();
                        Navigator.of(context).pop();
                      },
                      child: const Text('Xóa', style: TextStyle(color: AppColors.error)),
                    ),
                  ],
                ),
              );
            },
            child: const Text('Xóa tất cả', style: TextStyle(color: AppColors.error, fontSize: 13)),
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
                      BoxShadow(color: AppColors.shadow, blurRadius: 4, offset: const Offset(0, 1)),
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
                                    child: const Icon(Icons.restaurant, size: 24, color: AppColors.textHint),
                                  ),
                                )
                              : Container(
                                  color: AppColors.surface,
                                  child: const Icon(Icons.restaurant, size: 24, color: AppColors.textHint),
                                ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          cart.restaurantName,
                          style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600),
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
                  return _buildCartItem(item, index);
                }),

                const SizedBox(height: 16),

                // Promo code
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.cardBackground,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(color: AppColors.shadow, blurRadius: 4, offset: const Offset(0, 1)),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Mã khuyến mãi', style: AppTextStyles.bodyMedium),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _promoController,
                              decoration: InputDecoration(
                                hintText: 'Nhập mã giảm giá',
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
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
                              child: const Text('Bỏ', style: TextStyle(color: AppColors.error)),
                            )
                          else
                            ElevatedButton(
                              onPressed: _isApplyingPromo ? null : _applyPromo,
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                              ),
                              child: _isApplyingPromo
                                  ? const SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                    )
                                  : const Text('Áp dụng', style: TextStyle(fontSize: 13)),
                            ),
                        ],
                      ),
                      if (cartState.promoCode != null) ...[
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.success.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'Đã áp dụng mã ${cartState.promoCode}',
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
                          style: const TextStyle(color: AppColors.error, fontSize: 12),
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
                      BoxShadow(color: AppColors.shadow, blurRadius: 4, offset: const Offset(0, 1)),
                    ],
                  ),
                  child: Column(
                    children: [
                      _buildPriceRow('Tạm tính', _formatPrice(cartState.subtotal)),
                      const SizedBox(height: 8),
                      _buildPriceRow('Phí giao hàng', cartState.deliveryFee > 0 ? _formatPrice(cartState.deliveryFee) : 'Miễn phí'),
                      if (cartState.discount > 0) ...[
                        const SizedBox(height: 8),
                        _buildPriceRow(
                          'Giảm giá',
                          '-${_formatPrice(cartState.discount)}',
                          valueColor: AppColors.success,
                        ),
                      ],
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 8),
                        child: Divider(),
                      ),
                      _buildPriceRow(
                        'Tổng cộng',
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
                  onPressed: () => Navigator.of(context).pushNamed('/checkout'),
                  child: Text(
                    'Đặt hàng · ${_formatPrice(cartState.total)}',
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

  Widget _buildCartItem(CartItemModel item, int index) {
    return Dismissible(
      key: Key('cart_${item.menuItem.id}_$index'),
      direction: DismissDirection.endToStart,
      background: Container(
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          color: AppColors.error,
          borderRadius: BorderRadius.circular(12),
        ),
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        child: const Icon(Icons.delete, color: Colors.white),
      ),
      onDismissed: (_) => ref.read(cartProvider.notifier).removeItem(index),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.cardBackground,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(color: AppColors.shadow, blurRadius: 2, offset: const Offset(0, 1)),
          ],
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: SizedBox(
                width: 60,
                height: 60,
                child: item.menuItem.imageUrl != null
                    ? CachedNetworkImage(
                        imageUrl: item.menuItem.imageUrl!,
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) => Container(
                          color: AppColors.surface,
                          child: const Icon(Icons.fastfood, size: 28, color: AppColors.textHint),
                        ),
                      )
                    : Container(
                        color: AppColors.surface,
                        child: const Icon(Icons.fastfood, size: 28, color: AppColors.textHint),
                      ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.menuItem.name,
                    style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (item.selectedOptions.isNotEmpty)
                    Text(
                      item.selectedOptions.map((o) => o.optionName).join(', '),
                      style: AppTextStyles.bodySmall,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  const SizedBox(height: 4),
                  Text(
                    _formatPrice(item.totalPrice),
                    style: AppTextStyles.priceSmall,
                  ),
                ],
              ),
            ),
            // Quantity controls
            Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  GestureDetector(
                    onTap: () => ref.read(cartProvider.notifier).updateItemQuantity(index, item.quantity - 1),
                    child: const Padding(
                      padding: EdgeInsets.all(6),
                      child: Icon(Icons.remove, size: 16, color: AppColors.textPrimary),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: Text(
                      '${item.quantity}',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => ref.read(cartProvider.notifier).updateItemQuantity(index, item.quantity + 1),
                    child: const Padding(
                      padding: EdgeInsets.all(6),
                      child: Icon(Icons.add, size: 16, color: AppColors.primary),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPriceRow(String label, String value, {bool isTotal = false, Color? valueColor}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: isTotal ? AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w700) : AppTextStyles.bodyMedium,
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
    return '${price.round().toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (match) => '${match[1]}.',
    )}đ';
  }
}
