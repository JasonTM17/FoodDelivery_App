import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/loading_shimmer.dart';
import '../providers/favorites_provider.dart';
import '../widgets/favorites_grid.dart';

class FavoritesScreen extends ConsumerStatefulWidget {
  const FavoritesScreen({super.key});

  @override
  ConsumerState<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends ConsumerState<FavoritesScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(favoritesProvider.notifier).fetchFavorites());
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(favoritesProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: const BackButton(color: AppColors.textPrimary),
        title: const Text(
          'Yêu thích',
          style: AppTextStyles.headline3,
        ),
        centerTitle: true,
      ),
      body: _buildBody(state),
    );
  }

  Widget _buildBody(FavoritesState state) {
    if (state.isLoading && state.items.isEmpty) {
      return const LoadingShimmer(type: ShimmerType.restaurant, itemCount: 4);
    }
    if (state.error != null && state.items.isEmpty) {
      return ErrorState(
        message: state.error!,
        onRetry: () => ref.read(favoritesProvider.notifier).fetchFavorites(),
      );
    }
    if (state.items.isEmpty) {
      return EmptyState(
        icon: Icons.favorite_border,
        title: 'Chưa có nhà hàng yêu thích',
        subtitle: 'Hãy khám phá và thêm vào danh sách yêu thích của bạn',
        actionLabel: 'Khám phá nhà hàng',
        onAction: () => Navigator.of(context).pushReplacementNamed('/home'),
      );
    }
    return RefreshIndicator(
      onRefresh: () => ref.read(favoritesProvider.notifier).fetchFavorites(),
      child: FavoritesGrid(
        items: state.items,
        onToggle: (id) => ref.read(favoritesProvider.notifier).toggle(id, type: 'restaurant'),
        togglingIds: state.togglingIds,
      ),
    );
  }
}
