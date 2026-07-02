'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, XCircle, UserCheck, AlertTriangle, Tag, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface BulkAction {
  id: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresValue?: boolean;
}

const bulkActions: BulkAction[] = [
  { id: 'close', labelKey: 'close', icon: XCircle },
  { id: 'assign', labelKey: 'assign', icon: UserCheck, requiresValue: true },
  { id: 'change_priority', labelKey: 'changePriority', icon: AlertTriangle, requiresValue: true },
  { id: 'add_tag', labelKey: 'addTag', icon: Tag, requiresValue: true },
  { id: 'export', labelKey: 'export', icon: Download },
];

interface AssigneeOption {
  id: string;
  name: string;
}

interface TicketBulkActionsProps {
  selectedIds: string[];
  totalCount: number;
  assignees?: AssigneeOption[];
  onClearSelection: () => void;
  onBulkAction: (action: string, value?: string, reason?: string) => Promise<void>;
  className?: string;
}

export default function TicketBulkActions({
  selectedIds,
  totalCount,
  assignees = [],
  onClearSelection,
  onBulkAction,
  className,
}: TicketBulkActionsProps) {
  const t = useTranslations('bulkActions');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [actionValue, setActionValue] = useState('');
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [bulkError, setBulkError] = useState('');

  if (selectedIds.length === 0) return null;

  const handleExecute = async () => {
    setProcessing(true);
    setBulkError('');
    try {
      await onBulkAction(selectedAction, actionValue || undefined, reason || undefined);
      setDialogOpen(false);
      setSelectedAction('');
      setActionValue('');
      setReason('');
      onClearSelection();
    } catch (err) {
      setBulkError((err as { message?: string }).message || t('error'));
    } finally {
      setProcessing(false);
    }
  };

  const action = bulkActions.find((a) => a.id === selectedAction);

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm',
          className
        )}
        data-testid="bulk-actions-bar"
      >
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {t('selectedCount', { selected: selectedIds.length, total: totalCount })}
          </span>
        </div>
        <div className="flex flex-1 items-center gap-2">
          {bulkActions.map((ba) => (
            <Button
              key={ba.id}
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedAction(ba.id);
                setActionValue('');
                setReason('');
                setDialogOpen(true);
              }}
            >
              <ba.icon className="mr-1.5 h-3.5 w-3.5" />
              {t(`actions.${ba.labelKey}`)}
            </Button>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          {t('clear')}
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {action ? t(`actions.${action.labelKey}`) : t('fallbackTitle')}
            </DialogTitle>
            <DialogDescription>
              {t.rich('applyDescription', {
                count: selectedIds.length,
                badge: (chunks) => <Badge variant="secondary">{chunks}</Badge>,
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedAction === 'assign' && (
              <div className="space-y-2">
                <Label htmlFor="bulk-assignee">{t('assigneeLabel')}</Label>
                <Select value={actionValue} onValueChange={setActionValue}>
                  <SelectTrigger id="bulk-assignee">
                    <SelectValue placeholder={t('assigneePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {assignees.length > 0 ? (
                      assignees.map((assignee) => (
                        <SelectItem key={assignee.id} value={assignee.id}>{assignee.name}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__no_assignees" disabled>{t('noAssignees')}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedAction === 'change_priority' && (
              <div className="space-y-2">
                <Label htmlFor="bulk-priority">{t('priorityLabel')}</Label>
                <Select value={actionValue} onValueChange={setActionValue}>
                  <SelectTrigger id="bulk-priority">
                    <SelectValue placeholder={t('priorityPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">{t('priorities.critical')}</SelectItem>
                    <SelectItem value="high">{t('priorities.high')}</SelectItem>
                    <SelectItem value="normal">{t('priorities.normal')}</SelectItem>
                    <SelectItem value="low">{t('priorities.low')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedAction === 'add_tag' && (
              <div className="space-y-2">
                <Label htmlFor="bulk-tag">Tag</Label>
                <Select value={actionValue} onValueChange={setActionValue}>
                  <SelectTrigger id="bulk-tag">
                    <SelectValue placeholder={t('tagPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="refund">{t('tags.refund')}</SelectItem>
                    <SelectItem value="delivery">{t('tags.delivery')}</SelectItem>
                    <SelectItem value="quality">{t('tags.quality')}</SelectItem>
                    <SelectItem value="spam">Spam</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {(selectedAction === 'close' || selectedAction === 'change_priority') && (
              <div className="space-y-2">
                <Label htmlFor="bulk-reason">{t('reasonLabel')}</Label>
                <Textarea
                  id="bulk-reason"
                  placeholder={t('reasonPlaceholder')}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                />
              </div>
            )}
          </div>

          {bulkError && <p className="text-sm text-destructive">{bulkError}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleExecute}
              disabled={processing || (bulkActions.find((a) => a.id === selectedAction)?.requiresValue && !actionValue)}
            >
              {processing ? t('processing') : t('applyButton', { count: selectedIds.length })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
