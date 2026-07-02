import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../l10n/app_localizations.dart';
import '../../shared/theme/app_colors.dart';
import '../../shared/theme/app_text_styles.dart';
import '../../shared/widgets/empty_state.dart';
import '../../shared/widgets/error_state.dart';
import '../../shared/widgets/loading_shimmer.dart';
import '../providers/search_provider.dart';
import '../widgets/search_filter_chips.dart';
import '../router/route_names.dart';

class SearchResultsScreen extends ConsumerStatefulWidget {
  final String initialQuery;
  const SearchResultsScreen({super.key, this.initialQuery = ''});

  @override
  ConsumerState<SearchResultsScreen> createState() =>
      _SearchResultsScreenState();
}

class _SearchResultsScreenState extends ConsumerState<SearchResultsScreen> {
  final _searchController = TextEditingController();
  bool _hasSearched = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialQuery.isNotEmpty) {
      _searchController.text = widget.initialQuery;
      Future.microtask(() {
        ref.read(searchProvider.notifier).search(widget.initialQuery);
        setState(() => _hasSearched = true);
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _performSearch() {
    final query = _searchController.text.trim();
    if (query.isEmpty) return;
    setState(() => _hasSearched = true);
    ref.read(searchProvider.notifier).search(query);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(searchProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: const BackButton(color: AppColors.textPrimary),
        title: SizedBox(
          height: 40,
          child: TextField(
            controller: _searchController,
            autofocus: widget.initialQuery.isEmpty,
            onSubmitted: (_) => _performSearch(),
            onChanged: (v) => ref.read(searchProvider.notifier).updateQuery(v),
            decoration: InputDecoration(
              hintText: l10n.searchInputHint,
              hintStyle: AppTextStyles.bodySmall.copyWith(
                color: AppColors.textHint,
              ),
              prefixIcon: const Icon(
                Icons.search,
                size: 20,
                color: AppColors.textSecondary,
              ),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, size: 18),
                      onPressed: () {
                        _searchController.clear();
                        ref.read(searchProvider.notifier).updateQuery('');
                        setState(() => _hasSearched = false);
                      },
                    )
                  : null,
              filled: true,
              fillColor: AppColors.surface,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 8,
              ),
            ),
          ),
        ),
        centerTitle: false,
        titleSpacing: 0,
        actions: [
          TextButton(
            onPressed: _searchController.text.trim().isNotEmpty
                ? _performSearch
                : null,
            child: Text(
              l10n.searchButtonLabel,
              style: TextStyle(
                color: _searchController.text.trim().isNotEmpty
                    ? AppColors.primary
                    : AppColors.textHint,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
      body: _buildBody(state),
    );
  }

  Widget _buildBody(SearchState state) {
    final l10n = AppLocalizations.of(context);

    if (!_hasSearched) {
      return _buildRecentSearches(state);
    }
    if (state.isLoading) {
      return const LoadingShimmer(type: ShimmerType.restaurant, itemCount: 4);
    }
    if (state.error != null) {
      return ErrorState(message: state.error!, onRetry: _performSearch);
    }
    return Column(
      children: [
        // Filter chips
        SearchFilterChips(
          selectedSort: state.sort,
          onChanged: (sort) =>
              ref.read(searchProvider.notifier).updateSort(sort),
          labels: {
            SearchSort.nearest: l10n.searchFilterNearest,
            SearchSort.topRated: l10n.searchFilterTopRated,
            SearchSort.priceLowHigh: l10n.searchFilterPriceLowHigh,
            SearchSort.openNow: l10n.searchFilterOpenNow,
          },
        ),
        // Results
        Expanded(child: _buildResults(state)),
      ],
    );
  }

  Widget _buildRecentSearches(SearchState state) {
    final l10n = AppLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (state.recentSearches.isNotEmpty) ...[
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  l10n.searchRecentLabel,
                  style: AppTextStyles.bodySmall.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                GestureDetector(
                  onTap: () =>
                      ref.read(searchProvider.notifier).clearRecentSearches(),
                  child: Text(
                    l10n.searchClearAll,
                    style: AppTextStyles.caption.copyWith(
                      color: AppColors.error,
                    ),
                  ),
                ),
              ],
            ),
          ),
          ...state.recentSearches.map(
            (term) => ListTile(
              dense: true,
              leading: const Icon(
                Icons.history,
                size: 18,
                color: AppColors.textHint,
              ),
              title: Text(term, style: AppTextStyles.bodyMedium),
              onTap: () {
                _searchController.text = term;
                _performSearch();
              },
            ),
          ),
        ],
        Expanded(
          child: EmptyState(
            icon: Icons.search_outlined,
            title: l10n.searchEmptyTitle,
            subtitle: l10n.searchEmptySubtitle,
          ),
        ),
      ],
    );
  }

  Widget _buildResults(SearchState state) {
    final l10n = AppLocalizations.of(context);
    if (state.results.isEmpty) {
      return EmptyState(
        icon: Icons.search_off,
        title: l10n.searchNoResults(state.query),
        subtitle: l10n.searchNoResultsSubtitle,
      );
    }
    return RefreshIndicator(
      onRefresh: () async => _performSearch(),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: state.results.length,
        itemBuilder: (context, index) => _buildResultCard(state.results[index]),
      ),
    );
  }

  Widget _buildResultCard(SearchResultItem item) {
    return GestureDetector(
      onTap: () {
        if (item.type == 'restaurant') {
          context.push(Routes.restaurantDetail, extra: item.id);
        } else {
          context.push(
            Routes.foodDetail,
            extra: {'item': item, 'restaurantName': item.subtitle ?? ''},
          );
        }
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
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
              child: item.imageUrl.isNotEmpty
                  ? Image.network(
                      item.imageUrl,
                      width: 72,
                      height: 72,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        width: 72,
                        height: 72,
                        color: AppColors.surface,
                        child: const Icon(
                          Icons.image,
                          color: AppColors.textHint,
                        ),
                      ),
                    )
                  : Container(
                      width: 72,
                      height: 72,
                      color: AppColors.surface,
                      child: const Icon(Icons.image, color: AppColors.textHint),
                    ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.name,
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  if (item.rating != null)
                    Row(
                      children: [
                        const Icon(
                          Icons.star,
                          color: AppColors.accent,
                          size: 14,
                        ),
                        const SizedBox(width: 2),
                        Text(
                          item.rating!.toStringAsFixed(1),
                          style: AppTextStyles.caption,
                        ),
                        const SizedBox(width: 4),
                        if (item.distanceKm != null)
                          Text(
                            '${item.distanceKm!.toStringAsFixed(1)} km',
                            style: AppTextStyles.caption,
                          ),
                      ],
                    ),
                  if (item.subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      item.subtitle!,
                      style: AppTextStyles.caption,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  if (item.price != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      _formatCurrency(item.price!),
                      style: AppTextStyles.priceSmall,
                    ),
                  ],
                ],
              ),
            ),
            if (!item.isOpen)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.error.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  AppLocalizations.of(context)!.searchClosedBadge,
                  style: AppTextStyles.caption.copyWith(
                    color: AppColors.error,
                    fontWeight: FontWeight.w600,
                    fontSize: 10,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _formatCurrency(int vnd) {
    if (vnd >= 1000) {
      return '${(vnd / 1000).round()}K₫';
    }
    return '$vnd₫';
  }
}
