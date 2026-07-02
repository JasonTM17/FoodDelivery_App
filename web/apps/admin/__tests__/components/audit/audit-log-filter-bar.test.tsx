import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuditLogFilterBar } from '@/components/audit/audit-log-filter-bar';

const emptyFilters = { actor: '', action: '', dateFrom: '', dateTo: '' };

describe('AuditLogFilterBar', () => {
  it('reports the edited filter without mutating the current value', () => {
    const onChange = vi.fn();
    render(
      <AuditLogFilterBar
        value={emptyFilters}
        onChange={onChange}
        onSubmit={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('actorFilter'), {
      target: { value: 'admin@example.com' },
    });

    expect(onChange).toHaveBeenCalledWith({
      ...emptyFilters,
      actor: 'admin@example.com',
    });
    expect(emptyFilters.actor).toBe('');
  });

  it('submits only when the user applies the draft filters', () => {
    const onSubmit = vi.fn();
    render(
      <AuditLogFilterBar
        value={emptyFilters}
        onChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'search' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
