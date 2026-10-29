'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Card } from '@foodflow/ui';
import { ChevronLeft, Clock, MapPin, Star, UtensilsCrossed } from 'lucide-react';
import { api } from '@/lib/api';
import { useCart } from '@/lib/cart-store';
import { formatVnd } from '@/lib/format';
import { useLanguage } from '@/lib/language-context';
import type {
  MenuItem,
  RestaurantDetail,
  RestaurantMenu,
  RestaurantReview,
} from '@/lib/types';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '@/components/feedback';
import { MenuItemDialog } from '@/components/menu-item-dialog';

export default function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { addLine, itemCount } = useCart();
  const { t, locale } = useLanguage();
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [menu, setMenu] = useState<RestaurantMenu['categories']>([]);
  const [reviews, setReviews] = useState<RestaurantReview[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [added, setAdded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [restaurantResult, menuResult] = await Promise.all([
        api.get<RestaurantDetail>(`/restaurants/${id}`),
        api.get<RestaurantMenu>(`/restaurants/${id}/menu`),
      ]);
      setRestaurant(restaurantResult);
      setMenu(Array.isArray(menuResult?.categories) ? menuResult.categories : []);
      api
        .getPage<RestaurantReview>(`/restaurants/${id}/reviews?limit=5`)
        .then((r) => setReviews(r.items))
        .catch(() => setReviews([]));
    } catch (err) {
      setError(err instanceof Error ? err.message : (locale === 'vi' ? 'Không thể tải nhà hàng này.' : 'Could not load this restaurant.'));
    } finally {
      setLoading(false);
    }
  }, [id, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 2500);
    return () => clearTimeout(timer);
  }, [added]);

  const categories = useMemo(() => menu.filter((c) => (c.items ?? []).length > 0), [menu]);

  if (loading) return <LoadingBlock label={t('common.loading')} />;
  if (error) return <ErrorBlock message={error} onRetry={load} />;
  if (!restaurant) return <ErrorBlock message={locale === 'vi' ? 'Không tìm thấy nhà hàng.' : 'Restaurant not found.'} />;

  const closed = restaurant.isOpen === false;

  return (
    <div className="space-y-5">
      <Link
        href="/home"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-gray-900"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        {t('restaurant.back')}
      </Link>

      <header className="overflow-hidden rounded-2xl border bg-white shadow-xs">
        <div className="h-40 bg-gradient-to-r from-orange-200 to-amber-100 sm:h-52">
          {(restaurant.coverImageUrl || restaurant.logoUrl) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={restaurant.coverImageUrl ?? restaurant.logoUrl ?? ''}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="space-y-2 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{restaurant.name}</h1>
            <Badge variant={closed ? 'secondary' : 'success'}>
              {closed ? t('home.closed') : t('home.open')}
            </Badge>
          </div>
          {restaurant.description && (
            <p className="text-sm text-muted-foreground">{restaurant.description}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {restaurant.rating != null && (
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                {Number(restaurant.rating).toFixed(1)}
                {restaurant.totalReviews != null && ` (${restaurant.totalReviews} ${t('home.rating')})`}
              </span>
            )}
            {restaurant.addressLine && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" aria-hidden />
                {restaurant.addressLine}
                {restaurant.district ? `, ${restaurant.district}` : ''}
              </span>
            )}
            {restaurant.prepTimeAvgMinutes != null && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" aria-hidden />
                ~{restaurant.prepTimeAvgMinutes} {t('home.mins')}
              </span>
            )}
          </div>
        </div>
      </header>

      {closed && (
        <p role="status" className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {locale === 'vi' ? 'Nhà hàng này hiện đang tạm ngưng nhận đơn.' : 'This restaurant is not taking orders right now.'}
        </p>
      )}

      {categories.length === 0 ? (
        <EmptyBlock icon={UtensilsCrossed} title={t('restaurant.emptyMenu')} />
      ) : (
        categories.map((category) => {
          const items = category.items ?? [];
          return (
            <section key={category.id} aria-labelledby={`cat-${category.id}`}>
              <h2 id={`cat-${category.id}`} className="mb-3 text-lg font-semibold text-gray-900">
                {category.name}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {items.map((item) => {
                  const unavailable = item.isAvailable === false;
                  return (
                    <li key={item.id}>
                      <Card
                        className={`flex gap-3 p-3 ${unavailable ? 'opacity-60' : 'cursor-pointer transition-shadow hover:shadow-md'}`}
                        onClick={() => !unavailable && setActiveItem(item)}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium text-gray-900">{item.name}</h3>
                            {item.isPopular && <Badge variant="warning">{locale === 'vi' ? 'Món chạy' : 'Popular'}</Badge>}
                          </div>
                          {item.description && (
                            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                          <p className="mt-1.5 font-semibold text-primary">
                            {formatVnd(item.basePrice)}
                          </p>
                          {!unavailable && (
                            <span className="mt-1 inline-block text-xs font-medium text-primary">
                              {t('restaurant.addToCart')}
                            </span>
                          )}
                          {unavailable && (
                            <span className="mt-1 inline-block text-xs text-muted-foreground">
                              {locale === 'vi' ? 'Hết món' : 'Unavailable'}
                            </span>
                          )}
                        </div>
                        {item.imageUrl && (
                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-orange-50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}
                      </Card>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })
      )}

      {reviews && reviews.length > 0 && (
        <section aria-labelledby="reviews-heading">
          <h2 id="reviews-heading" className="mb-3 text-lg font-semibold text-gray-900">
            {t('restaurant.reviews')}
          </h2>
          <ul className="space-y-2">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-xl border bg-white p-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                    {review.foodRating ?? review.deliveryRating ?? '—'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {review.customer?.fullName ?? (locale === 'vi' ? 'Khách hàng' : 'Customer')}
                  </span>
                </div>
                {review.comment && (
                  <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {itemCount > 0 && (
        <div className="safe-bottom fixed inset-x-0 bottom-16 z-30 px-4 sm:bottom-4">
          <Button asChild className="mx-auto flex w-full max-w-md justify-between shadow-lg">
            <Link href="/cart">
              <span>{itemCount} {locale === 'vi' ? 'món trong giỏ' : `item${itemCount === 1 ? '' : 's'}`}</span>
              <span>{locale === 'vi' ? 'Xem giỏ hàng →' : 'View cart →'}</span>
            </Link>
          </Button>
        </div>
      )}

      {added && (
        <p
          role="status"
          className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full bg-gray-900 px-4 py-2 text-sm text-white shadow-lg"
        >
          {t('restaurant.added')}
        </p>
      )}

      {activeItem && (
        <MenuItemDialog
          item={activeItem}
          restaurantName={restaurant.name}
          open
          onClose={() => setActiveItem(null)}
          onAdd={({ item, quantity, selectedOptions, notes }) => {
            addLine({ item, restaurantName: restaurant.name, quantity, selectedOptions, notes });
            setAdded(true);
          }}
        />
      )}
    </div>
  );
}
