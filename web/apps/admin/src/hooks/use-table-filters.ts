'use client';

import { useState } from 'react';

interface UseTableFiltersOptions {
  initialPage?: number;
  initialFilter?: string;
}

export function useTableFilters({
  initialPage = 1,
  initialFilter = 'all',
}: UseTableFiltersOptions = {}) {
  const [page, setPage] = useState(initialPage);
  const [filter, setFilter] = useState(initialFilter);

  const setFilterAndReset = (value: string) => {
    setFilter(value);
    setPage(1);
  };

  const prevPage = () => setPage((p) => Math.max(1, p - 1));
  const nextPage = (max: number) => setPage((p) => (p < max ? p + 1 : p));

  return {
    page,
    setPage,
    filter,
    setFilter: setFilterAndReset,
    prevPage,
    nextPage,
  };
}
