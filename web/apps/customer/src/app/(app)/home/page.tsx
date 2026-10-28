'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, cn } from '@foodflow/ui';
import { Loader2, MapPin, Search, Store } from 'lucide-react';
import { api } from '@/lib/api';
import { getCurrentLocation, type LocationState } from '@/lib/location';
import {
  toCardRestaurant,
  type NearbyRestaurant,
  type Paged,
  type SearchRestaurant,
} from '@/lib/types';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/feedback';
import { RestaurantCard } from '@/components/restaurant-card';

const CUISINES = [
  'vietnamese',
  'chinese',
  'japanese',
  'korean',
  'western',
  'fast_food',
  'healthy',
  'dessert',
];

const PAGE_SIZE = 12;

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [cuisine, setCuisine] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationState>({ status: 'idle' });
  const [nearby, setNearby] = useState<Paged<NearbyRestaurant> | null>(null);
  const [search, setSearch] = useState<Paged<SearchRestaurant> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestSeq = useRef(0);

  const usingLocation = location.status === 'granted';

  const load = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);
    try {
      if (usingLocation) {
        const params = new URLSearchParams({
          lat: String(location.lat),
          lng: String(location.lng),
          page: String(page),
          limit: String(PAGE_SIZE),
        });
        if (cuisine) params.set('cuisine', cuisine);
        params.set('radius', '10000');
        const result = await api.get<Paged<NearbyRestaurant>>(`/restaurants/nearby?${params}`);
        if (seq === requestSeq.current) setNearby(result);
        if (seq === requestSeq.current) setSearch(null);
      } else {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
        if (submittedQuery) params.set('q', submittedQuery);
        const result = await api.get<Paged<SearchRestaurant>>(`/restaurants/search?${params}`);
        if (seq === requestSeq.current) {
          setSearch(result);
          setNearby(null);
        }
      }
    } catch (err) {
      if (seq === requestSeq.current) setError(errorMessage(err));
    } finally {
      if (seq === requestSeq.current) setLoading(false);
    }
  }, [usingLocation, location, cuisine, page, submittedQuery]);

  useEffect(() => {
    void load();
  }, [load]);

  const items = useMemo(() => {
    if (usingLocation) {
      return (nearby?.items ?? []).map((restaurant) => ({
        card: toCardRestaurant(restaurant),
        distance: restaurant.dist_km,
      }));
    }
    return (search?.items ?? []).map((restaurant) => ({
      card: toCardRestaurant(restaurant),
      distance: null,
    }));
  }, [usingLocation, nearby, search]);

  const total = usingLocation ? (nearby?.total ?? 0) : (search?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const requestLocation = () => {
    setLocation({ status: 'requesting' });
    getCurrentLocation()
      .then((coords) => {
        setLocation({ status: 'granted', ...coords });
        setPage(1);
      })
      .catch((state: LocationState) => setLocation(state));
  };

  return (
    <div className="space-y-5">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setSubmittedQuery(query.trim());
        }}
        className="flex gap-2"
      >
        <label className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search restaurants or dishes"
            aria-label="Search restaurants or dishes"
            className="input-field pl-9"
          />
        </label>
        <Button type="submit" variant="outline">
          Search
        </Button>
        <Button
          type="button"
          variant={usingLocation ? 'default' : 'outline'}
          onClick={usingLocation ? () => setLocation({ status: 'idle' }) : requestLocation}
          aria-pressed={usingLocation}
          aria-label="Use my location"
          className="gap-1.5"
        >
          {location.status === 'requesting' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <MapPin className="h-4 w-4" aria-hidden />
          )}
          <span className="hidden sm:inline">Near me</span>
        </Button>
      </form>

      {location.status === 'denied' && (
        <p role="status" className="text-sm text-muted-foreground">
          Location is off — enable it in your browser to sort by distance.
        </p>
      )}

      <div className="-mx-4 overflow-x-auto px-4 scrollbar-thin" role="group" aria-label="Cuisine">
        <div className="flex gap-2 pb-1">
          <Badge
            variant={cuisine === null ? 'default' : 'outline'}
            className="cursor-pointer whitespace-nowrap px-3 py-1.5 text-xs"
            onClick={() => {
              setCuisine(null);
              setPage(1);
            }}
          >
            All
          </Badge>
          {CUISINES.map((c) => (
            <Badge
              key={c}
              variant={cuisine === c ? 'default' : 'outline'}
              className={cn('cursor-pointer whitespace-nowrap px-3 py-1.5 text-xs capitalize')}
              onClick={() => {
                setCuisine(cuisine === c ? null : c);
                setPage(1);
              }}
            >
              {c.replace('_', ' ')}
            </Badge>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingBlock label="Loading restaurants" />
      ) : error ? (
        <ErrorBlock message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyBlock icon={Store} title="No restaurants found">
          <p className="text-sm text-muted-foreground">Try a different search or filter.</p>
        </EmptyBlock>
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2">
            {items.map(({ card, distance }) => (
              <li key={card.id}>
                <RestaurantCard restaurant={card} distanceKm={distance} />
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <nav aria-label="Pages" className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'detail' in err) {
    return String((err as { detail: unknown }).detail);
  }
  return 'Could not load restaurants.';
}
