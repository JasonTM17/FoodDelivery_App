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
    expect(screen.getByText('kycDocuments.idFront')).toBeInTheDocument();
    expect(screen.getByText('kycDocuments.idBack')).toBeInTheDocument();
    expect(screen.getByText('kycDocuments.selfie')).toBeInTheDocument();
    expect(screen.getAllByLabelText('kycDocumentPreview')).toHaveLength(2);
  });

  it('trims reject reason before sending the review request', async () => {
    mockedApiGet.mockResolvedValueOnce(makeKyc());
    mockedApiPost.mockResolvedValueOnce(undefined);

    renderWithClient(<UserKycModal userId="user-1" open onOpenChange={vi.fn()} />);

    fireEvent.change(await screen.findByLabelText('kycRejectReason'), {
      target: { value: '  Missing selfie  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'kycReject' }));

    await waitFor(() => {
      expect(mockedApiPost).toHaveBeenCalledWith('/admin/users/user-1/kyc/review', {
        action: 'reject',
        reason: 'Missing selfie',
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
        action: 'approve',
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
});

function makeKyc() {
  return {
    status: 'pending',
    submittedAt: '2026-07-01T00:00:00.000Z',
    reviewedAt: null,
    rejectReason: null,
    documents: {
      idFront: 'https://example.test/front.jpg',
      idBack: 'https://example.test/back.jpg',
      selfie: null,
    },
  };
}
