import type { ReactNode } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiGet, apiPost } from '@/lib/api';
import UserKycModal from '@/app/[locale]/users/[id]/user-kyc-modal';

const mockedApiGet = vi.mocked(apiGet);
const mockedApiPost = vi.mocked(apiPost);

function renderWithClient(children: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
}

describe('UserKycModal', () => {
  beforeEach(() => {
    mockedApiGet.mockReset();
    mockedApiPost.mockReset();
  });

  it('renders localized status and document labels from the KYC API', async () => {
    mockedApiGet.mockResolvedValueOnce(makeKyc());

    renderWithClient(<UserKycModal userId="user-1" open onOpenChange={vi.fn()} />);

    expect(await screen.findByText('kycStatuses.pending')).toBeInTheDocument();
    expect(screen.getByText('kycDocuments.idCardFront')).toBeInTheDocument();
    expect(screen.getByText('kycDocuments.idCardBack')).toBeInTheDocument();
    expect(screen.getByText('kycDocuments.driverLicense')).toBeInTheDocument();
    expect(screen.getByText('kycDocuments.vehicleRegistration')).toBeInTheDocument();
    expect(screen.getAllByLabelText('kycOpenDocument')).toHaveLength(4);
  });

  it('trims reject reason before sending the review request', async () => {
    mockedApiGet.mockResolvedValueOnce(makeKyc());
    mockedApiPost.mockResolvedValueOnce(undefined);

    renderWithClient(<UserKycModal userId="user-1" open onOpenChange={vi.fn()} />);

    fireEvent.change(await screen.findByLabelText('kycRejectReason'), {
      target: { value: '  Missing vehicle registration  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'kycReject' }));

    await waitFor(() => {
      expect(mockedApiPost).toHaveBeenCalledWith('/admin/users/user-1/kyc/review', {
        submissionId: 'kyc-1',
        status: 'rejected',
        reason: 'Missing vehicle registration',
      });
    });
  });

  it('closes the dialog after approving KYC', async () => {
    const onOpenChange = vi.fn();
    mockedApiGet.mockResolvedValueOnce(makeKyc());
    mockedApiPost.mockResolvedValueOnce(undefined);

    renderWithClient(<UserKycModal userId="user-1" open onOpenChange={onOpenChange} />);

    fireEvent.click(await screen.findByRole('button', { name: 'kycApprove' }));

    await waitFor(() => {
      expect(mockedApiPost).toHaveBeenCalledWith('/admin/users/user-1/kyc/review', {
        submissionId: 'kyc-1',
        status: 'approved',
      });
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('shows a localized review error without leaking backend messages', async () => {
    mockedApiGet.mockResolvedValueOnce(makeKyc());
    mockedApiPost.mockRejectedValueOnce(new Error('internal stack trace'));

    renderWithClient(<UserKycModal userId="user-1" open onOpenChange={vi.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: 'kycApprove' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('kycReviewError');
    expect(screen.queryByText('internal stack trace')).not.toBeInTheDocument();
  });

  it('fails closed instead of rendering a non-HTTP document URL', async () => {
    const payload = makeKyc();
    payload.submissions[0].documentUrls.idCardFront = 'javascript:alert(1)';
    mockedApiGet.mockResolvedValueOnce(payload);

    renderWithClient(<UserKycModal userId="user-1" open onOpenChange={vi.fn()} />);

    expect(await screen.findByText('kycStatuses.pending')).toBeInTheDocument();
    expect(screen.getAllByLabelText('kycOpenDocument')).toHaveLength(3);
    expect(screen.getByText('kycDocumentUnavailable')).toBeInTheDocument();
  });
});

function makeKyc() {
  return {
    available: true,
    submissions: [
      {
        id: 'kyc-1',
        status: 'pending',
        createdAt: '2026-07-01T00:00:00.000Z',
        reviewedAt: null,
        reviewedById: null,
        rejectionReason: null,
        documentsAvailable: true,
        updatedAt: '2026-07-01T00:00:00.000Z',
        documentUrls: {
          idCardFront: 'https://example.test/front.jpg?token=short-lived',
          idCardBack: 'https://example.test/back.jpg?token=short-lived',
          driverLicense: 'https://example.test/license.jpg?token=short-lived',
          vehicleRegistration: 'https://example.test/registration.jpg?token=short-lived',
        },
      },
    ],
  };
}
