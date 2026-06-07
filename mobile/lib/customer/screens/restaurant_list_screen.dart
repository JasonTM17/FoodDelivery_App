import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../shared/providers/restaurant_provider.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/widgets/restaurant_card.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/vietnam_boundary_overlay.dart';
import '../providers/restaurant_filter_provider.dart';
import '../widgets/category_chip.dart';

const _filterLabels = [
  'Tất cả', 'Gần nhất', 'Phở', 'Cơm', 'Đồ uống', 'Pizza', 'Đang mở',
];

const _defaultCamera = CameraPosition(
  target: LatLng(10.7769, 106.7009),
  zoom: 12.5,
);

class RestaurantListScreen extends ConsumerStatefulWidget {
  const RestaurantListScreen({super.key});

  @override
  ConsumerState<RestaurantListScreen> createState() =>
      _RestaurantListScreenState();
}

class _RestaurantListScreenState extends ConsumerState<RestaurantListScreen> {
  Set<Polygon> _boundaryPolygons = {};

  @override
  void initState() {
    super.initState();
    _loadBoundary();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(restaurantProvider.notifier).fetchNearbyRestaurants();
    });
  }

  Future<void> _loadBoundary() async {
    final polygons = await VietnamBoundaryOverlay.polygons;
    if (mounted) setState(() => _boundaryPolygons = polygons);
  }

  @override
  Widget build(BuildContext context) {
    final filter = ref.watch(restaurantFilterProvider);
    final restaurants = ref.watch(restaurantProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: BackButton(color: AppColors.textPrimary),
        title: const Text('Quanh đây', style: AppTextStyles.headline3),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.tune_rounded, color: AppColors.textPrimary),
            onPressed: () {},
          ),
        ],
      ),
      body: Column(
        children: [
          _buildViewToggle(filter.viewMode),
          _buildFilterChips(filter.selectedFilter),
          Expanded(
            child: filter.viewMode == RestaurantViewMode.list
                ? _buildListView(restaurants)
                : _buildMapView(restaurants),
          ),
        ],
      ),
    );
  }

  Widget _buildViewToggle(RestaurantViewMode current) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            _pill('Danh sách', RestaurantViewMode.list, current),
            _pill('Bản đồ', RestaurantViewMode.map, current),
          ],
        ),
      ),
    );
  }

  Widget _pill(
      String label, RestaurantViewMode mode, RestaurantViewMode current) {
    final active = mode == current;
    return Expanded(
      child: GestureDetector(
        onTap: () =>
            ref.read(restaurantFilterProvider.notifier).setViewMode(mode),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: active ? AppColors.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color:
                  active ? AppColors.textOnPrimary : AppColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFilterChips(String selected) {
    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _filterLabels.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) => CategoryChip(
          label: _filterLabels[i],
          isSelected: _filterLabels[i] == selected,
          onTap: () => ref
              .read(restaurantFilterProvider.notifier)
              .setFilter(_filterLabels[i]),
        ),
      ),
    );
  }

  Widget _buildListView(RestaurantState state) {
    if (state.isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppColors.primary),
      );
    }
    if (state.nearbyRestaurants.isEmpty) {
      return const EmptyState(
        icon: Icons.store_mall_directory_outlined,
        title: 'Không có nhà hàng nào',
        subtitle: 'Thử chọn bộ lọc khác',
      );
    }
    return RefreshIndicator(
      onRefresh: () async =>
          ref.read(restaurantProvider.notifier).fetchNearbyRestaurants(),
      child: ListView.builder(
        padding: const EdgeInsets.only(top: 8, bottom: 16),
        itemCount: state.nearbyRestaurants.length,
        itemBuilder: (_, i) => RestaurantCard(
          restaurant: state.nearbyRestaurants[i],
          onTap: () => context.push(
            '/restaurant-detail',
            extra: state.nearbyRestaurants[i].id,
          ),
        ),
      ),
    );
  }

  Widget _buildMapView(RestaurantState state) {
    final list = state.nearbyRestaurants;
    final markers = list
        .map((r) => Marker(
              markerId: MarkerId(r.id),
              position: LatLng(r.latitude, r.longitude),
              infoWindow: InfoWindow(title: r.name),
            ))
        .toSet();

    return Stack(
      children: [
        GoogleMap(
          initialCameraPosition: _defaultCamera,
          polygons: _boundaryPolygons,
          markers: markers,
          myLocationButtonEnabled: false,
          zoomControlsEnabled: false,
        ),
        if (list.isNotEmpty)
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            height: 200,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: list.length.clamp(0, 3),
              itemBuilder: (_, i) => SizedBox(
                width: 260,
                child: RestaurantCard(
                  restaurant: list[i],
                  onTap: () => context.push(
                    '/restaurant-detail',
                    extra: list[i].id,
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}
