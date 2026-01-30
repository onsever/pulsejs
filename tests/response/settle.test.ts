import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { settle } from '../../src/response/settle';
import type { PulseConfig } from '../../src/types';

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

describe('settle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds settling class to target', () => {
    const target = document.createElement('div');
    const child = document.createElement('p');
    settle(target, [child], makeConfig());

    expect(target.classList.contains('pulse-settling')).toBe(true);
  });

  it('adds added class to new elements', () => {
    const target = document.createElement('div');
    const child = document.createElement('p');
    settle(target, [child], makeConfig());

    expect(child.classList.contains('pulse-added')).toBe(true);
  });

  it('removes classes after settle delay', async () => {
    const target = document.createElement('div');
    const child = document.createElement('p');
    const promise = settle(target, [child], makeConfig({ defaultSettleDelay: 50 }));

    vi.advanceTimersByTime(50);
    await promise;

    expect(target.classList.contains('pulse-settling')).toBe(false);
    expect(child.classList.contains('pulse-added')).toBe(false);
  });

  it('resolves after delay', async () => {
    const target = document.createElement('div');
    let resolved = false;
    const promise = settle(target, [], makeConfig({ defaultSettleDelay: 30 })).then(() => { resolved = true; });

    expect(resolved).toBe(false);
    vi.advanceTimersByTime(30);
    await promise;
    expect(resolved).toBe(true);
  });
});
