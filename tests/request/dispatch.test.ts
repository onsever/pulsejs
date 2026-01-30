import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/engine/config', () => ({
  getConfig: vi.fn(() => ({
    defaultSwap: 'replace',
    defaultTarget: 'this',
    timeout: 0,
    defaultSwapDelay: 0,
    defaultSettleDelay: 20,
  })),
}));

vi.mock('../../src/engine/state', () => ({
  getState: vi.fn(),
  ensureState: vi.fn(),
}));

vi.mock('../../src/request/builder', () => ({
  buildFetchRequest: vi.fn(() => new Request('http://localhost/api')),
}));

vi.mock('../../src/request/executor', () => ({
  executeRequest: vi.fn(() => Promise.resolve(new Response('ok'))),
}));

vi.mock('../../src/request/modifiers', () => ({
  applyPreRequestModifiers: vi.fn(() => Promise.resolve(true)),
  cleanupPostRequest: vi.fn(),
}));

vi.mock('../../src/request/sync', () => ({
  getSyncMode: vi.fn(() => 'replace'),
  checkSync: vi.fn(() => 'proceed'),
  enqueue: vi.fn(),
  processQueue: vi.fn(),
}));

vi.mock('../../src/response/processor', () => ({
  processResponse: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../src/events/lifecycle', () => ({
  emitBefore: vi.fn(() => true),
  emitBeforeSend: vi.fn(() => true),
  emitAfterRequest: vi.fn(),
  emitError: vi.fn(),
}));

import { dispatchRequest } from '../../src/request/dispatch';
import { getState, ensureState } from '../../src/engine/state';
import { applyPreRequestModifiers, cleanupPostRequest } from '../../src/request/modifiers';
import { checkSync, processQueue } from '../../src/request/sync';
import { buildFetchRequest } from '../../src/request/builder';
import { executeRequest } from '../../src/request/executor';
import { processResponse } from '../../src/response/processor';
import { emitBefore, emitBeforeSend, emitAfterRequest, emitError } from '../../src/events/lifecycle';

function makeState() {
  return {
    triggers: [],
    parsedRequest: {
      method: 'GET' as const,
      url: '/api',
      headers: {},
      body: null,
      target: { selector: 'this', behavior: 'replace' as const },
      modifiers: [],
    },
    parsedTrigger: { events: [{ name: 'click', isPolling: false, pollingInterval: null, filter: null, modifiers: { once: false, changed: false, consume: false, debounce: null, throttle: null, delay: null }, from: null }] },
    inherited: { headers: {}, boost: null },
    abortController: null,
    lastValue: undefined,
    requestQueue: [],
    onCleanup: null,
  };
}

describe('dispatchRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const state = makeState();
    (getState as any).mockReturnValue(state);
    (ensureState as any).mockReturnValue(state);
  });

  it('returns early if no state', async () => {
    (getState as any).mockReturnValue(undefined);
    const el = document.createElement('div');

    await dispatchRequest(el);

    expect(applyPreRequestModifiers).not.toHaveBeenCalled();
  });

  it('returns early if no parsedRequest', async () => {
    (getState as any).mockReturnValue({ parsedRequest: null });
    const el = document.createElement('div');

    await dispatchRequest(el);

    expect(applyPreRequestModifiers).not.toHaveBeenCalled();
  });

  it('returns if pre-modifiers return false', async () => {
    (applyPreRequestModifiers as any).mockResolvedValueOnce(false);
    const el = document.createElement('div');

    await dispatchRequest(el);

    expect(emitBefore).not.toHaveBeenCalled();
  });

  it('returns if pulse:before is cancelled', async () => {
    (emitBefore as any).mockReturnValueOnce(false);
    const el = document.createElement('div');

    await dispatchRequest(el);

    expect(cleanupPostRequest).toHaveBeenCalled();
    expect(buildFetchRequest).not.toHaveBeenCalled();
  });

  it('drops request when sync returns drop', async () => {
    (checkSync as any).mockReturnValueOnce('drop');
    const el = document.createElement('div');

    await dispatchRequest(el);

    expect(cleanupPostRequest).toHaveBeenCalled();
    expect(buildFetchRequest).not.toHaveBeenCalled();
  });

  it('returns if pulse:beforeSend is cancelled', async () => {
    (emitBeforeSend as any).mockReturnValueOnce(false);
    const el = document.createElement('div');

    await dispatchRequest(el);

    expect(executeRequest).not.toHaveBeenCalled();
  });

  it('executes full pipeline on happy path', async () => {
    const el = document.createElement('div');

    await dispatchRequest(el);

    expect(buildFetchRequest).toHaveBeenCalled();
    expect(executeRequest).toHaveBeenCalled();
    expect(processResponse).toHaveBeenCalled();
    expect(emitAfterRequest).toHaveBeenCalled();
    expect(processQueue).toHaveBeenCalled();
  });

  it('emits error for non-abort errors', async () => {
    (executeRequest as any).mockRejectedValueOnce(new Error('network fail'));
    const el = document.createElement('div');

    await dispatchRequest(el);

    expect(emitError).toHaveBeenCalledWith(el, expect.any(Error));
    expect(processQueue).toHaveBeenCalled();
  });

  it('does not emit error for AbortError', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    (executeRequest as any).mockRejectedValueOnce(abortError);
    const el = document.createElement('div');

    await dispatchRequest(el);

    expect(emitError).not.toHaveBeenCalled();
    expect(processQueue).toHaveBeenCalled();
  });

  it('clears abortController in finally block', async () => {
    const state = makeState();
    (getState as any).mockReturnValue(state);
    (ensureState as any).mockReturnValue(state);
    const el = document.createElement('div');

    await dispatchRequest(el);

    expect(state.abortController).toBeNull();
  });
});
