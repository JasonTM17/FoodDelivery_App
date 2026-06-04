import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../shared/providers/restaurant_provider.dart';
import '../../shared/providers/cart_provider.dart';
import '../../shared/models/restaurant.dart';
import '../../shared/models/menu_item.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/widgets/food_card.dart';
import '../../shared/widgets/loading_shimmer.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/empty_state.dart';

class RestaurantDetailScreen extends ConsumerStatefulWidget {
  final String restaurantId;

  const RestaurantDetailScreen({super.key, required this.restaurantId});

  @override
  ConsumerState<RestaurantDetailScreen> createState() => _RestaurantDetailScreenState();
}

class _RestaurantDetailScreenState extends ConsumerState<RestaurantDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    ref.read(restaurantProvider.notifier).fetchRestaurantDetail(widget.restaurantId);
    ref.read(restaurantProvider.notifier).fetchMenu(widget.restaurantId);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(restaurantProvider);
    final restaurant = state.selectedRestaurant;
    final cartState = ref.watch(cartProvider);
    final menuItems = state.menuItems;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: state.isLoading && restaurant == null
          ? const Center(child: CircularProgressIndicator())
          : restaurant == null
              ? ErrorState(
                  message: state.error ?? 'Không thể tải thông tin nhà hàng',
                  onRetry: _loadData,
                )
              : NestedScrollView(
                  headerSliverBuilder: (context, innerBoxIsScrolled) {
                    return [
                      SliverAppBar(
                        expandedHeight: 200,
                        pinned: true,
                        stretch: true,
                        flexibleSpace: FlexibleSpaceBar(
                          background: Stack(
                            fit: StackFit.expand,
                            children: [
                              restaurant.coverImageUrl != null
                                  ? CachedNetworkImage(
                                      imageUrl: restaurant.coverImageUrl!,
                                      fit: BoxFit.cover,
                                      errorWidget: (_, __, ___) =>
                                          Container(color: AppColors.surface),
                                    )
                                  : Container(color: AppColors.surface),
                              // Gradient overlay
                              DecoratedBox(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    begin: Alignment.topCenter,
                                    end: Alignment.bottomCenter,
                                    colors: [
                                      Colors.transparent,
                                      Colors.black.withValues(alpha: 0.7),
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
                        actions: [
                          IconButton(
                            icon: const Icon(Icons.share_outlined, color: Colors.white),
                            onPressed: () {},
                          ),
                        ],
                        bottom: PreferredSize(
                          preferredSize: const Size.fromHeight(100),
                          child: _buildRestaurantHeader(restaurant),
                        ),
                      ),
                      SliverPersistentHeader(
                        pinned: true,
                        delegate: _TabBarDelegate(
                          TabBar(
                            controller: _tabController,
                            labelColor: AppColors.primary,
                            unselectedLabelColor: AppColors.textSecondary,
                            indicatorColor: AppColors.primary,
                            indicatorWeight: 3,
                            labelStyle: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                            ),
                            tabs: const [
                              Tab(text: 'Thực đơn'),
                              Tab(text: 'Đánh giá'),
                              Tab(text: 'Thông tin'),
                            ],
                          ),
                        ),
                      ),
                    ];
                  },
                  body: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildMenuTab(menuItems, state.isLoadingMenu),
                      _buildReviewsTab(restaurant.reviews),
                      _buildInfoTab(restaurant),
                    ],
                  ),
                ),
      bottomNavigationBar: cartState.isEmpty
          ? null
          : _buildCartBottomBar(cartState),
    );
  }

  Widget _buildRestaurantHeader(RestaurantModel restaurant) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            restaurant.name,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.star, size: 16, color: AppColors.accent),
              const SizedBox(width: 4),
              Text(
                restaurant.rating.toStringAsFixed(1),
                style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
              ),
              const SizedBox(width: 4),
              Text(
                '(${restaurant.reviewCount})',
                style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 12),
              ),
              if (restaurant.distance != null) ...[
                const SizedBox(width: 12),
                const Icon(Icons.location_on, size: 14, color: Colors.white70),
                const SizedBox(width: 2),
                Text(
                  restaurant.distance!,
                  style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 12),
                ),
              ],
              const SizedBox(width: 12),
              const Icon(Icons.access_time, size: 14, color: Colors.white70),
              const SizedBox(width: 2),
              Text(
                '${restaurant.estimatedPrepTime}ph',
                style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 12),
              ),
              const SizedBox(width: 12),
              Text(
                restaurant.priceRange,
                style: const TextStyle(color: Colors.white, fontSize: 13),
              ),
            ],
          ),
          if (restaurant.cuisineTypes.isNotEmpty) ...[
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              children: restaurant.cuisineTypes.map((cuisine) {
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    cuisine,
                    style: const TextStyle(color: Colors.white, fontSize: 11),
                  ),
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMenuTab(List<MenuItemModel> menuItems, bool isLoadingMenu) {
    if (isLoadingMenu) {
      return const LoadingShimmer(type: ShimmerType.foodItem, itemCount: 6);
    }

    if (menuItems.isEmpty) {
      return const EmptyState(
        icon: Icons.restaurant_menu,
        title: 'Thực đơn đang cập nhật',
        subtitle: 'Nhà hàng chưa có món nào trong thực đơn',
      );
    }

    // Group by category
    final grouped = <String, List<MenuItemModel>>{};
    for (final item in menuItems) {
      grouped.putIfAbsent(item.category, () => []).add(item);
    }

    final categories = grouped.keys.toList();

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: categories.length,
      itemBuilder: (context, index) {
        final category = categories[index];
        final items = grouped[category]!;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Text(
                category,
                style: AppTextStyles.headline4.copyWith(color: AppColors.primaryDark),
              ),
            ),
            ...items.map((item) => FoodCard(
              item: item,
              onTap: () {
                Navigator.of(context).pushNamed(
                  '/food-detail',
                  arguments: {'item': item, 'restaurantName': ref.read(restaurantProvider).selectedRestaurant?.name ?? ''},
                );
              },
              onAddToCart: () {
                ref.read(cartProvider.notifier).setRestaurantInfo(
                  widget.restaurantId,
                  ref.read(restaurantProvider).selectedRestaurant?.name ?? '',
                );
                ref.read(cartProvider.notifier).addItem(item: item);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Đã thêm ${item.name} vào giỏ hàng'),
                    duration: const Duration(seconds: 2),
                    action: SnackBarAction(
                      label: 'Xem giỏ',
                      textColor: Colors.white,
                      onPressed: () => Navigator.of(context).pushNamed('/cart'),
                    ),
                  ),
                );
              },
            )),
          ],
        );
      },
    );
  }

  Widget _buildReviewsTab(List<ReviewModel>? reviews) {
    if (reviews == null || reviews.isEmpty) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.rate_review_outlined, size: 48, color: AppColors.textHint),
            SizedBox(height: 16),
            Text(
              'Chưa có đánh giá nào',
              style: AppTextStyles.headline4,
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: reviews.length + 1,
      itemBuilder: (context, index) {
        if (index == 0) {
          return _buildReviewSummary(reviews);
        }
        final review = reviews[index - 1];
        return _buildReviewItem(review);
      },
    );
  }

  Widget _buildReviewSummary(List<ReviewModel> reviews) {
    final avgFood = reviews.fold<double>(0.0, (sum, r) => sum + r.foodRating) / reviews.length;
    final avgDelivery = reviews.fold<double>(0.0, (sum, r) => sum + r.deliveryRating) / reviews.length;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: AppColors.shadow, blurRadius: 4, offset: const Offset(0, 1)),
        ],
      ),
      child: Row(
        children: [
          Column(
            children: [
              Text(
                avgFood.toStringAsFixed(1),
                style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w700, color: AppColors.accent),
              ),
              const Row(
                children: [
                  Icon(Icons.star, size: 16, color: AppColors.accent),
                  SizedBox(width: 4),
                  Text('Món ăn', style: AppTextStyles.caption),
                ],
              ),
            ],
          ),
          const SizedBox(width: 32),
          Column(
            children: [
              Text(
                avgDelivery.toStringAsFixed(1),
                style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w700, color: AppColors.primary),
              ),
              const Row(
                children: [
                  Icon(Icons.star, size: 16, color: AppColors.primary),
                  SizedBox(width: 4),
                  Text('Giao hàng', style: AppTextStyles.caption),
                ],
              ),
            ],
          ),
          const Spacer(),
          Column(
            children: [
              Text(
                '${reviews.length}',
                style: const TextStyle(fontSize: 36, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
              ),
              const Text('Đánh giá', style: AppTextStyles.caption),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildReviewItem(ReviewModel review) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.cardBackground,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: AppColors.shadow, blurRadius: 2, offset: const Offset(0, 1)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: AppColors.surface,
                backgroundImage: review.userAvatarUrl != null
                    ? CachedNetworkImageProvider(review.userAvatarUrl!)
                    : null,
                child: review.userAvatarUrl == null
                    ? const Icon(Icons.person, size: 18, color: AppColors.textHint)
                    : null,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  review.userName ?? 'Người dùng',
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                ),
              ),
              Row(
                children: [
                  const Icon(Icons.star, size: 14, color: AppColors.accent),
                  const SizedBox(width: 2),
                  Text(
                    review.foodRating.toStringAsFixed(1),
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ],
          ),
          if (review.comment != null && review.comment!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(review.comment!, style: AppTextStyles.bodyMedium),
          ],
          const SizedBox(height: 6),
          Text(
            _formatDate(review.createdAt),
            style: AppTextStyles.caption,
          ),
        ],
      ),
    );
  }

  Widget _buildInfoTab(RestaurantModel restaurant) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
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
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Thông tin nhà hàng', style: AppTextStyles.headline4),
                const SizedBox(height: 16),
                if (restaurant.description != null) ...[
                  _buildInfoRow(Icons.info_outline, 'Mô tả', restaurant.description!),
                  const SizedBox(height: 12),
                ],
                _buildInfoRow(Icons.location_on, 'Địa chỉ', restaurant.address ?? 'Đang cập nhật'),
                if (restaurant.phone != null) ...[
                  const SizedBox(height: 12),
                  _buildInfoRow(Icons.phone, 'Điện thoại', restaurant.phone!),
                ],
                const SizedBox(height: 12),
                _buildInfoRow(Icons.access_time, 'Thời gian giao hàng', '${restaurant.estimatedPrepTime} phút'),
                const SizedBox(height: 12),
                _buildInfoRow(Icons.attach_money, 'Khoảng giá', restaurant.priceRange),
                const SizedBox(height: 12),
                _buildInfoRow(
                  Icons.star,
                  'Đánh giá',
                  '${restaurant.rating.toStringAsFixed(1)} (${restaurant.reviewCount} đánh giá)',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: AppColors.primary),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: AppTextStyles.caption),
              const SizedBox(height: 2),
              Text(value, style: AppTextStyles.bodyMedium),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCartBottomBar(CartState cartState) {
    return Container(
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
        child: ElevatedButton(
          onPressed: () => Navigator.of(context).pushNamed('/cart'),
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 14),
          ),
          child: Text(
            'Xem giỏ hàng · ${cartState.totalItemCount} món · ${_formatPrice(cartState.subtotal)}',
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
          ),
        ),
      ),
    );
  }

  String _formatPrice(double price) {
    return '${price.round().toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (match) => '${match[1]}.',
    )}đ';
  }

  String _formatDate(DateTime date) {
    final day = date.day.toString().padLeft(2, '0');
    final month = date.month.toString().padLeft(2, '0');
    final year = date.year;
    final hour = date.hour.toString().padLeft(2, '0');
    final minute = date.minute.toString().padLeft(2, '0');
    return '$day/$month/$year $hour:$minute';
  }
}

class _TabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;

  _TabBarDelegate(this.tabBar);

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: AppColors.background,
      child: tabBar,
    );
  }

  @override
  double get maxExtent => tabBar.preferredSize.height;

  @override
  double get minExtent => tabBar.preferredSize.height;

  @override
  bool shouldRebuild(covariant _TabBarDelegate oldDelegate) => false;
}
