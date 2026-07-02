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
import '../widgets/category_chip.dart';
import '../widgets/promo_banner.dart';
import '../router/route_names.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _searchController = TextEditingController();
  final _searchFocusNode = FocusNode();
  String _selectedCuisine = 'Tất cả';
  int _currentBannerIndex = 0;
  Position? _currentLocation;

  final List<String> _cuisines = [
    'Tất cả',
    'Đồ ăn nhanh',
    'Việt Nam',
    'Nhật Bản',
    'Hàn Quốc',
    'Trung Hoa',
    'Tráng miệng',
    'Đồ uống',
  ];

  final List<_BannerItem> _banners = [
    _BannerItem(
      'Giảm 50% đơn đầu',
      'Cho đơn hàng đầu tiên từ 50k',
      AppColors.primary,
    ),
    _BannerItem(
      'Miễn phí giao hàng',
      'Cho đơn từ 100k trong giờ vàng',
      AppColors.accent,
    ),
    _BannerItem(
      'Mới ra mắt',
      'Ưu đãi đặc biệt cuối tuần',
      AppColors.orderPreparing,
    ),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadData());
  }

  Future<void> _loadData() async {
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
                    message: restaurantState.error!,
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
    return SizedBox(
      height: 48,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: _cuisines.length,
        itemBuilder: (context, index) {
          final cuisine = _cuisines[index];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: CategoryChip(
              label: cuisine,
              isSelected: _selectedCuisine == cuisine,
              onTap: () {
                setState(() => _selectedCuisine = cuisine);
                final cuisineParam = cuisine == 'Tất cả' ? null : cuisine;
                ref
                    .read(restaurantProvider.notifier)
                    .fetchNearbyRestaurants(
                      latitude: _currentLocation?.latitude,
                      longitude: _currentLocation?.longitude,
                      cuisine: cuisineParam,
                    );
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildBannerCarousel() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Column(
        children: [
          CarouselSlider(
            items: _banners
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
            children: _banners.asMap().entries.map((entry) {
              return Container(
                width: _currentBannerIndex == entry.key ? 20 : 8,
                height: 8,
                margin: const EdgeInsets.symmetric(horizontal: 3),
                decoration: BoxDecoration(
                  color: _currentBannerIndex == entry.key
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
}
