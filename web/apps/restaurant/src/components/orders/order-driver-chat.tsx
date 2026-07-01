'use client';

import { useState, useEffect, useRef } from 'react';
import { SendHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  sender: 'restaurant' | 'driver' | 'system';
  text: string;
  timestamp: string;
}

interface OrderDriverChatProps {
  orderId: string;
  driverName?: string;
}

const QUICK_REPLIES = [
  'Đã sẵn sàng',
  'Đang chuẩn bị thêm 5 phút',
  'Đến cổng sau',
  'Cảm ơn!',
];

export function OrderDriverChat({ orderId, driverName }: OrderDriverChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'system', text: 'Bắt đầu chat với tài xế', timestamp: new Date().toISOString() },
  ]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'restaurant',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
    setInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-full rounded-lg border" data-testid="order-driver-chat">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            Chat với tài xế{driverName ? `: ${driverName}` : ''}
          </h3>
          <p className={cn('text-xs', connected ? 'text-green-600' : 'text-red-500')}>
            {connected ? 'Đã kết nối' : 'Đang kết nối lại...'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-64">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex',
              msg.sender === 'restaurant' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                msg.sender === 'restaurant'
                  ? 'bg-brand-500 text-white'
                  : msg.sender === 'system'
                  ? 'bg-gray-100 text-gray-500 text-xs mx-auto'
                  : 'bg-gray-100 text-gray-900'
              )}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div className="flex flex-wrap gap-1 px-4 py-2 border-t">
        {QUICK_REPLIES.map((qr) => (
          <button
            key={qr}
            type="button"
            onClick={() => sendMessage(qr)}
            className="rounded-full bg-brand-50 px-2.5 py-1 text-xs text-brand-700 hover:bg-brand-100 transition-colors"
          >
            {qr}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t px-4 py-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập tin nhắn..."
          className="input-field flex-1 text-sm"
          aria-label="Tin nhắn"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="btn-primary p-2 rounded-lg disabled:opacity-50"
        >
          <SendHorizontal className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
