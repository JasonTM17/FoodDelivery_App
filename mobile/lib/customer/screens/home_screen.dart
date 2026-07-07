import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:geolocator/geolocator.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/providers/restaurant_provider.dart';
import '../../shared/providers/auth_provider.dart';
import '../../shared/providers/cart_provider.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/widgets/restaurant_card.dart';
import '../../shared/widgets/loading_shimmer.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/utils/app_error_messages.dart';
import '../../shared/utils/cuisine_labels.dart';
import '../providers/vouchers_provider.dart';
import '../widgets/category_chip.dart';
import '../widgets/promo_banner.dart';
import '../router/route_names.dart';

class _CuisineFilter {
  final String id;
  final String? cuisineValue;

  const _CuisineFilter._(this.id, this.cuisineValue);
  const _CuisineFilter.all() : this._('all', null);
  const _CuisineFilter.cuisine(String value) : this._('cuisine:$value', value);

  String label(AppLocalizations l10n) {
    final value = cuisineValue;
    if (value == null) return l10n.cuisineAll;
    return localizedCuisineLabel(l10n, value);
  }
}

const _homeCuisineFilters = [
  _CuisineFilter.all(),
  _CuisineFilter.cuisine('Fast Food'),
  _CuisineFilter.cuisine('Vietnamese'),
  _CuisineFilter.cuisine('Japanese'),
  _CuisineFilter.cuisine('Korean'),
  _CuisineFilter.cuisine('Chinese'),
  _CuisineFilter.cuisine('Italian'),
  _CuisineFilter.cuisine('Dessert'),
  _CuisineFilter.cuisine('Drinks'),
];

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _searchController = TextEditingController();
  final _searchFocusNode = FocusNode();
  String _selectedCuisineId = 'all';
  int _currentBannerIndex = 0;
  Position? _currentLocation;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadData());
  }

  Future<void> _loadData() async {
    final promotionsFuture = ref
        .read(vouchersProvider.notifier)
        .fetchVouchers();
    try {
      Position position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );
      if (mounted) {
        _currentLocation = position;
        ref
            .read(restaurantProvider.notifier)
            .fetchNearbyRestaurants(
              latitude: position.latitude,
              longitude: position.longitude,
            );
      }
    } catch (_) {
      if (mounted) {
        ref.read(restaurantProvider.notifier).fetchNearbyRestaurants();
      }
    }
    await promotionsFuture;
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final restaurantState = ref.watch(restaurantProvider);
    final cartState = ref.watch(cartProvider);
    final authState = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadData,
          child: CustomScrollView(
            slivers: [
              // Header
              SliverToBoxAdapter(
                child: _buildHeader(authState.user?.fullName ?? ''),
              ),

              // Address bar
              SliverToBoxAdapter(child: _buildAddressBar()),

              // Search bar
              SliverToBoxAdapter(child: _buildSearchBar()),

              // Cuisine chips
              SliverToBoxAdapter(child: _buildCuisineChips()),

              // Banner carousel
              SliverToBoxAdapter(child: _buildBannerCarousel()),

              // Section header
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        AppLocalizations.of(context).nearbyRestaurants,
                        style: AppTextStyles.headline3,
                      ),
                      TextButton(
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _selectedCuisineId = 'all');
                          ref
                              .read(restaurantProvider.notifier)
                              .fetchNearbyRestaurants(
                                latitude: _currentLocation?.latitude,
                                longitude: _currentLocation?.longitude,
                                cuisine: null,
                              );
                        },
                        child: Text(AppLocalizations.of(context).viewAll),
                      ),
                    ],
                  ),
                ),
              ),

              // Restaurant list
              if (restaurantState.isLoading)
                SliverToBoxAdapter(
                  child: Column(
                    children: [
                      const SizedBox(height: 16),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Row(
                          children: [
                            CircularProgressIndicator(
                              strokeWidth: 3,
                              color: AppColors.primary,
                            ),
                            const SizedBox(width: 12),
                            Text(
                              AppLocalizations.of(context).loadingRestaurants,
                              style: AppTextStyles.bodyMedium.copyWith(
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      LoadingShimmer(
                        type: ShimmerType.restaurant,
                        itemCount: 3,
                      ),
                    ],
                  ),
                )
              else if (restaurantState.error != null)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: ErrorState(
                    message: localizeAppError(
                      AppLocalizations.of(context),
                      restaurantState.error!,
                    ),
                    onRetry: _loadData,
                  ),
                )
              else if (restaurantState.nearbyRestaurants.isEmpty)
                SliverToBoxAdapter(
                  child: Column(
                    children: [
                      const SizedBox(height: 32),
                      _buildEmptyRestaurants(),
                    ],
                  ),
                )
              else
                SliverList(
                  delegate: SliverChildBuilderDelegate((context, index) {
                    final restaurant = restaurantState.nearbyRestaurants[index];
                    return RestaurantCard(
                      restaurant: restaurant,
                      onTap: () => context.push(
                        Routes.restaurantDetail,
                        extra: restaurant.id,
                      ),
                    );
                  }, childCount: restaurantState.nearbyRestaurants.length),
                ),

              // Bottom padding for nav bar
              const SliverToBoxAdapter(child: SizedBox(height: 80)),
            ],
          ),
        ),
      ),
      bottomNavigationBar: _buildBottomNav(cartState.totalItemCount),
    );
  }

  Widget _buildHeader(String userName) {
    final l10n = AppLocalizations.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                userName.isNotEmpty
                    ? l10n.greetingNamed(userName)
                    : l10n.greetingAnonymous,
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 2),
              Text(l10n.homeQuestion, style: AppTextStyles.headline2),
            ],
          ),
          GestureDetector(
            onTap: () => context.push(Routes.profile),
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.surface,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.border),
              ),
              child: const Icon(
                Icons.person_outline,
                color: AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddressBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Row(
        children: [
          const Icon(Icons.location_on, color: AppColors.primary, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: GestureDetector(
              onTap: () => context.push(Routes.addresses),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        AppLocalizations.of(context).locating,
                        style: const TextStyle(
                          fontSize: 13,
                          color: AppColors.textSecondary,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const Icon(
                      Icons.arrow_drop_down,
                      color: AppColors.textHint,
                      size: 20,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      child: TextField(
        controller: _searchController,
        focusNode: _searchFocusNode,
        decoration: InputDecoration(
          hintText: AppLocalizations.of(context).searchHint,
          prefixIcon: const Icon(Icons.search),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    _searchController.clear();
                    setState(() {});
                  },
                )
              : null,
          filled: true,
          fillColor: AppColors.surface,
          contentPadding: const EdgeInsets.symmetric(vertical: 12),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
        ),
        onChanged: (value) => setState(() {}),
        onSubmitted: (value) {
          if (value.isNotEmpty) {
            context.push(Routes.search, extra: value);
          }
        },
      ),
    );
  }

  Widget _buildCuisineChips() {
    final l10n = AppLocalizations.of(context);
    return SizedBox(
      height: 48,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: _homeCuisineFilters.length,
        itemBuilder: (context, index) {
          final filter = _homeCuisineFilters[index];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: CategoryChip(
              label: filter.label(l10n),
              isSelected: _selectedCuisineId == filter.id,
              onTap: () {
                setState(() => _selectedCuisineId = filter.id);
                ref
                    .read(restaurantProvider.notifier)
                    .fetchNearbyRestaurants(
                      latitude: _currentLocation?.latitude,
                      longitude: _currentLocation?.longitude,
                      cuisine: filter.cuisineValue,
                    );
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildBannerCarousel() {
    final voucherState = ref.watch(vouchersProvider);
    final banners = voucherState.availableVouchers
        .take(5)
        .toList()
        .asMap()
        .entries
        .map((entry) => _BannerItem.fromVoucher(entry.value, entry.key))
        .toList();
    if (banners.isEmpty) return const SizedBox.shrink();
    final selectedIndex = _currentBannerIndex.clamp(0, banners.length - 1);

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Column(
        children: [
          CarouselSlider(
            items: banners
                .map(
                  (b) => PromoBanner(
                    title: b.title,
                    subtitle: b.subtitle,
                    color: b.color,
                  ),
                )
                .toList(),
            options: CarouselOptions(
              height: 140,
              autoPlay: true,
              autoPlayInterval: const Duration(seconds: 4),
              enlargeCenterPage: false,
              viewportFraction: 1.0,
              onPageChanged: (index, _) =>
                  setState(() => _currentBannerIndex = index),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: banners.asMap().entries.map((entry) {
              return Container(
                width: selectedIndex == entry.key ? 20 : 8,
                height: 8,
                margin: const EdgeInsets.symmetric(horizontal: 3),
                decoration: BoxDecoration(
                  color: selectedIndex == entry.key
                      ? AppColors.primary
                      : AppColors.border,
                  borderRadius: BorderRadius.circular(4),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyRestaurants() {
    final l10n = AppLocalizations.of(context);
    return EmptyState(
      icon: Icons.store_mall_directory_outlined,
      title: l10n.noRestaurantsTitle,
      subtitle: l10n.noRestaurantsSubtitle,
      actionLabel: l10n.reload,
      onAction: _loadData,
    );
  }

  Widget _buildBottomNav(int cartItemCount) {
    final l10n = AppLocalizations.of(context);
    return Container(
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
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(Icons.home_rounded, l10n.navHome, true, () {}),
              _buildNavItem(Icons.search_rounded, l10n.navSearch, false, () {
                FocusScope.of(context).requestFocus(_searchFocusNode);
              }),
              _buildNavItem(
                Icons.shopping_cart_outlined,
                l10n.navCart,
                false,
                () {
                  context.push(Routes.cart);
                },
                badgeCount: cartItemCount,
              ),
              _buildNavItem(
                Icons.receipt_long_outlined,
                l10n.navOrders,
                false,
                () {
                  context.push(Routes.orders);
                },
              ),
              _buildNavItem(Icons.person_outline, l10n.navProfile, false, () {
                context.push(Routes.profile);
              }),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(
    IconData icon,
    String label,
    bool isActive,
    VoidCallback onTap, {
    int badgeCount = 0,
  }) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(
                  icon,
                  size: 26,
                  color: isActive ? AppColors.primary : AppColors.textHint,
                ),
                if (badgeCount > 0)
                  Positioned(
                    right: -8,
                    top: -4,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: AppColors.error,
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 18,
                        minHeight: 18,
                      ),
                      child: Text(
                        badgeCount.toString(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                fontSize: 10,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
                color: isActive ? AppColors.primary : AppColors.textHint,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BannerItem {
  final String title;
  final String subtitle;
  final Color color;

  _BannerItem(this.title, this.subtitle, this.color);

  factory _BannerItem.fromVoucher(Voucher voucher, int index) {
    const colors = [
      AppColors.primary,
      AppColors.accent,
      AppColors.orderPreparing,
    ];
    return _BannerItem(
      voucher.title.trim().isNotEmpty ? voucher.title : voucher.code,
      voucher.description.trim().isNotEmpty
          ? voucher.description
          : voucher.code,
      colors[index % colors.length],
    );
  }
}
