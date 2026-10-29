'use client';

import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';
import {
  assertProductionPublicUrl,
  assertProductionPublicValue,
  isProductionDeployment,
} from '@/lib/public-env';

export type RealtimeProvider = 'socketio' | 'supabase';
type Handler = (...args: unknown[]) => void;

export interface RealtimeTokenResponse {
  provider: 'supabase';
  token: string;
  expiresAt: string;
  channels: string[];
}

interface AdapterOptions {
  channel: string;
  scope?: { orderId?: string; restaurantId?: string };
  fetchToken?: (scope: { orderId?: string; restaurantId?: string }) => Promise<RealtimeTokenResponse>;
}


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
  private generation = 0;
  private client: SupabaseClient | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly options: AdapterOptions) {
    this.connect();
  }

  connect(): void {
    if (this.active) return;
    this.active = true;
    const generation = ++this.generation;
    const client = createSubscriptionClient();
    this.client = client;
    void this.subscribe(generation, client);
  }

  disconnect(): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = null;
    this.generation += 1;
    this.active = false;
    this.connected = false;
    this.dispatch('disconnect');
    if (this.channel) {
      void this.client?.removeChannel(this.channel);
      this.channel = null;
    }
    this.client = null;
  }

  removeAllListeners(): void {
    this.handlers.clear();
  }

  emit(): void {
    // Supabase clients do not publish business events; mutations go through REST.
  }

  on(event: string, handler: Handler): this {
    const set = this.handlers.get(event) ?? new Set<Handler>();
    set.add(handler);
    this.handlers.set(event, set);
    if (event === 'connect' && this.connected) {
      const generation = this.generation;
      queueMicrotask(() => { if (this.isCurrent(generation)) handler(); });
    }
    return this;
  }

  off(event: string, handler: Handler): this {
    this.handlers.get(event)?.delete(handler);
    return this;
  }

  private async fetchToken(): Promise<RealtimeTokenResponse> {
    if (this.options.fetchToken) return this.options.fetchToken(this.options.scope ?? {});
    const { api } = await import('@/lib/api');
    return api.post<RealtimeTokenResponse>('/realtime/token', this.options.scope ?? {});
  }

  private isCurrent(generation: number): boolean {
    return this.active && this.generation === generation;
  }

  private async subscribe(generation: number, client: SupabaseClient): Promise<void> {
    try {
      const token = await this.fetchToken();
      if (!this.isCurrent(generation)) return;
      if (!token.channels.includes(this.options.channel)) {
        throw new Error(`Realtime token does not include required channel: ${this.options.channel}`);
      }

      await client.realtime.setAuth(token.token);
      if (!this.isCurrent(generation)) return;

      this.scheduleRefresh(token.expiresAt, generation, client);
      this.channel = client
        .channel(this.options.channel, { config: { private: true } })
        .on('broadcast', { event: '*' }, ({ event, payload }) => {
          if (this.isCurrent(generation)) this.dispatch(event, payload);
        })
        .subscribe((status) => {
          if (!this.isCurrent(generation)) return;
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
      if (!this.isCurrent(generation)) return;
      this.disconnect();
      this.connected = false;
      this.dispatch('connect_error', error);
    }
  }

  private scheduleRefresh(expiresAt: string, generation: number, client: SupabaseClient): void {
    const expires = Date.parse(expiresAt);
    if (!Number.isFinite(expires) || expires <= Date.now()) throw new Error('Realtime credential expired');
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => { void this.refreshAuth(generation, client); }, Math.max(1000, expires - Date.now() - 30000));
  }

  private async refreshAuth(generation: number, client: SupabaseClient): Promise<void> {
    try {
      const token = await this.fetchToken();
      if (!this.isCurrent(generation)) return;
      if (!token.channels.includes(this.options.channel)) throw new Error('Realtime channel access revoked');
      if (Date.parse(token.expiresAt) <= Date.now()) throw new Error('Realtime credential expired');
      await client.realtime.setAuth(token.token);
      if (this.isCurrent(generation)) this.scheduleRefresh(token.expiresAt, generation, client);
    } catch (error) {
      if (!this.isCurrent(generation)) return;
      this.disconnect();
      this.dispatch('connect_error', error);
    }
  }
  private dispatch(event: string, payload?: unknown): void {
    this.handlers.get(event)?.forEach((handler) => handler(payload));
  }
}

function createSubscriptionClient(): SupabaseClient {
  return createClient(resolveSupabaseUrl(), resolveSupabasePublishableKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function resolveSupabaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!value) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required when realtime provider is supabase');
  return assertProductionPublicUrl('NEXT_PUBLIC_SUPABASE_URL', value, process.env, ['https:']);
}

function resolveSupabasePublishableKey(): string {
  const value =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!value) throw new Error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required when realtime provider is supabase');
  return assertProductionPublicValue('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', value, process.env, [
    'your-supabase-publishable-key',
    'your-supabase-anon-key',
  ]);
}
