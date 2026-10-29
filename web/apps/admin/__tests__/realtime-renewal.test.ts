import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const { client, channel } = vi.hoisted(() => {
  const channel = { on: vi.fn(), subscribe: vi.fn() };
  const client = { realtime: { setAuth: vi.fn().mockResolvedValue(undefined) }, channel: vi.fn(() => channel), removeChannel: vi.fn().mockResolvedValue(undefined) };
  return { client, channel };
});
vi.mock('@supabase/supabase-js', () => ({ createClient: () => client }));
import { subscribeToSupabaseOutbox } from '@/lib/supabase-realtime';
const { apiPost } = vi.hoisted(() => ({ apiPost: vi.fn() }));
vi.mock('@/lib/api', () => ({ apiPost }));
describe('private realtime token expiry', () => {
  let cleanup: (() => void) | undefined;
  const topic = 'private:admin:orders';
  const token = (value: string, channels = [topic]) => ({ provider: 'supabase' as const, token: value, expiresAt: new Date(Date.now() + 60000).toISOString(), channels });
  beforeEach(() => {
    vi.useFakeTimers(); vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://fixture.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_fixture');
    channel.on.mockReturnValue(channel);
    channel.subscribe.mockImplementation((callback: (status: string) => void) => { callback('SUBSCRIBED'); return channel; });
  });
  afterEach(() => { cleanup?.(); vi.useRealTimers(); vi.unstubAllEnvs(); });
  it('renews short-lived credentials before expiry without dropping handlers', async () => {
    const fetchToken = vi.fn().mockImplementation(async () => token('credential-'+fetchToken.mock.calls.length));
    apiPost.mockImplementation(fetchToken);
    cleanup = subscribeToSupabaseOutbox({ channel: topic, events: {} });
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(31000);
    expect(fetchToken).toHaveBeenCalledTimes(2);
    expect(client.realtime.setAuth).toHaveBeenLastCalledWith('credential-2');
    expect(client.removeChannel).not.toHaveBeenCalled();
  });
  it('closes an existing subscription when renewed authorization removes its topic', async () => {
    const fetchToken = vi.fn().mockResolvedValueOnce(token('first')).mockResolvedValueOnce(token('revoked', []));
    apiPost.mockImplementation(fetchToken);
    cleanup = subscribeToSupabaseOutbox({ channel: topic, events: {} });
    await vi.advanceTimersByTimeAsync(31000);
    
    expect(client.removeChannel).toHaveBeenCalledWith(channel);
    expect(client.realtime.setAuth).not.toHaveBeenCalledWith('revoked');
  });
  it('cancels renewal on disconnect', async () => {
    const fetchToken = vi.fn().mockResolvedValue(token('first'));
    apiPost.mockImplementation(fetchToken);
    cleanup = subscribeToSupabaseOutbox({ channel: topic, events: {} });
    await vi.advanceTimersByTimeAsync(0);
    cleanup?.();
    await vi.advanceTimersByTimeAsync(90000);
    expect(fetchToken).toHaveBeenCalledTimes(1);
  });
  it('ignores token responses arriving after logout', async () => {
    let release!: (value: ReturnType<typeof token>) => void;
    apiPost.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
    cleanup = subscribeToSupabaseOutbox({ channel: topic, events: {} });
    await vi.advanceTimersByTimeAsync(0);
    cleanup();
    release(token('old-after-logout'));
    await vi.advanceTimersByTimeAsync(0);
    expect(client.realtime.setAuth).not.toHaveBeenCalled();
    expect(client.channel).not.toHaveBeenCalled();
  });
  it('keeps event handlers through renewal and rejects queued events after logout', async () => {
    apiPost.mockImplementation(async () => token('renewable'));
    const handler = vi.fn();
    cleanup = subscribeToSupabaseOutbox({ channel: topic, events: { verification: handler } });
    await vi.advanceTimersByTimeAsync(31000);
    const broadcast = channel.on.mock.calls[0][2];
    broadcast({ event: 'verification', payload: { marker: 1 } });
    expect(handler).toHaveBeenCalledTimes(1);
    cleanup();
    broadcast({ event: 'verification', payload: { marker: 2 } });
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

