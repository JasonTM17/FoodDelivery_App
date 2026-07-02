import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'vi',
  getTranslations: () => async (key: string) => key,
}));

// Mock next-intl/server
vi.mock('next-intl/server', () => ({
  getTranslations: () => async (key: string) => key,
}));

// Mock @/navigation
vi.mock('@/navigation', () => ({
  Link: ({ children, href, ...props }: Record<string, unknown>) => {
    const React = require('react');
    return React.createElement('a', { href, ...props }, children);
  },
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
}));

// Mock @/lib/api
vi.mock('@/lib/api', () => ({
  apiGet: vi.fn().mockResolvedValue(null),
  apiPost: vi.fn().mockResolvedValue(null),
  apiPut: vi.fn().mockResolvedValue(null),
  apiPatch: vi.fn().mockResolvedValue(null),
  apiDelete: vi.fn().mockResolvedValue(null),
  apiGetEnvelope: vi.fn().mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0 } }),
  apiDownload: vi.fn().mockResolvedValue(new Blob()),
}));

// Mock @tanstack/react-query
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  };
});

// Mock recharts (quiet rendering in tests)
vi.mock('recharts', async () => {
  const React = await import('react');
  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'responsive-container' }, children),
    AreaChart: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'area-chart' }, children),
    BarChart: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'bar-chart' }, children),
    LineChart: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'line-chart' }, children),
    Area: () => React.createElement('div', { 'data-testid': 'area' }),
    Bar: () => React.createElement('div', { 'data-testid': 'bar' }),
    Line: () => React.createElement('div', { 'data-testid': 'line' }),
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
    ReferenceArea: () => null,
    Cell: () => null,
    LabelList: () => null,
  };
});
