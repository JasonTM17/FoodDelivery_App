'use client';

import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface SupportTicketReplyComposerProps {
  value: string;
  replying: boolean;
  error: string;
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
  copy,
  onChange,
  onSend,
}: SupportTicketReplyComposerProps) {
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
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{copy.markdownSupported}</span>
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
