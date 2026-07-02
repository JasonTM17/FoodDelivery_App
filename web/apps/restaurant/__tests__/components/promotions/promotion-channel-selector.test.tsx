import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PromotionChannelSelector } from '@/components/promotions/promotion-channel-selector';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: Record<string, string>) => {
    const messages: Record<string, string> = {
      title: 'Distribution channels',
      toggleAria: `Toggle ${params?.channel ?? 'channel'} channel`,
      'channels.in_app.label': 'In-app',
      'channels.in_app.description': 'Show the promotion inside FoodFlow customer surfaces.',
      'channels.push.label': 'Push notification',
      'channels.push.description': 'Notify eligible customers through the push provider.',
      'channels.email.label': 'Email',
      'channels.email.description': 'Send the campaign through configured email delivery.',
      'channels.sms.label': 'SMS',
      'channels.sms.description': 'Send the campaign through configured SMS delivery.',
    };
    return messages[key] ?? key;
  },
}));

describe('PromotionChannelSelector', () => {
  it('uses localized channel copy without fake per-message pricing', () => {
    render(<PromotionChannelSelector value={['email']} onChange={vi.fn()} />);

    expect(screen.getByText('Distribution channels')).toBeVisible();
    expect(screen.getByText('Email')).toBeVisible();
    expect(screen.getByText('Send the campaign through configured email delivery.')).toBeVisible();
    expect(screen.queryByText(/đ\/tin|free|50|350/i)).not.toBeInTheDocument();
  });

  it('toggles selected channels through the controlled value contract', () => {
    const onChange = vi.fn();

    render(<PromotionChannelSelector value={['email']} onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Toggle SMS channel' }));

    expect(onChange).toHaveBeenCalledWith(['email', 'sms']);
  });
});
