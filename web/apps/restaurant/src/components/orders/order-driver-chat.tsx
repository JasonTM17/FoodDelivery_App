'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, SendHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { RestaurantOrderChatMessage, RestaurantOrderChatMessagesPayload } from '@foodflow/api-client';
import { api } from '@/lib/api';
import { connectToOrder, leaveOrder, type OrderChatMessageEvent } from '@/lib/socket';
import { cn } from '@/lib/utils';

interface OrderDriverChatProps {
  orderId: string;
  driverName?: string;
}

export function OrderDriverChat({ orderId, driverName }: OrderDriverChatProps) {
  const t = useTranslations('orderChat');
  const quickReplies = [t('quick.ready'), t('quick.fiveMinutes'), t('quick.backGate'), t('quick.thanks')];
  const [messages, setMessages] = useState<RestaurantOrderChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [canReply, setCanReply] = useState(false);
  const [connected, setConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<RestaurantOrderChatMessagesPayload>(`/restaurant/orders/${orderId}/messages`);
      setMessages(data.messages);
      setCanReply(data.canReply);
      setError('');
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t('loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [orderId, t]);

  useEffect(() => { void loadMessages(); }, [loadMessages]);

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const socket = connectToOrder(orderId);
    const subscribe = () => {
      setConnected(true);
      socket.emit('order:subscribe', { orderId });
    };
    const markDisconnected = () => setConnected(false);
    const handleMessage = (message: OrderChatMessageEvent) => {
      if (message.orderId !== orderId) return;
      setMessages((prev) => prev.some((item) => item.id === message.id) ? prev : [...prev, message]);
    };

    setConnected(socket.connected);
    socket.on('connect', subscribe);
    socket.on('disconnect', markDisconnected);
    socket.on('order:message_created', handleMessage);

    return () => {
      socket.off('connect', subscribe);
      socket.off('disconnect', markDisconnected);
      socket.off('order:message_created', handleMessage);
      leaveOrder(orderId);
    };
  }, [orderId]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setIsSending(true);
    try {
      const message = await api.post<RestaurantOrderChatMessage>(`/restaurant/orders/${orderId}/messages`, { content: text.trim() });
      setMessages((prev) => prev.some((item) => item.id === message.id) ? prev : [...prev, message]);
      setInput('');
      setError('');
    } catch (err: unknown) {
      setError((err as { message?: string }).message || t('sendError'));
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  return (
    <div className="flex flex-col h-full rounded-lg border" data-testid="order-driver-chat">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {driverName ? t('titleWithDriver', { driverName }) : t('title')}
          </h3>
          <p className={cn('text-xs', connected ? 'text-green-600' : 'text-red-500')}>
            {connected ? t('connected') : t('reconnecting')}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-64">
        {isLoading ? (
          <div role="status" className="space-y-2" aria-label={t('loading')}>
            <div className="h-8 w-2/3 skeleton" />
            <div className="ml-auto h-8 w-1/2 skeleton" />
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-center text-sm text-gray-500">
            {canReply ? t('empty') : t('driverMissing')}
          </div>
        ) : messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex',
              message.senderType === 'restaurant' ? 'justify-end' : 'justify-start',
            )}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                message.senderType === 'restaurant'
                  ? 'bg-brand-500 text-white'
                  : message.senderType === 'system'
                  ? 'bg-gray-100 text-gray-500 text-xs mx-auto'
                  : 'bg-gray-100 text-gray-900',
              )}
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mx-4 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <p>{error}</p>
          <button type="button" onClick={() => void loadMessages()} className="mt-1 inline-flex items-center gap-1 text-red-700 underline">
            <RefreshCw className="h-3.5 w-3.5" />
            {t('retry')}
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-1 px-4 py-2 border-t">
        {quickReplies.map((reply) => (
          <button
            key={reply}
            type="button"
            onClick={() => void sendMessage(reply)}
            disabled={!canReply || isSending}
            className="rounded-full bg-brand-50 px-2.5 py-1 text-xs text-brand-700 transition-colors hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {reply}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t px-4 py-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={canReply ? t('placeholder') : t('disabledPlaceholder')}
          className="input-field flex-1 text-sm"
          aria-label={t('messageLabel')}
          disabled={!canReply || isSending}
        />
        <button
          type="submit"
          disabled={!canReply || !input.trim() || isSending}
          aria-label={t('send')}
          className="btn-primary p-2 rounded-lg disabled:opacity-50"
        >
          <SendHorizontal className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
