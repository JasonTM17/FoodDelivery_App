'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Pause, Play, Trash2, type LucideIcon } from 'lucide-react';
import { apiPatch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface RestaurantStatusToggleProps {
  restaurantId: string;
  currentStatus: string;
  restaurantName: string;
}

type RestaurantStatusAction = 'pause' | 'activate' | 'delete';

const actionIcons: Record<RestaurantStatusAction, LucideIcon> = {
  pause: Pause,
  activate: Play,
  delete: Trash2,
};

export default function RestaurantStatusToggle({
  restaurantId,
  currentStatus,
  restaurantName,
}: RestaurantStatusToggleProps) {
  const t = useTranslations('restaurantStatusToggle');
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [action, setAction] = useState<RestaurantStatusAction>('pause');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const openConfirm = (nextAction: RestaurantStatusAction) => {
    setAction(nextAction);
    setReason('');
    setActionError('');
    setConfirmOpen(true);
  };

  const executeAction = async () => {
    setLoading(true);
    setActionError('');
    try {
      const status = action === 'delete' ? 'deleted' : action === 'activate' ? 'active' : 'disabled';
      await apiPatch(`/admin/restaurants/${restaurantId}/status`, { status, reason });
      queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] });
      setConfirmOpen(false);
    } catch (err) {
      setActionError((err as { message?: string }).message || t('updateError'));
    } finally {
      setLoading(false);
    }
  };

  const Icon = actionIcons[action];

  return (
    <>
      <div className="flex items-center gap-2">
        {currentStatus === 'active' ? (
          <Button variant="outline" size="sm" onClick={() => openConfirm('pause')}>
            <Pause className="mr-1.5 h-4 w-4" />
            {t('pause')}
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={() => openConfirm('activate')}>
            <Play className="mr-1.5 h-4 w-4" />
            {t('activateAgain')}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => openConfirm('delete')}
        >
          <Trash2 className="mr-1.5 h-4 w-4" />
          {t('delete')}
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-destructive" />
              {t(`confirm.${action}.title`, { name: restaurantName })}
            </DialogTitle>
            <DialogDescription>{t(`confirm.${action}.description`)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="restaurant-status-reason">
              {t('reasonLabel')}
            </label>
            <Textarea
              id="restaurant-status-reason"
              placeholder={t('reasonPlaceholder')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>
          {actionError && <p className="text-sm text-destructive">{actionError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant={action === 'delete' ? 'destructive' : 'default'}
              onClick={executeAction}
              disabled={loading}
            >
              {loading ? t('processing') : t(`confirm.${action}.action`)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
