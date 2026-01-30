import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { executeRequest } from '../../src/request/executor';
import type { RequestContext, PulseConfig } from '../../src/types';

function makeCtx(): RequestContext {
  return {
    element: document.createElement('div'),
    parsed: {
      method: 'GET', url: '/api', headers: {}, body: null,
      target: { selector: 'this', behavior: 'replace' },
      modifiers: [],
    },
    trigger: null,
    inherited: { headers: {}, boost: null },
    abortController: new AbortController(),
  };
}

function makeConfig(overrides: Partial<PulseConfig> = {}): PulseConfig {
  return {
    defaultSwap: 'replace', defaultTarget: 'this', timeout: 0,
    historyEnabled: true, historyCacheSize: 10, refreshOnHistoryMiss: false,
    scrollBehavior: 'instant', selfRequestsOnly: true, allowScriptTags: true,
    allowEval: true, globalViewTransitions: false, indicatorClass: 'pulse-indicator',
    requestClass: 'pulse-request', defaultSwapDelay: 0, defaultSettleDelay: 20,
    withCredentials: false, ignoreTitle: false, inlineScriptNonce: '',
    responseHandling: [],
    ...overrides,
  };
}

describe('executeRequest', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls fetch with the request', async () => {
    const request = new Request('http://localhost/api');
    const response = await executeRequest(request, makeCtx(), makeConfig());
    expect(fetch).toHaveBeenCalledWith(request);
    expect(response).toBeInstanceOf(Response);
  });

  it('returns the response', async () => {
    const request = new Request('http://localhost/api');
    const response = await executeRequest(request, makeCtx(), makeConfig());
    const text = await response.text();
    expect(text).toBe('ok');
  });

  it('aborts on timeout via config', async () => {
    vi.useFakeTimers();

    // Make fetch hang
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}));

    const ctx = makeCtx();
    const promise = executeRequest(new Request('http://localhost/api'), ctx, makeConfig({ timeout: 100 }));

    vi.advanceTimersByTime(100);

    expect(ctx.abortController.signal.aborted).toBe(true);

    vi.useRealTimers();
  });

  it('aborts on timeout via modifier', async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}));

    const ctx = makeCtx();
    ctx.parsed.modifiers = [{ name: 'timeout', value: '50' }];
    const promise = executeRequest(new Request('http://localhost/api'), ctx, makeConfig());

    vi.advanceTimersByTime(50);
    expect(ctx.abortController.signal.aborted).toBe(true);

    vi.useRealTimers();
  });

  it('clears timeout on successful response', async () => {
    const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
    const request = new Request('http://localhost/api');
    await executeRequest(request, makeCtx(), makeConfig({ timeout: 5000 }));
    expect(clearSpy).toHaveBeenCalled();
  });
});
