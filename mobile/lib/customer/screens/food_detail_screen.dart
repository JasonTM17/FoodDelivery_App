import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../shared/providers/cart_provider.dart';
import '../../shared/models/menu_item.dart';
import '../../shared/models/cart.dart' show SelectedOption;
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../l10n/app_localizations.dart';
import '../router/route_names.dart';

class FoodDetailScreen extends ConsumerStatefulWidget {
  final MenuItemModel item;
  final String restaurantName;

  const FoodDetailScreen({
    super.key,
    required this.item,
    required this.restaurantName,
  });

  @override
  ConsumerState<FoodDetailScreen> createState() => _FoodDetailScreenState();
}

class _FoodDetailScreenState extends ConsumerState<FoodDetailScreen> {
  int _quantity = 1;
  final Map<String, List<String>> _selectedOptions = {};
  final _instructionsController = TextEditingController();

  @override
  void dispose() {
    _instructionsController.dispose();
    super.dispose();
  }

  double get _totalPrice {
    final basePrice = widget.item.price * _quantity;
    double optionsPrice = 0;
    for (final entry in _selectedOptions.entries) {
      final group = widget.item.optionGroups.firstWhere(
        (g) => g.name == entry.key,
        orElse: () => ItemOptionGroup(name: entry.key),
      );
      for (final optionName in entry.value) {
        final option = group.options.firstWhere(
          (o) => o.name == optionName,
          orElse: () => ItemOption(name: optionName),
        );
        optionsPrice += option.price;
      }
    }
    return (basePrice + optionsPrice * _quantity);
  }

  void _handleAddToCart() {
    final l10n = AppLocalizations.of(context)!;
    // Validate required options
    for (final group in widget.item.optionGroups) {
      if (group.required) {
        final selected = _selectedOptions[group.name] ?? [];
        if (selected.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('${l10n.foodRequired} ${group.name}')),
          );
          return;
        }
      }
    }

    final selectedOptionsList = <SelectedOption>[];
    for (final entry in _selectedOptions.entries) {
      for (final optionName in entry.value) {
        final group = widget.item.optionGroups.firstWhere(
          (g) => g.name == entry.key,
          orElse: () => ItemOptionGroup(name: entry.key),
        );
        final option = group.options.firstWhere(
          (o) => o.name == optionName,
          orElse: () => ItemOption(name: optionName),
        );
        selectedOptionsList.add(SelectedOption(
          groupName: entry.key,
          optionName: optionName,
          price: option.price,
        ));
      }
    }

    ref.read(cartProvider.notifier).addItem(
      item: widget.item,
      quantity: _quantity,
      selectedOptions: selectedOptionsList,
      specialInstructions: _instructionsController.text.isNotEmpty
          ? _instructionsController.text
          : null,
    );

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${widget.item.name} (x$_quantity)'),
        action: SnackBarAction(
          label: AppLocalizations.of(context)!.cartViewCart,
          textColor: Colors.white,
          onPressed: () => context.push(Routes.cart),
        ),
      ),
    );
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final item = widget.item;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          // AppBar with image
          SliverAppBar(
            expandedHeight: 250,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  item.imageUrl != null
                      ? CachedNetworkImage(
                          imageUrl: item.imageUrl!,
                          fit: BoxFit.cover,
                          errorWidget: (_, __, ___) =>
                              Container(color: AppColors.surface),
                        )
                      : Container(color: AppColors.surface),
                  DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.black.withValues(alpha: 0.3),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () => Navigator.of(context).pop(),
            ),
          ),

          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Name & Price
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          item.name,
                          style: AppTextStyles.headline2,
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            _formatPrice(_totalPrice),
                            style: AppTextStyles.priceLarge,
                          ),
                          if (item.originalPrice != null)
                            Text(
                              _formatPrice(item.originalPrice! * _quantity),
                              style: AppTextStyles.bodySmall.copyWith(
                                decoration: TextDecoration.lineThrough,
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Restaurant name
                  Row(
                    children: [
                      const Icon(Icons.store, size: 16, color: AppColors.textHint),
                      const SizedBox(width: 4),
                      Text(
                        widget.restaurantName,
                        style: AppTextStyles.bodySmall,
                      ),
                      if (item.isPopular) ...[
                        const SizedBox(width: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.accent.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            l10n.foodPopular,
                            style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.accent),
                          ),
                        ),
                      ],
                    ],
                  ),

                  // Description
                  if (item.description != null) ...[
                    const SizedBox(height: 16),
                    Text(
                      item.description!,
                      style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
                    ),
                  ],

                  const SizedBox(height: 24),

                  // Option Groups
                  ...item.optionGroups.map((group) => _buildOptionGroup(group)),

                  // Special Instructions
                  const SizedBox(height: 20),
                  Text(l10n.foodSpecialNote, style: AppTextStyles.bodyMedium),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _instructionsController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      hintText: l10n.foodNoteHint,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),

                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
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
          child: Row(
            children: [
              // Quantity selector
              Container(
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    _buildQuantityButton(Icons.remove, () {
                      if (_quantity > 1) setState(() => _quantity--);
                    }),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        '$_quantity',
                        style: AppTextStyles.headline4,
                      ),
                    ),
                    _buildQuantityButton(Icons.add, () {
                      if (_quantity < 20) setState(() => _quantity++);
                    }),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              // Add to cart button
              Expanded(
                child: SizedBox(
                  height: 48,
                  child: ElevatedButton(
                    onPressed: _handleAddToCart,
                    child: Text(l10n.foodAddToCart + ' · ${_formatPrice(_totalPrice)}'),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuantityButton(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(10),
        child: Icon(icon, size: 20, color: AppColors.textPrimary),
      ),
    );
  }

  Widget _buildOptionGroup(ItemOptionGroup group) {
    final selected = _selectedOptions[group.name] ?? [];

    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                group.name,
                style: AppTextStyles.headline4,
              ),
              if (group.required)
                Padding(
                  padding: const EdgeInsets.only(left: 4),
                  child: Text(
                    AppLocalizations.of(context)!.foodRequired,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.error),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          ...group.options.map((option) {
            final isSelected = selected.contains(option.name);
            return GestureDetector(
              onTap: () {
                setState(() {
                  if (group.type == 'single') {
                    _selectedOptions[group.name] = [option.name];
                  } else {
                    final current = List<String>.from(selected);
                    if (current.contains(option.name)) {
                      current.remove(option.name);
                    } else {
                      current.add(option.name);
                    }
                    _selectedOptions[group.name] = current;
                  }
                });
              },
              child: Container(
                margin: const EdgeInsets.only(bottom: 6),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.primaryLight : AppColors.surface,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: isSelected ? AppColors.primary : AppColors.border,
                    width: isSelected ? 1.5 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      group.type == 'single'
                          ? (isSelected ? Icons.radio_button_checked : Icons.radio_button_off)
                          : (isSelected ? Icons.check_box : Icons.check_box_outline_blank),
                      size: 22,
                      color: isSelected ? AppColors.primary : AppColors.textHint,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        option.name,
                        style: TextStyle(
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                        ),
                      ),
                    ),
                    if (option.price > 0)
                      Text(
                        '+${_formatPrice(option.price)}',
                        style: AppTextStyles.priceSmall,
                      ),
                  ],
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  String _formatPrice(double price) {
    return '${price.round().toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (match) => '${match[1]}.',
    )}đ';
  }
}
