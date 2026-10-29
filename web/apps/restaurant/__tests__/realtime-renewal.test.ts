import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const { client, channel } = vi.hoisted(() => {
  const channel = { on: vi.fn(), subscribe: vi.fn() };
  const client = { realtime: { setAuth: vi.fn().mockResolvedValue(undefined) }, channel: vi.fn(() => channel), removeChannel: vi.fn().mockResolvedValue(undefined) };
  return { client, channel };
});
vi.mock('@supabase/supabase-js', () => ({ createClient: () => client }));
import { SupabaseSocketAdapter } from '@/lib/supabase-realtime';
const { apiPost } = vi.hoisted(() => ({ apiPost: vi.fn() }));
vi.mock('@/lib/api', () => ({ api: { post: apiPost } }));
describe('private realtime token expiry', () => {
  let adapter: SupabaseSocketAdapter;
  const topic = 'private:driver:synthetic';
  const token = (value: string, channels = [topic]) => ({ provider: 'supabase' as const, token: value, expiresAt: new Date(Date.now() + 60000).toISOString(), channels });
  beforeEach(() => {
    vi.useFakeTimers(); vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://fixture.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_fixture');
    channel.on.mockReturnValue(channel);
    channel.subscribe.mockImplementation((callback: (status: string) => void) => { callback('SUBSCRIBED'); return channel; });
  });
  afterEach(() => { adapter?.disconnect(); vi.useRealTimers(); vi.unstubAllEnvs(); });
  it('renews short-lived credentials before expiry without dropping handlers', async () => {
    const fetchToken = vi.fn().mockImplementation(async () => token('credential-'+fetchToken.mock.calls.length));
    apiPost.mockImplementation(fetchToken);
    adapter = new SupabaseSocketAdapter({ channel: topic });
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(31000);
    expect(fetchToken).toHaveBeenCalledTimes(2);
    expect(client.realtime.setAuth).toHaveBeenLastCalledWith('credential-2');
    expect(adapter.connected).toBe(true);
  });
  it('closes an existing subscription when renewed authorization removes its topic', async () => {
    const fetchToken = vi.fn().mockResolvedValueOnce(token('first')).mockResolvedValueOnce(token('revoked', []));
    apiPost.mockImplementation(fetchToken);
    adapter = new SupabaseSocketAdapter({ channel: topic });
    await vi.advanceTimersByTimeAsync(31000);
    expect(adapter.connected).toBe(false);
    expect(client.removeChannel).toHaveBeenCalledWith(channel);
    expect(client.realtime.setAuth).not.toHaveBeenCalledWith('revoked');
  });
  it('cancels renewal on disconnect', async () => {
    const fetchToken = vi.fn().mockResolvedValue(token('first'));
    apiPost.mockImplementation(fetchToken);
    adapter = new SupabaseSocketAdapter({ channel: topic });
    await vi.advanceTimersByTimeAsync(0);
    adapter.disconnect();
    await vi.advanceTimersByTimeAsync(90000);
    expect(fetchToken).toHaveBeenCalledTimes(1);
  });

  it('ignores credentials resolving after logout', async () => {
    let release!: (value: ReturnType<typeof token>) => void;
    const fetchToken = vi.fn(() => new Promise<ReturnType<typeof token>>(resolve => { release = resolve; }));
    apiPost.mockImplementation(fetchToken);
    adapter = new SupabaseSocketAdapter({ channel: topic });
    await vi.advanceTimersByTimeAsync(0);
    adapter.disconnect();
    release(token('old-after-logout'));
    await vi.advanceTimersByTimeAsync(0);
    expect(client.realtime.setAuth).not.toHaveBeenCalled();
    expect(client.channel).not.toHaveBeenCalled();
  });
  it('ignores an older request after disconnect and reconnect', async () => {
    let release!: (value: ReturnType<typeof token>) => void;
    const fetchToken = vi.fn().mockImplementationOnce(() => new Promise(resolve => { release = resolve; })).mockResolvedValue(token('new-generation'));
    apiPost.mockImplementation(fetchToken);
    adapter = new SupabaseSocketAdapter({ channel: topic });
    await vi.advanceTimersByTimeAsync(0);
    adapter.disconnect();
    adapter.connect();
    await vi.advanceTimersByTimeAsync(0);
    release(token('old-generation'));
    await vi.advanceTimersByTimeAsync(0);
    expect(client.realtime.setAuth).toHaveBeenCalledTimes(1);
    expect(client.realtime.setAuth).toHaveBeenCalledWith('new-generation');
    expect(client.channel).toHaveBeenCalledTimes(1);
  });
  it('retains handlers after renewal and ignores queued events after logout', async () => {
    const fetchToken = vi.fn().mockImplementation(async () => token('renewable'));
    apiPost.mockImplementation(fetchToken);
    adapter = new SupabaseSocketAdapter({ channel: topic });
    const handler = vi.fn();
    adapter.on('verification', handler);
    await vi.advanceTimersByTimeAsync(31000);
    const broadcast = channel.on.mock.calls[0][2];
    broadcast({ event: 'verification', payload: { marker: 1 } });
    expect(handler).toHaveBeenCalledTimes(1);
    adapter.disconnect();
    broadcast({ event: 'verification', payload: { marker: 2 } });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
