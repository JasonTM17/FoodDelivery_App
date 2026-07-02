'use client';

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Search, Zap } from 'lucide-react';
import { applyMacro, type MacroTemplate, type MacroContext } from '@/lib/macro-engine';
import { useTranslations } from 'next-intl';

interface TicketMacroPickerProps {
  macros: MacroTemplate[];
  context: MacroContext;
  onSelect: (body: string, macroId: string) => void;
  className?: string;
}

export default function TicketMacroPicker({
  macros,
  context,
  onSelect,
  className,
}: TicketMacroPickerProps) {
  const t = useTranslations('macros');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = macros.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.shortcut.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, MacroTemplate[]>>((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {});

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1 rounded-md border border-dashed px-2 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors',
            className
          )}
          data-testid="macro-picker-trigger"
        >
          <Zap className="h-3 w-3" />
          /macro
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="border-b p-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="h-64">
          {Object.keys(grouped).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            <div className="p-1">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <p className="px-2 py-1 text-[10px] font-medium uppercase text-muted-foreground">
                    {category}
                  </p>
                  {items.map((m) => {
                    const preview = applyMacro(m.body, context).slice(0, 80);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        className="w-full rounded-md p-2 text-left hover:bg-accent transition-colors"
                        onClick={() => {
                          onSelect(applyMacro(m.body, context), m.id);
                          setOpen(false);
                        }}
                        data-testid={`macro-${m.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{m.name}</span>
                          <span className="text-[10px] text-muted-foreground">{m.shortcut}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <p className="text-xs text-muted-foreground truncate">{preview}...</p>
                        </div>
                        <div className="flex gap-1 mt-1">
                          {m.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px] py-0 h-4">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
