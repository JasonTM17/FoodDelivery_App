'use client';

import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';
import {
  assertProductionPublicUrl,
  assertProductionPublicValue,
  isProductionDeployment,
} from '@/lib/public-env';

export type RealtimeProvider = 'socketio' | 'supabase';
type Handler = (...args: unknown[]) => void;

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

interface AdapterOptions {
  channel: string;
  scope?: { orderId?: string; restaurantId?: string };
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

export function createSupabaseSocketAdapter(options: AdapterOptions): SupabaseSocketAdapter {
  return new SupabaseSocketAdapter(options);
}

export class SupabaseSocketAdapter {
  connected = false;
  readonly io = {
    on: () => undefined,
    off: () => undefined,
  };

  private readonly handlers = new Map<string, Set<Handler>>();
  private channel: RealtimeChannel | null = null;
  private active = false;

  constructor(private readonly options: AdapterOptions) {
    this.connect();
  }

  connect(): void {
    if (this.active) return;
    this.active = true;
    void this.subscribe();
  }

  disconnect(): void {
    this.active = false;
    this.connected = false;
    this.dispatch('disconnect');
    if (this.channel) {
      void getSupabaseClient().removeChannel(this.channel);
      this.channel = null;
    }
  }

  removeAllListeners(): void {
    this.handlers.clear();
  }

  emit(): void {
    // Supabase production clients do not publish business events directly.
    // Mutations must go through authenticated REST endpoints.
  }

  on(event: string, handler: Handler): this {
    const set = this.handlers.get(event) ?? new Set<Handler>();
    set.add(handler);
    this.handlers.set(event, set);
    if (event === 'connect' && this.connected) queueMicrotask(() => handler());
    return this;
  }

  off(event: string, handler: Handler): this {
    this.handlers.get(event)?.delete(handler);
    return this;
  }

  private async subscribe(): Promise<void> {
    try {
      const { api } = await import('@/lib/api');
      const token = await api.post<RealtimeTokenResponse>('/realtime/token', this.options.scope ?? {});
      if (!token.channels.includes(this.options.channel)) {
        throw new Error(`Realtime token does not include required channel: ${this.options.channel}`);
      }

      const client = getSupabaseClient();
      client.realtime.setAuth(token.token);
      if (!this.active) return;

      this.channel = client
        .channel(`foodflow:${this.options.channel}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'realtime_outbox',
            filter: `channel=eq.${this.options.channel}`,
          },
          (change) => {
            const row = change.new as RealtimeOutboxRow;
            this.dispatch(row.event, row.payload);
          },
        )
        .subscribe((status) => {
          if (!this.active) return;
          if (status === 'SUBSCRIBED') {
            this.connected = true;
            this.dispatch('connect');
          }
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            this.connected = false;
            this.dispatch('connect_error');
          }
          if (status === 'CLOSED') {
            this.connected = false;
            this.dispatch('disconnect');
          }
        });
    } catch (error) {
      this.connected = false;
      this.dispatch('connect_error', error);
    }
  }

  private dispatch(event: string, payload?: unknown): void {
    this.handlers.get(event)?.forEach((handler) => handler(payload));
  }
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
