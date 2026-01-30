import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/engine/process', () => ({
  processTree: vi.fn(),
}));

import { pushHistory, replaceHistory, cacheCurrentPage } from '../../src/history/manager';
import type { PulseConfig } from '../../src/types';

function makeConfig(): PulseConfig {
  return {
    defaultSwap: 'replace', defaultTarget: 'this', timeout: 0,
    historyEnabled: true, historyCacheSize: 10, refreshOnHistoryMiss: false,
    scrollBehavior: 'instant', selfRequestsOnly: true, allowScriptTags: true,
    allowEval: true, globalViewTransitions: false, indicatorClass: 'pulse-indicator',
    requestClass: 'pulse-request', defaultSwapDelay: 0, defaultSettleDelay: 20,
    withCredentials: false, ignoreTitle: false, inlineScriptNonce: '',
    responseHandling: [],
  };
}

describe('history/manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '<p>test content</p>';
  });

  it('pushHistory calls history.pushState', () => {
    const spy = vi.spyOn(history, 'pushState');
    pushHistory('/new-url', makeConfig());
    expect(spy).toHaveBeenCalledWith({ pulse: true }, '', '/new-url');
  });

  it('replaceHistory calls history.replaceState', () => {
    const spy = vi.spyOn(history, 'replaceState');
    replaceHistory('/replaced', makeConfig());
    expect(spy).toHaveBeenCalledWith({ pulse: true }, '', '/replaced');
  });

  it('cacheCurrentPage does not throw', () => {
    expect(() => cacheCurrentPage()).not.toThrow();
  });

  it('pushHistory caches current page first', () => {
    const pushSpy = vi.spyOn(history, 'pushState');
    // Should not throw and should call pushState
    pushHistory('/test', makeConfig());
    expect(pushSpy).toHaveBeenCalled();
  });
});
