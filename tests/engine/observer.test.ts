import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../src/engine/process', () => ({
  processElement: vi.fn(),
  processTree: vi.fn(),
  cleanupElement: vi.fn(),
  cleanupTree: vi.fn(),
}));

vi.mock('../../src/parsers/cache', () => ({
  requestCache: { invalidateElement: vi.fn() },
  triggerCache: { invalidateElement: vi.fn() },
}));

import { setupObserver, disconnectObserver } from '../../src/engine/observer';
import { processElement, processTree, cleanupElement, cleanupTree } from '../../src/engine/process';
import { requestCache, triggerCache } from '../../src/parsers/cache';

describe('setupObserver', () => {
  afterEach(() => {
    disconnectObserver();
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('returns a MutationObserver', () => {
    const observer = setupObserver();
    expect(observer).toBeInstanceOf(MutationObserver);
  });

  it('is idempotent — returns same observer on second call', () => {
    const first = setupObserver();
    const second = setupObserver();
    expect(first).toBe(second);
  });

  it('disconnectObserver allows a new observer on next setup', () => {
    const first = setupObserver();
    disconnectObserver();
    const second = setupObserver();
    expect(second).toBeInstanceOf(MutationObserver);
    expect(second).not.toBe(first);
  });
});

describe('mutation handling', () => {
  afterEach(() => {
    disconnectObserver();
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('processes added elements on childList mutation', async () => {
    setupObserver();

    const el = document.createElement('div');
    el.setAttribute('p-request', 'GET /api');
    document.body.appendChild(el);

    // MutationObserver is async — flush microtasks
    await new Promise(r => setTimeout(r, 50));

    expect(processTree).toHaveBeenCalled();
  });

  it('cleans up removed elements on childList mutation', async () => {
    const el = document.createElement('div');
    el.setAttribute('p-request', 'GET /api');
    document.body.appendChild(el);

    setupObserver();

    document.body.removeChild(el);

    await new Promise(r => setTimeout(r, 50));

    expect(cleanupTree).toHaveBeenCalled();
  });

  it('invalidates caches and re-processes on attribute mutation', async () => {
    const el = document.createElement('div');
    el.setAttribute('p-request', 'GET /old');
    document.body.appendChild(el);

    setupObserver();

    el.setAttribute('p-request', 'GET /new');

    await new Promise(r => setTimeout(r, 50));

    expect(requestCache.invalidateElement).toHaveBeenCalledWith(el);
    expect(triggerCache.invalidateElement).toHaveBeenCalledWith(el);
    expect(cleanupElement).toHaveBeenCalledWith(el);
    expect(processElement).toHaveBeenCalledWith(el);
  });
});
