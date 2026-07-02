'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type {
  AdminPromotion,
  AdminPromotionFormData,
  AdminPromotionType,
} from './admin-promotions-types';

interface AdminPromotionDialogProps {
  editingPromotion: AdminPromotion | null;
  formData: AdminPromotionFormData;
  open: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  onUpdateField: <K extends keyof AdminPromotionFormData>(
    field: K,
    value: AdminPromotionFormData[K],
  ) => void;
}

export function AdminPromotionDialog(props: AdminPromotionDialogProps) {
  const t = useTranslations('adminPromotionManagement');
  const isEditing = props.editingPromotion !== null;

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t(isEditing ? 'editTitle' : 'createTitle')}</DialogTitle>
          <DialogDescription>{t(isEditing ? 'editDescription' : 'createDescription')}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('fields.code')} htmlFor="code">
              <Input id="code" placeholder="WELCOME10" value={props.formData.code} onChange={event => props.onUpdateField('code', event.target.value)} disabled={isEditing} />
            </Field>
            <Field label={t('fields.type')} htmlFor="type">
              <Select value={props.formData.type} onValueChange={value => props.onUpdateField('type', value as AdminPromotionType)}>
                <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">{t('types.percentage')}</SelectItem>
                  <SelectItem value="fixed">{t('types.fixed')}</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t(props.formData.type === 'percentage' ? 'fields.percentageValue' : 'fields.fixedValue')} htmlFor="value">
              <Input id="value" type="number" placeholder={props.formData.type === 'percentage' ? '10' : '50000'} value={props.formData.value} onChange={event => props.onUpdateField('value', event.target.value)} />
            </Field>
            <Field label={t('fields.minOrder')} htmlFor="minOrder">
              <Input id="minOrder" type="number" placeholder="0" value={props.formData.minOrder} onChange={event => props.onUpdateField('minOrder', event.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('fields.maxDiscount')} htmlFor="maxDiscount">
              <Input id="maxDiscount" type="number" placeholder="0" value={props.formData.maxDiscount} onChange={event => props.onUpdateField('maxDiscount', event.target.value)} />
            </Field>
            <Field label={t('fields.usageLimit')} htmlFor="usageLimit">
              <Input id="usageLimit" type="number" placeholder={t('usageUnlimited')} value={props.formData.usageLimit} onChange={event => props.onUpdateField('usageLimit', event.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('fields.startDate')} htmlFor="startDate">
              <Input id="startDate" type="date" value={props.formData.startDate} onChange={event => props.onUpdateField('startDate', event.target.value)} />
            </Field>
            <Field label={t('fields.endDate')} htmlFor="endDate">
              <Input id="endDate" type="date" value={props.formData.endDate} onChange={event => props.onUpdateField('endDate', event.target.value)} />
            </Field>
          </div>

          <Field label={t('fields.description')} htmlFor="description">
            <Textarea id="description" placeholder={t('descriptionPlaceholder')} value={props.formData.description} onChange={event => props.onUpdateField('description', event.target.value)} />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>{t('cancel')}</Button>
          <Button onClick={props.onSave} disabled={props.saving}>
            {props.saving ? t('saving') : t(isEditing ? 'update' : 'createAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ children, htmlFor, label }: { children: React.ReactNode; htmlFor: string; label: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
