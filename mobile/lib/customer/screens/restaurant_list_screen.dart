import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../shared/providers/restaurant_provider.dart';
import '../../shared/models/restaurant.dart';
import '../../shared/maps/lat_lng_validation.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/widgets/restaurant_card.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/vietnam_boundary_overlay.dart';
import '../../shared/utils/app_error_messages.dart';
import '../../shared/utils/cuisine_labels.dart';
import '../providers/restaurant_filter_provider.dart';
import '../widgets/category_chip.dart';
import '../../l10n/app_localizations.dart';

const _defaultCamera = CameraPosition(
  target: LatLng(10.7769, 106.7009),
  zoom: 12.5,
);

class _RestaurantFilterOption {
  final String id;
  final String label;

  const _RestaurantFilterOption({required this.id, required this.label});
}

class RestaurantListScreen extends ConsumerStatefulWidget {
  const RestaurantListScreen({super.key});

  @override
  ConsumerState<RestaurantListScreen> createState() =>
      _RestaurantListScreenState();
}

class _RestaurantListScreenState extends ConsumerState<RestaurantListScreen> {
  Set<Polygon> _boundaryPolygons = {};
  Position? _currentLocation;

  @override
  void initState() {
    super.initState();
    _loadBoundary();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadNearbyRestaurants();
    });
  }

  Future<void> _loadBoundary() async {
    final polygons = await VietnamBoundaryOverlay.polygons;
    if (mounted) setState(() => _boundaryPolygons = polygons);
  }

  Future<void> _loadNearbyRestaurants() async {
    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );
      if (!mounted) return;
      _currentLocation = position;
      await ref
          .read(restaurantProvider.notifier)
          .fetchNearbyRestaurants(
            latitude: position.latitude,
            longitude: position.longitude,
          );
    } catch (_) {
      if (!mounted) return;
      await ref.read(restaurantProvider.notifier).fetchNearbyRestaurants();
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final filter = ref.watch(restaurantFilterProvider);
    final restaurants = ref.watch(restaurantProvider);
    final visibleRestaurants = _filteredRestaurants(restaurants, filter);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: BackButton(color: AppColors.textPrimary),
        title: Text(l10n.restaurantListTitle, style: AppTextStyles.headline3),
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
          _buildViewToggle(filter.viewMode, l10n),
          _buildFilterChips(
            filter.selectedFilterId,
            restaurants.nearbyRestaurants,
            l10n,
          ),
          Expanded(
            child: restaurants.isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: AppColors.primary),
                  )
                : restaurants.error != null
                ? ErrorState(
                    message: localizeAppError(l10n, restaurants.error!),
                    onRetry: _loadNearbyRestaurants,
                  )
                : filter.viewMode == RestaurantViewMode.list
                ? _buildListView(visibleRestaurants, l10n)
                : _buildMapView(visibleRestaurants),
          ),
        ],
      ),
    );
  }

  List<RestaurantModel> _filteredRestaurants(
    RestaurantState state,
    RestaurantFilterState filter,
  ) {
    final cuisine = RestaurantFilterIds.cuisineValue(filter.selectedFilterId);
    if (cuisine != null) {
      return state.nearbyRestaurants
          .where((restaurant) => restaurant.cuisineTypes.contains(cuisine))
          .toList(growable: false);
    }
    if (filter.selectedFilterId == RestaurantFilterIds.openNow) {
      return state.nearbyRestaurants
          .where((restaurant) => restaurant.isOpen)
          .toList(growable: false);
    }
    return state.nearbyRestaurants;
  }

  Widget _buildViewToggle(RestaurantViewMode current, AppLocalizations l10n) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            _pill(l10n.restaurantViewList, RestaurantViewMode.list, current),
            _pill(l10n.restaurantViewMap, RestaurantViewMode.map, current),
          ],
        ),
      ),
    );
  }

  Widget _pill(
    String label,
    RestaurantViewMode mode,
    RestaurantViewMode current,
  ) {
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
              color: active ? AppColors.textOnPrimary : AppColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFilterChips(
    String selected,
    List<RestaurantModel> restaurants,
    AppLocalizations l10n,
  ) {
    final cuisines =
        restaurants
            .expand((restaurant) => restaurant.cuisineTypes)
            .map((cuisine) => cuisine.trim())
            .where((cuisine) => cuisine.isNotEmpty)
            .toSet()
            .toList()
          ..sort();
    final filters = [
      _RestaurantFilterOption(
        id: RestaurantFilterIds.all,
        label: l10n.cuisineAll,
      ),
      _RestaurantFilterOption(
        id: RestaurantFilterIds.nearest,
        label: l10n.searchFilterNearest,
      ),
      ...cuisines.map(
        (cuisine) => _RestaurantFilterOption(
          id: RestaurantFilterIds.cuisine(cuisine),
          label: localizedCuisineLabel(l10n, cuisine),
        ),
      ),
      _RestaurantFilterOption(
        id: RestaurantFilterIds.openNow,
        label: l10n.searchFilterOpenNow,
      ),
    ];
    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: filters.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (_, i) {
          final filter = filters[i];
          return CategoryChip(
            label: filter.label,
            isSelected: filter.id == selected,
            onTap: () => ref
                .read(restaurantFilterProvider.notifier)
                .setFilter(filter.id),
          );
        },
      ),
    );
  }

  Widget _buildListView(
    List<RestaurantModel> restaurants,
    AppLocalizations l10n,
  ) {
    if (restaurants.isEmpty) {
      return EmptyState(
        icon: Icons.store_mall_directory_outlined,
        title: l10n.restaurantNoResults,
        subtitle: l10n.restaurantNoResultsSubtitle,
      );
    }
    return RefreshIndicator(
      onRefresh: _loadNearbyRestaurants,
      child: ListView.builder(
        padding: const EdgeInsets.only(top: 8, bottom: 16),
        itemCount: restaurants.length,
        itemBuilder: (_, i) => RestaurantCard(
          restaurant: restaurants[i],
          onTap: () =>
              context.push('/restaurant-detail', extra: restaurants[i].id),
        ),
      ),
    );
  }

  Widget _buildMapView(List<RestaurantModel> list) {
    final markers = list
        .where((r) => isValidDeliveryLatLng(r.latitude, r.longitude))
        .map(
          (r) => Marker(
            markerId: MarkerId(r.id),
            position: LatLng(r.latitude, r.longitude),
            infoWindow: InfoWindow(title: r.name),
          ),
        )
        .toSet();

    return Stack(
      children: [
        GoogleMap(
          initialCameraPosition: _initialCameraPosition(),
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
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: list.length.clamp(0, 3),
              itemBuilder: (_, i) => SizedBox(
                width: 260,
                child: RestaurantCard(
                  restaurant: list[i],
                  onTap: () =>
                      context.push('/restaurant-detail', extra: list[i].id),
                ),
              ),
            ),
          ),
      ],
    );
  }

  CameraPosition _initialCameraPosition() {
    final location = _currentLocation;
    if (location == null) return _defaultCamera;
    return CameraPosition(
      target: LatLng(location.latitude, location.longitude),
      zoom: 13,
    );
  }
}
