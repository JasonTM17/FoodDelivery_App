import 'package:flutter_riverpod/flutter_riverpod.dart';

enum TripStatusFilter { all, pending, completed, cancelled }

class TripHistoryFilter {
  final DateTime? fromDate;
  final DateTime? toDate;
  final TripStatusFilter statusFilter;
  final int currentPage;
  final bool hasMore;
  final bool isLoading;
  final String? error;

  const TripHistoryFilter({
    this.fromDate,
    this.toDate,
    this.statusFilter = TripStatusFilter.all,
    this.currentPage = 1,
    this.hasMore = true,
    this.isLoading = false,
    this.error,
  });

  TripHistoryFilter copyWith({
    DateTime? fromDate,
    DateTime? toDate,
    TripStatusFilter? statusFilter,
    int? currentPage,
    bool? hasMore,
    bool? isLoading,
    String? error,
  }) {
    return TripHistoryFilter(
      fromDate: fromDate ?? this.fromDate,
      toDate: toDate ?? this.toDate,
      statusFilter: statusFilter ?? this.statusFilter,
      currentPage: currentPage ?? this.currentPage,
      hasMore: hasMore ?? this.hasMore,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  Map<String, dynamic> toQueryParams() {
    final params = <String, dynamic>{'page': currentPage};
    if (fromDate != null) params['from'] = fromDate!.toIso8601String();
    if (toDate != null) params['to'] = toDate!.toIso8601String();
    if (statusFilter != TripStatusFilter.all) {
      params['status'] = statusFilter.name;
    }
    return params;
  }

  String? get dateRangeLabel {
    if (fromDate == null && toDate == null) return null;
    final fmt = (DateTime d) =>
        '${d.day}/${d.month}/${d.year}';
    if (fromDate != null && toDate != null) {
      return '${fmt(fromDate!)} - ${fmt(toDate!)}';
    }
    if (fromDate != null) return 'Từ ${fmt(fromDate!)}';
    return 'Đến ${fmt(toDate!)}';
  }
}

class TripHistoryFilterNotifier extends StateNotifier<TripHistoryFilter> {
  TripHistoryFilterNotifier() : super(const TripHistoryFilter());

  void setDateRange(DateTime? from, DateTime? to) {
    state = state.copyWith(
      fromDate: from,
      toDate: to,
      currentPage: 1,
      hasMore: true,
    );
  }

  void setStatusFilter(TripStatusFilter filter) {
    state = state.copyWith(
      statusFilter: filter,
      currentPage: 1,
      hasMore: true,
    );
  }

  void setPage(int page) {
    state = state.copyWith(currentPage: page);
  }

  void clearFilters() {
    state = const TripHistoryFilter();
  }
}

final tripHistoryFilterProvider =
    StateNotifierProvider<TripHistoryFilterNotifier, TripHistoryFilter>((ref) {
  return TripHistoryFilterNotifier();
});
