import '@testing-library/jest-dom/vitest';
import { createElement, forwardRef, type AnchorHTMLAttributes } from 'react';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

type MockLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean };

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  useParams: () => ({}),
  usePathname: () => '/',
  useRouter: () => ({
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/navigation', () => ({
  Link: forwardRef<HTMLAnchorElement, MockLinkProps>(({ children, href, prefetch, ...props }, ref) => {
    void prefetch;
    return createElement('a', { ref, href, ...props }, children);
  }),
  usePathname: () => '/',
  useRouter: () => ({ back: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));
