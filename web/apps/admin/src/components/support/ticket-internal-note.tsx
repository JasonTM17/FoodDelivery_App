'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';

interface TicketInternalNoteProps {
  onSubmit: (body: string) => Promise<void>;
  className?: string;
}

export default function TicketInternalNote({ onSubmit, className }: TicketInternalNoteProps) {
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSubmit = async () => {
    if (!body.trim()) return;
    setSaving(true);
    setSaveError('');
    try {
      await onSubmit(body);
      setBody('');
    } catch (err) {
      setSaveError((err as { message?: string }).message || 'Không thể lưu ghi chú nội bộ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn('space-y-2', className)} data-testid="internal-note">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        <span>Chỉ hiển thị cho đội hỗ trợ</span>
      </div>
      <Textarea
        placeholder="Ghi chú nội bộ..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        className="border-yellow-300 bg-yellow-50/30 dark:border-yellow-800 dark:bg-yellow-950/10"
        data-testid="internal-note-input"
      />
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSubmit}
          disabled={!body.trim() || saving}
        >
          {saving ? 'Đang lưu...' : 'Thêm ghi chú nội bộ'}
        </Button>
      </div>
      {saveError && <p className="text-xs text-destructive">{saveError}</p>}
    </div>
  );
}
