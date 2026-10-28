'use client';

import { useMemo, useState } from 'react';
import { Button, cn } from '@foodflow/ui';
import { Minus, Plus, X } from 'lucide-react';
import { computeUnitPrice, validateSelections } from '@/lib/cart-utils';
import { formatVnd } from '@/lib/format';
import type { MenuItem, MenuItemOption, SelectedOption } from '@/lib/types';

interface Props {
  item: MenuItem;
  restaurantName?: string;
  open: boolean;
  onClose: () => void;
  onAdd: (input: {
    item: MenuItem;
    quantity: number;
    selectedOptions: SelectedOption[];
    notes?: string;
  }) => void;
}

export function MenuItemDialog({ item, restaurantName, open, onClose, onAdd }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selectedOptions = useMemo<SelectedOption[]>(() => {
    const out: SelectedOption[] = [];
    for (const option of item.options ?? []) {
      const ids = selections[option.id] ?? [];
      for (const valueId of ids) {
        const value = option.values.find((v) => v.id === valueId);
        if (!value) continue;
        out.push({
          optionId: option.id,
          valueId,
          optionName: option.name,
          valueName: value.value,
          priceModifier: value.priceModifier,
        });
      }
    }
    return out;
  }, [item.options, selections]);

  const unitPrice = computeUnitPrice(item.basePrice, selectedOptions);

  if (!open) return null;

  const toggle = (option: MenuItemOption, valueId: string) => {
    setError(null);
    setSelections((current) => {
      const prev = current[option.id] ?? [];
      if (!option.isMultiple) {
        return { ...current, [option.id]: prev.includes(valueId) ? [] : [valueId] };
      }
      if (prev.includes(valueId)) {
        return { ...current, [option.id]: prev.filter((id) => id !== valueId) };
      }
      return { ...current, [option.id]: [...prev, valueId] };
    });
  };

  const handleAdd = () => {
    const invalid = validateSelections(item, selectedOptions);
    if (invalid === 'CART_OPTION_REQUIRED') {
      setError('Select the required options.');
      return;
    }
    if (invalid) {
      setError('Those options are not available.');
      return;
    }
    onAdd({ item, quantity, selectedOptions, notes: notes.trim() || undefined });
    setQuantity(1);
    setSelections({});
    setNotes('');
    setError(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.name}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl">
        <div className="relative h-44 shrink-0 bg-orange-100">
          {item.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <h2 className="text-lg font-semibold text-gray-900">{item.name}</h2>
          {restaurantName && <p className="text-xs text-muted-foreground">{restaurantName}</p>}
          {item.description && (
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
          )}
          <p className="mt-2 font-semibold text-primary">{formatVnd(unitPrice)}</p>

          {(item.options ?? []).map((option) => {
            const picked = selections[option.id] ?? [];
            const single = !option.isMultiple;
            return (
              <fieldset key={option.id} className="mt-4">
                <legend className="text-sm font-medium text-gray-900">
                  {option.name}
                  {option.isRequired && <span className="ml-1 text-red-500">*</span>}
                </legend>
                <div className="mt-2 space-y-1.5">
                  {option.values.map((value) => {
                    const checked = picked.includes(value.id);
                    return (
                      <label
                        key={value.id}
                        className={cn(
                          'flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors',
                          checked
                            ? 'border-primary bg-orange-50 font-medium'
                            : 'border-border hover:border-primary/50',
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <input
                            type={single ? 'radio' : 'checkbox'}
                            name={`opt-${option.id}`}
                            checked={checked}
                            onChange={() => toggle(option, value.id)}
                            className="h-4 w-4 accent-primary"
                          />
                          {value.value}
                        </span>
                        {value.priceModifier !== 0 && (
                          <span className="text-xs text-muted-foreground">
                            +{formatVnd(value.priceModifier)}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          <label className="mt-4 block">
            <span className="label">Notes for the kitchen</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={200}
              className="input-field resize-none"
              placeholder="Optional"
            />
          </label>

          {error && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="safe-bottom flex items-center gap-3 border-t p-4">
          <div className="flex items-center rounded-lg border">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="p-2.5 text-gray-700 disabled:opacity-40"
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" aria-hidden />
            </button>
            <span aria-live="polite" className="min-w-8 text-center text-sm font-semibold">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              className="p-2.5 text-gray-700"
            >
              <Plus className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <Button className="flex-1" onClick={handleAdd}>
            Add · {formatVnd(unitPrice * quantity)}
          </Button>
        </div>
      </div>
    </div>
  );
}
