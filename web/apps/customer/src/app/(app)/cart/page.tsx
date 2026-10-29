'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Input } from '@foodflow/ui';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-provider';
import { useCart } from '@/lib/cart-store';
import { formatVnd } from '@/lib/format';
import { useLanguage } from '@/lib/language-context';
import { EmptyBlock } from '@/components/feedback';

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const { t, locale } = useLanguage();
  const {
    cart,
    itemCount,
    subtotal,
    isSyncing,
    notice,
    error,
    dismissMessages,
    setQuantity,
    removeLine,
    clearCart,
    applyPromo,
    removePromo,
  } = useCart();
  const [promoInput, setPromoInput] = useState('');
  const [promoBusy, setPromoBusy] = useState(false);

  if (cart.items.length === 0) {
    return (
      <div className="pt-8">
        <EmptyBlock icon={ShoppingCart} title={t('cart.empty')}>
          <Button asChild variant="outline">
            <Link href="/home">{t('cart.browse')}</Link>
          </Button>
        </EmptyBlock>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t('cart.title')}</h1>
        <button
          type="button"
          onClick={clearCart}
          className="text-sm font-medium text-red-600 hover:underline"
        >
          {t('cart.clear')}
        </button>
      </div>
      {cart.restaurantName && (
        <p className="text-sm text-muted-foreground">{t('cart.from')} {cart.restaurantName}</p>
      )}

      {notice && (
        <p role="status" className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}

      <ul className="space-y-3">
        {cart.items.map((line) => (
          <li key={line.key}>
            <Card className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <h2 className="font-medium text-gray-900">{line.name}</h2>
                {line.selectedOptions && line.selectedOptions.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {line.selectedOptions.map((o) => o.valueName || o.optionName || '').filter(Boolean).join(', ')}
                  </p>
                )}
                {line.notes && (
                  <p className="text-xs text-muted-foreground italic">“{line.notes}”</p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center rounded-lg border bg-white">
                    <button
                      type="button"
                      aria-label={`Giảm số lượng ${line.name}`}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-l-lg"
                      onClick={() => setQuantity(line.key, line.quantity - 1)}
                    >
                      {line.quantity === 1 ? (
                        <Trash2 className="h-3.5 w-3.5 text-red-500" aria-hidden />
                      ) : (
                        <Minus className="h-3.5 w-3.5" aria-hidden />
                      )}
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{line.quantity}</span>
                    <button
                      type="button"
                      aria-label={`Tăng số lượng ${line.name}`}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-r-lg"
                      onClick={() => setQuantity(line.key, line.quantity + 1)}
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatVnd(line.unitPrice * line.quantity)}
                  </span>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Card className="space-y-3 p-4">
        {isAuthenticated ? (
          cart.promoCode ? (
            <div className="flex items-center justify-between text-sm">
              <span>
                {locale === 'vi' ? 'Mã ưu đãi' : 'Code'} <strong>{cart.promoCode}</strong>
              </span>
              <button
                type="button"
                onClick={removePromo}
                className="text-sm font-medium text-red-600 hover:underline"
              >
                {t('cart.removePromo')}
              </button>
            </div>
          ) : (
            <form
              className="flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                setPromoBusy(true);
                try {
                  await applyPromo(promoInput);
                  setPromoInput('');
                } catch {
                  // error surfaced via store
                } finally {
                  setPromoBusy(false);
                }
              }}
            >
              <Input
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder={t('cart.promoPlaceholder')}
                aria-label="Promotion code"
                className="flex-1"
              />
              <Button type="submit" variant="outline" disabled={promoBusy || !promoInput.trim()}>
                {t('cart.applyPromo')}
              </Button>
            </form>
          )
        ) : (
          <p className="text-sm text-muted-foreground">
            <Link href="/login?next=/cart" className="font-medium text-primary hover:underline">
              {t('nav.login')}
            </Link>{' '}
            {locale === 'vi' ? 'để áp dụng mã giảm giá.' : 'to use a promotion code.'}
          </p>
        )}

        <dl className="space-y-1.5 border-t pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('cart.subtotal')}</dt>
            <dd className="font-medium">{formatVnd(subtotal)}</dd>
          </div>
          {cart.discount > 0 && (
            <div className="flex justify-between text-green-700">
              <dt>{t('cart.discount')}</dt>
              <dd>−{formatVnd(cart.discount)}</dd>
            </div>
          )}
          <p className="pt-1 text-xs text-muted-foreground">
            {locale === 'vi' ? 'Phí giao hàng và tổng tiền được xác nhận ở bước thanh toán.' : 'Delivery fee and final total are confirmed at checkout.'}
          </p>
        </dl>

        <Button asChild className="w-full" size="lg" disabled={itemCount === 0}>
          <Link href={isAuthenticated ? '/checkout' : '/login?next=/checkout'}>
            {isAuthenticated ? t('cart.checkoutBtn') : (locale === 'vi' ? 'Đăng nhập để đặt hàng' : 'Sign in to checkout')}
          </Link>
        </Button>
      </Card>
    </div>
  );
}
