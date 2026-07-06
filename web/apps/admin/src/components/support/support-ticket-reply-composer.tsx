'use client';

import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import TicketMacroPicker from '@/components/support/ticket-macro-picker';
import type { MacroContext, MacroTemplate } from '@/lib/macro-engine';

interface SupportTicketReplyComposerProps {
  value: string;
  replying: boolean;
  error: string;
  macros: MacroTemplate[];
  macroContext: MacroContext;
  macroStatus: string;
  copy: {
    placeholder: string;
    markdownSupported: string;
    send: string;
    sending: string;
  };
  onChange: (value: string) => void;
  onSend: () => void;
}

export default function SupportTicketReplyComposer({
  value,
  replying,
  error,
  macros,
  macroContext,
  macroStatus,
  copy,
  onChange,
  onSend,
}: SupportTicketReplyComposerProps) {
  const insertMacro = (body: string) => {
    onChange(value.trim() ? `${value.trimEnd()}\n\n${body}` : body);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <Textarea
          placeholder={copy.placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className="mb-3"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <TicketMacroPicker
              macros={macros}
              context={macroContext}
              onSelect={insertMacro}
              className="shrink-0"
            />
            <span className="text-xs text-muted-foreground">{copy.markdownSupported}</span>
            {macroStatus ? (
              <span className="text-xs text-muted-foreground" data-testid="macro-status">
                {macroStatus}
              </span>
            ) : null}
          </div>
          <Button onClick={onSend} disabled={!value.trim() || replying}>
            <Send className="mr-2 h-4 w-4" />
            {replying ? copy.sending : copy.send}
          </Button>
        </div>
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
