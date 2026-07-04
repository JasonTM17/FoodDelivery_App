import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TagInput from '@/components/shared/tag-input';

describe('TagInput', () => {
  it('does not invent an English placeholder when no localized copy is provided', () => {
    render(<TagInput value={[]} onChange={vi.fn()} />);

    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', '');
  });

  it('uses the caller-provided localized placeholder', () => {
    render(<TagInput value={[]} onChange={vi.fn()} placeholder="Thêm thẻ..." />);

    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'Thêm thẻ...');
  });
});
