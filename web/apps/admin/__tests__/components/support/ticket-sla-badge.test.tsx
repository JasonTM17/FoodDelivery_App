import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TicketSlaBadge from '@/components/support/ticket-sla-badge';

describe('TicketSlaBadge', () => {
  it('shows the overdue translation key when overdue', () => {
    render(<TicketSlaBadge sla={{ percentRemaining: 0, overdue: true }} />);
    expect(screen.getByText('overdue')).toBeInTheDocument();
  });

  it('shows percentage translation key and success variant when >50% remaining', () => {
    render(<TicketSlaBadge sla={{ percentRemaining: 0.75, overdue: false }} />);
    expect(screen.getByText('remainingPercent')).toBeInTheDocument();
  });

  it('shows the expiring soon translation key when 25-50% remaining', () => {
    render(<TicketSlaBadge sla={{ percentRemaining: 0.4, overdue: false }} />);
    expect(screen.getByText('expiringSoon')).toBeInTheDocument();
  });

  it('shows the almost overdue translation key when <25% remaining', () => {
    render(<TicketSlaBadge sla={{ percentRemaining: 0.1, overdue: false }} />);
    expect(screen.getByText('almostOverdue')).toBeInTheDocument();
  });

  it('has data-testid sla-badge', () => {
    render(<TicketSlaBadge sla={{ percentRemaining: 0.5, overdue: false }} />);
    expect(screen.getByTestId('sla-badge')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <TicketSlaBadge
        sla={{ percentRemaining: 0.5, overdue: false }}
        className="my-custom-class"
      />
    );
    expect(screen.getByTestId('sla-badge')).toHaveClass('my-custom-class');
  });

  it('shows overdue badge with destructive variant when overdue', () => {
    render(<TicketSlaBadge sla={{ percentRemaining: 0, overdue: true }} />);
    const badge = screen.getByTestId('sla-badge');
    expect(badge).toHaveClass('bg-destructive');
  });
});
