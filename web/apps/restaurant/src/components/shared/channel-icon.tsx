'use client';

import { Smartphone, Mail, MessageSquare, Bell } from 'lucide-react';
import type { PromotionChannel } from '@/lib/types';

interface ChannelIconProps {
  channel: PromotionChannel;
  className?: string;
}

const ICON_MAP: Record<PromotionChannel, React.ReactNode> = {
  in_app: <Smartphone className="h-4 w-4" />,
  push: <Bell className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  sms: <MessageSquare className="h-4 w-4" />,
};

export function ChannelIcon({ channel, className }: ChannelIconProps) {
  return <span className={className}>{ICON_MAP[channel]}</span>;
}
