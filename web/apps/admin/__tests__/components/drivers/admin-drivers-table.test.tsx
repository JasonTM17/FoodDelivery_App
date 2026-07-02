import { render, screen } from '@testing-library/react';
import type { AdminDriver } from '@foodflow/api-client';
import { describe, expect, it } from 'vitest';
import { AdminDriversTable } from '@/components/drivers/admin-drivers-table';

describe('AdminDriversTable', () => {
  it('renders database driver details and localized status keys', () => {
    render(<AdminDriversTable drivers={[makeDriver()]} />);

    expect(screen.getByText('Nguyen Minh')).toBeInTheDocument();
    expect(screen.getByText('minh@example.com')).toBeInTheDocument();
    expect(screen.getByText('59-A1 12345')).toBeInTheDocument();
    expect(screen.getByText('4.8')).toBeInTheDocument();
    expect(screen.getByText('statuses.online')).toBeInTheDocument();
    expect(screen.getByText('vehicleTypes.motorbike')).toBeInTheDocument();
  });

  it('renders delivering state and handles missing optional identity fields', () => {
    render(<AdminDriversTable drivers={[
      makeDriver({ status: 'delivering', phone: null, vehiclePlate: null }),
    ]} />);

    expect(screen.getByText('statuses.delivering')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

function makeDriver(overrides: Partial<AdminDriver> = {}): AdminDriver {
  return {
    id: 'driver-1',
    profileId: 'profile-1',
    name: 'Nguyen Minh',
    email: 'minh@example.com',
    phone: '0900000000',
    rating: 4.8,
    totalDeliveries: 42,
    status: 'online',
    vehicleType: 'motorbike',
    vehiclePlate: '59-A1 12345',
    isVerified: true,
    isActive: true,
    createdAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}
