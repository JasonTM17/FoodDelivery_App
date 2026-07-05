import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../shared/providers/cart_provider.dart';
import '../../shared/providers/order_provider.dart';
import '../../shared/models/user.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../providers/address_provider.dart';
import '../../l10n/app_localizations.dart';
import '../router/route_names.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  AddressModel? _selectedAddress;
  String _paymentMethod = 'cash';
  final _noteController = TextEditingController();
  bool _isPlacing = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      final addrState = ref.read(addressProvider);
      if (addrState.addresses.isEmpty && !addrState.isLoading) {
        ref.read(addressProvider.notifier).fetchAddresses();
      }
    });
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _placeOrder() async {
    final l10n = AppLocalizations.of(context);
    if (_selectedAddress == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(l10n.checkoutSelectAddress)));
      return;
    }

    final cartState = ref.read(cartProvider);
    final cart = cartState.currentCart;
    if (cart == null) return;

    setState(() => _isPlacing = true);

    final orderId = await ref
        .read(orderProvider.notifier)
        .placeOrder(
          addressId: _selectedAddress!.id,
          paymentMethod: _paymentMethod,
          notes: _noteController.text,
          promotionCode: cartState.promoCode,
        );

    if (!mounted) return;
    setState(() => _isPlacing = false);

    if (orderId != null) {
      ref.read(cartProvider.notifier).clearCart();
      context.go(Routes.orderTracking, extra: orderId);
    } else {
      final error = ref.read(orderProvider).error;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error ?? l10n.checkoutOrderFailed)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final cartState = ref.watch(cartProvider);
    final orderState = ref.watch(orderProvider);
    final cart = cartState.currentCart;

    if (cart == null || cart.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: Text(l10n.checkoutTitle)),
        body: Center(child: Text(l10n.cartEmpty)),
      );
    }

    final addressState = ref.watch(addressProvider);
    final addresses = addressState.addresses;

    // Auto-select default address on first load
    if (_selectedAddress == null && addresses.isNotEmpty) {
      _selectedAddress = addresses.firstWhere(
        (a) => a.isDefault,
        orElse: () => addresses.first,
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: Text(l10n.checkoutTitle)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Delivery address
            Text(l10n.checkoutDeliveryAddress, style: AppTextStyles.headline4),
            const SizedBox(height: 8),
            if (addressState.isLoading && addresses.isEmpty)
              const Padding(
                padding: EdgeInsets.all(12),
                child: Center(
                  child: CircularProgressIndicator(color: AppColors.primary),
                ),
              )
            else if (addresses.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  children: [
                    const Icon(
                      Icons.location_off,
                      color: AppColors.textHint,
                      size: 32,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      l10n.checkoutNoAddress,
                      style: AppTextStyles.bodyMedium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      l10n.checkoutNoAddressSubtitle,
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              )
            else
              ...addresses.map(
                (address) => GestureDetector(
                  onTap: () => setState(() => _selectedAddress = address),
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.cardBackground,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: _selectedAddress?.id == address.id
                            ? AppColors.primary
                            : AppColors.border,
                        width: _selectedAddress?.id == address.id ? 2 : 1,
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: _selectedAddress?.id == address.id
                                ? AppColors.primary.withValues(alpha: 0.1)
                                : AppColors.surface,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            address.label == 'Nhà' ? Icons.home : Icons.work,
                            color: AppColors.primary,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    address.label,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  if (address.isDefault) ...[
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 6,
                                        vertical: 1,
                                      ),
                                      decoration: BoxDecoration(
                                        color: AppColors.primaryLight,
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        l10n.addressDefault,
                                        style: const TextStyle(
                                          fontSize: 10,
                                          color: AppColors.primaryDark,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 2),
                              Text(
                                address.address,
                                style: AppTextStyles.bodySmall,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        Icon(
                          _selectedAddress?.id == address.id
                              ? Icons.radio_button_checked
                              : Icons.radio_button_off,
                          color: _selectedAddress?.id == address.id
                              ? AppColors.primary
                              : AppColors.textHint,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            TextButton.icon(
              onPressed: () => context.push(Routes.addresses),
              icon: const Icon(Icons.add, size: 18),
              label: Text(l10n.checkoutAddAddress),
            ),

            const SizedBox(height: 20),
            const Divider(),
            const SizedBox(height: 20),

            // Payment method
            Text(l10n.checkoutPaymentMethod, style: AppTextStyles.headline4),
            const SizedBox(height: 8),
            _buildPaymentOption(
              icon: Icons.money,
              title: l10n.checkoutPaymentCash,
              subtitle: l10n.checkoutPaymentCashSubtitle,
              value: 'cash',
            ),
            const SizedBox(height: 8),
            _buildPaymentOption(
              icon: Icons.wallet,
              title: l10n.checkoutPaymentWallet,
              subtitle: 'FoodFlow Wallet',
              value: 'wallet',
            ),

            const SizedBox(height: 20),
            const Divider(),
            const SizedBox(height: 20),

            // Note for driver
            Text(l10n.checkoutNoteForDriver, style: AppTextStyles.headline4),
            const SizedBox(height: 8),
            TextField(
              controller: _noteController,
              maxLines: 2,
              decoration: InputDecoration(
                hintText: l10n.checkoutNoteHint,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),

            const SizedBox(height: 20),
            const Divider(),
            const SizedBox(height: 20),

            // Order summary
            Text(l10n.checkoutOrderSummary, style: AppTextStyles.headline4),
            const SizedBox(height: 12),
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
                  ...cart.items.map(
                    (item) => Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        children: [
                          Text(
                            '${item.quantity}x ',
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          Expanded(
                            child: Text(
                              item.menuItem.name,
                              style: AppTextStyles.bodyMedium,
                            ),
                          ),
                          Text(
                            _formatPrice(item.totalPrice),
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const Divider(),
                  _buildSummaryRow(
                    l10n.cartSubtotal,
                    _formatPrice(cartState.subtotal),
                  ),
                  const SizedBox(height: 6),
                  _buildSummaryRow(
                    l10n.cartDeliveryFee,
                    cartState.deliveryFee > 0
                        ? _formatPrice(cartState.deliveryFee)
                        : l10n.cartFreeDelivery,
                  ),
                  if (cartState.discount > 0) ...[
                    const SizedBox(height: 6),
                    _buildSummaryRow(
                      l10n.cartDiscountLabel,
                      '-${_formatPrice(cartState.discount)}',
                      valueColor: AppColors.success,
                    ),
                  ],
                  const SizedBox(height: 6),
                  _buildSummaryRow(
                    l10n.cartGrandTotal,
                    _formatPrice(cartState.total),
                    isTotal: true,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 100),
          ],
        ),
      ),
      bottomNavigationBar: Container(
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
              onPressed: (_isPlacing || orderState.isPlacingOrder)
                  ? null
                  : _placeOrder,
              child: (_isPlacing || orderState.isPlacingOrder)
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      '${l10n.checkoutConfirmOrder} · ${_formatPrice(cartState.total)}',
                      style: const TextStyle(fontSize: 16),
                    ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPaymentOption({
    required IconData icon,
    required String title,
    required String subtitle,
    required String value,
  }) {
    final isSelected = _paymentMethod == value;
    return GestureDetector(
      onTap: () => setState(() => _paymentMethod = value),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.cardBackground,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(icon, color: AppColors.primary, size: 24),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  Text(subtitle, style: AppTextStyles.bodySmall),
                ],
              ),
            ),
            Icon(
              isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: isSelected ? AppColors.primary : AppColors.textHint,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow(
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
          style: TextStyle(
            fontSize: isTotal ? 16 : 14,
            fontWeight: isTotal ? FontWeight.w700 : FontWeight.w400,
          ),
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
