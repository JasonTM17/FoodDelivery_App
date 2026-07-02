import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OrderDriverChat } from '@/components/orders/order-driver-chat';

const mocks = vi.hoisted(() => {
  const socketHandlers = new Map<string, (...args: unknown[]) => void>();
  const socket = {
    connected: true,
    emit: vi.fn(),
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      socketHandlers.set(event, handler);
      return socket;
    }),
    off: vi.fn((event: string) => {
      socketHandlers.delete(event);
      return socket;
    }),
  };

  return {
    apiGet: vi.fn(),
    apiPost: vi.fn(),
    connectToOrder: vi.fn(() => socket),
    leaveOrder: vi.fn(),
    socket,
    socketHandlers,
    translate: (key: string, values?: { driverName?: string }) => {
      const messages: Record<string, string> = {
        title: 'Chat with driver',
        titleWithDriver: `Chat with driver: ${values?.driverName ?? ''}`,
        connected: 'Connected',
        reconnecting: 'Reconnecting...',
        loading: 'Loading driver chat',
        empty: 'No messages yet.',
        driverMissing: 'Driver has not been assigned yet.',
        loadError: 'Could not load driver chat.',
        sendError: 'Could not send this message.',
        retry: 'Retry',
        placeholder: 'Type a message...',
        disabledPlaceholder: 'Waiting for driver assignment',
        messageLabel: 'Message',
        send: 'Send message',
        'quick.ready': 'Order is ready',
        'quick.fiveMinutes': 'Need 5 more minutes',
        'quick.backGate': 'Please use the back gate',
        'quick.thanks': 'Thank you!',
      };
      return messages[key] ?? key;
    },
  };
});

vi.mock('@/lib/api', () => ({
  api: {
    get: mocks.apiGet,
    post: mocks.apiPost,
  },
}));

vi.mock('@/lib/socket', () => ({
  connectToOrder: mocks.connectToOrder,
  leaveOrder: mocks.leaveOrder,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => mocks.translate,
}));

describe('OrderDriverChat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.socketHandlers.clear();
    mocks.socket.connected = true;
  });

  it('loads persisted chat messages and subscribes to the order room', async () => {
    mocks.apiGet.mockResolvedValue({
      canReply: true,
      messages: [{
        id: 'message-1',
        senderType: 'driver',
        senderId: 'driver-1',
        content: 'Arrived at pickup',
        createdAt: '2026-07-02T10:00:00.000Z',
      }],
    });

    render(<OrderDriverChat orderId="order-1" driverName="An" />);

    expect(await screen.findByText('Arrived at pickup')).toBeInTheDocument();
    expect(mocks.apiGet).toHaveBeenCalledWith('/restaurant/orders/order-1/messages');
    expect(mocks.connectToOrder).toHaveBeenCalledWith('order-1');
    expect(mocks.socket.on).toHaveBeenCalledWith('order:message_created', expect.any(Function));
    expect(screen.getByRole('textbox', { name: 'Message' })).toBeEnabled();
  });

  it('sends a message through the API before rendering it', async () => {
    const user = userEvent.setup();
    mocks.apiGet.mockResolvedValue({ canReply: true, messages: [] });
    mocks.apiPost.mockResolvedValue({
      id: 'message-2',
      senderType: 'restaurant',
      senderId: 'restaurant-user-1',
      content: 'Order is ready',
      createdAt: '2026-07-02T10:02:00.000Z',
    });

    render(<OrderDriverChat orderId="order-1" />);

    await screen.findByText('No messages yet.');
    await user.type(screen.getByRole('textbox', { name: 'Message' }), '  Order is ready  ');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    await waitFor(() => expect(mocks.apiPost).toHaveBeenCalledWith(
      '/restaurant/orders/order-1/messages',
      { content: 'Order is ready' },
    ));
    await waitFor(() => expect(screen.getAllByText('Order is ready')).toHaveLength(2));
  });

  it('disables replies until a driver is assigned', async () => {
    mocks.apiGet.mockResolvedValue({ canReply: false, messages: [] });

    render(<OrderDriverChat orderId="order-1" />);

    expect(await screen.findByText('Driver has not been assigned yet.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Message' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
  });
});
