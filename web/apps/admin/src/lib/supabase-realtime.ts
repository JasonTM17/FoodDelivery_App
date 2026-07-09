'use client';

import { createClient, type SupabaseClient, type RealtimeChannel } from '@supabase/supabase-js';
import {
  assertProductionPublicUrl,
  assertProductionPublicValue,
  isProductionDeployment,
} from '@/lib/public-env';

export type RealtimeProvider = 'socketio' | 'supabase';
export type SupabaseConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface RealtimeTokenResponse {
  provider: 'supabase';
  token: string;
  expiresAt: string;
  channels: string[];
}

interface RealtimeOutboxRow {
  channel: string;
  event: string;
  payload: unknown;
}

interface SubscribeOptions {
  channel: string;
  scope?: { orderId?: string; restaurantId?: string };
  events: Record<string, (payload: unknown) => void>;
  onStatus?: (status: SupabaseConnectionStatus) => void;
  onError?: (error: Error) => void;
}

let supabaseClient: SupabaseClient | null = null;

export function resolveRealtimeProvider(): RealtimeProvider {
  const configured = process.env.NEXT_PUBLIC_REALTIME_PROVIDER?.trim().toLowerCase();
  if (!configured) {
    if (isProductionDeployment(process.env)) {
      throw new Error('NEXT_PUBLIC_REALTIME_PROVIDER is required in production');
    }
    return 'socketio';
  }
  if (configured === 'socketio' || configured === 'supabase') return configured;
  throw new Error('NEXT_PUBLIC_REALTIME_PROVIDER must be socketio or supabase');
}

export function subscribeToSupabaseOutbox(options: SubscribeOptions): () => void {
  let active = true;
  let realtimeChannel: RealtimeChannel | null = null;

  options.onStatus?.('connecting');
  void (async () => {
    const { apiPost } = await import('@/lib/api');
    const token = await apiPost<RealtimeTokenResponse>('/realtime/token', options.scope ?? {});
    if (!token.channels.includes(options.channel)) {
      throw new Error(`Realtime token does not include required channel: ${options.channel}`);
    }

    const client = getSupabaseClient();
    client.realtime.setAuth(token.token);
    if (!active) return;

    realtimeChannel = client
      .channel(`foodflow:${options.channel}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'realtime_outbox',
          filter: `channel=eq.${options.channel}`,
        },
        (change) => {
          const row = change.new as RealtimeOutboxRow;
          const handler = options.events[row.event];
          if (handler) handler(row.payload);
        },
      )
      .subscribe((status) => {
        if (!active) return;
        if (status === 'SUBSCRIBED') options.onStatus?.('connected');
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') options.onStatus?.('error');
        if (status === 'CLOSED') options.onStatus?.('disconnected');
      });
  })().catch((error) => {
    if (!active) return;
    options.onStatus?.('error');
    options.onError?.(error instanceof Error ? error : new Error(String(error)));
  });

  return () => {
    active = false;
    options.onStatus?.('disconnected');
    if (realtimeChannel) {
      void getSupabaseClient().removeChannel(realtimeChannel);
    }
  };
}

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const url = resolveSupabaseUrl();
    const anonKey = resolveSupabaseAnonKey();
    supabaseClient = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseClient;
}

function resolveSupabaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!value) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required when realtime provider is supabase');
  return assertProductionPublicUrl('NEXT_PUBLIC_SUPABASE_URL', value, process.env, ['https:']);
}

function resolveSupabaseAnonKey(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!value) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required when realtime provider is supabase');
  return assertProductionPublicValue(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    value,
    process.env,
    ['your-supabase-anon-key'],
  );
}
