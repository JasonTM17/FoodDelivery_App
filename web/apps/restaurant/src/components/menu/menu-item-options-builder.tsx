'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import type { MenuItemOption, MenuItemChoice } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MenuItemOptionsBuilderProps {
  options: MenuItemOption[];
  onChange: (options: MenuItemOption[]) => void;
  maxOptions?: number;
}

export function MenuItemOptionsBuilder({ options, onChange, maxOptions = 5 }: MenuItemOptionsBuilderProps) {
  const addOption = () => {
    if (options.length >= maxOptions) return;
    onChange([
      ...options,
      { id: crypto.randomUUID(), name: '', type: 'single', required: false, choices: [] },
    ]);
  };

  const updateOption = (index: number, field: keyof MenuItemOption, value: unknown) => {
    const updated = [...options];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  const addChoice = (optionIndex: number) => {
    const option = options[optionIndex];
    if (option.choices.length >= 10) return;
    const updated = [...options];
    updated[optionIndex] = {
      ...option,
      choices: [...option.choices, { id: crypto.randomUUID(), name: '', price: 0 }],
    };
    onChange(updated);
  };

  const updateChoice = (optionIndex: number, choiceIndex: number, field: keyof MenuItemChoice, value: unknown) => {
    const updated = [...options];
    const choices = [...updated[optionIndex].choices];
    choices[choiceIndex] = { ...choices[choiceIndex], [field]: value };
    updated[optionIndex] = { ...updated[optionIndex], choices };
    onChange(updated);
  };

  const removeChoice = (optionIndex: number, choiceIndex: number) => {
    const updated = [...options];
    updated[optionIndex] = {
      ...updated[optionIndex],
      choices: updated[optionIndex].choices.filter((_, i) => i !== choiceIndex),
    };
    onChange(updated);
  };

  return (
    <div className="space-y-4" data-testid="menu-item-options-builder">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">Tuỳ chọn món ({options.length}/{maxOptions})</h4>
        <button
          type="button"
          onClick={addOption}
          disabled={options.length >= maxOptions}
          className="btn-secondary text-xs py-1.5 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Thêm tùy chọn
        </button>
      </div>

      {options.length >= maxOptions && (
        <p className="text-xs text-amber-600">Tối đa {maxOptions} tùy chọn</p>
      )}

      <div className="space-y-3">
        {options.map((option, oi) => (
          <div key={option.id} className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="label">Tên tùy chọn</label>
                  <input
                    type="text"
                    value={option.name}
                    onChange={(e) => updateOption(oi, 'name', e.target.value)}
                    className="input-field text-sm"
                    placeholder="VD: Kích cỡ"
                  />
                </div>
                <div>
                  <label className="label">Kiểu</label>
                  <select
                    value={option.type}
                    onChange={(e) => updateOption(oi, 'type', e.target.value)}
                    className="select-field text-sm"
                  >
                    <option value="single">Chọn 1</option>
                    <option value="multi">Chọn nhiều</option>
                  </select>
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={option.required}
                      onChange={(e) => updateOption(oi, 'required', e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Bắt buộc</span>
                  </label>
                  <button type="button" onClick={() => removeOption(oi)} className="btn-ghost text-red-500 p-1 ml-auto">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="ml-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Lựa chọn ({option.choices.length}/10)</span>
                <button
                  type="button"
                  onClick={() => addChoice(oi)}
                  disabled={option.choices.length >= 10}
                  className="btn-ghost text-xs text-brand-600 disabled:opacity-50"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Thêm lựa chọn
                </button>
              </div>
              {option.choices.map((choice, ci) => (
                <div key={choice.id} className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-gray-300 shrink-0" />
                  <input
                    type="text"
                    value={choice.name}
                    onChange={(e) => updateChoice(oi, ci, 'name', e.target.value)}
                    className="input-field flex-1 text-sm"
                    placeholder="Tên lựa chọn"
                  />
                  <input
                    type="number"
                    value={choice.price || ''}
                    onChange={(e) => updateChoice(oi, ci, 'price', parseFloat(e.target.value) || 0)}
                    className="input-field w-24 text-sm"
                    placeholder="Phụ thu"
                  />
                  <button type="button" onClick={() => removeChoice(oi, ci)} className="btn-ghost text-red-500 p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
