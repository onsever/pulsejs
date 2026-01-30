import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/parsers/modifier', () => ({
  hasModifier: vi.fn(() => false),
  getModifierValue: vi.fn(() => null),
}));

vi.mock('../../src/response/headers', () => ({
  processResponseHeaders: vi.fn(() => ({
    stop: false,
    overrides: {},
    triggerAfterSwap: null,
    triggerAfterSettle: null,
  })),
}));

vi.mock('../../src/response/parser', () => ({
  parseHTML: vi.fn(() => {
    const f = document.createDocumentFragment();
    f.appendChild(document.createElement('p'));
    return f;
  }),
  parseHTMLDocument: vi.fn(() => new DOMParser().parseFromString('<html><body></body></html>', 'text/html')),
}));

vi.mock('../../src/response/select', () => ({
  applySelect: vi.fn((f: DocumentFragment) => f),
}));

vi.mock('../../src/response/oob', () => ({
  extractOOB: vi.fn(() => []),
  processOOBSwaps: vi.fn(),
}));

vi.mock('../../src/response/swap', () => ({
  performSwap: vi.fn(),
}));

vi.mock('../../src/response/transitions', () => ({
  withTransition: vi.fn((fn: () => void) => { fn(); return Promise.resolve(); }),
}));

vi.mock('../../src/response/preserve', () => ({
  savePreserved: vi.fn(() => null),
  restorePreserved: vi.fn(),
}));

vi.mock('../../src/response/settle', () => ({
  settle: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../src/response/head', () => ({
  mergeHead: vi.fn(),
}));

vi.mock('../../src/response/scripts', () => ({
  processScripts: vi.fn(),
}));

vi.mock('../../src/events/lifecycle', () => ({
  emitBeforeSwap: vi.fn(() => true),
  emitAfterSwap: vi.fn(),
  emitAfterSettle: vi.fn(),
  emitError: vi.fn(),
}));

vi.mock('../../src/events/server-events', () => ({
  processServerTriggers: vi.fn(),
}));

vi.mock('../../src/history/manager', () => ({
  pushHistory: vi.fn(),
  replaceHistory: vi.fn(),
}));

vi.mock('../../src/engine/process', () => ({
  processTree: vi.fn(),
}));

vi.mock('../../src/extensions/index', () => ({
  callTransformResponse: vi.fn((text: string) => text),
  callHandleSwap: vi.fn(() => false),
}));

import { processResponse } from '../../src/response/processor';
import { performSwap } from '../../src/response/swap';
import { emitError } from '../../src/events/lifecycle';

function makeCtx() {
  const el = document.createElement('div');
  document.body.appendChild(el);
  return {
    element: el,
    parsed: {
      method: 'GET' as const,
      url: '/api',
      headers: {},
      body: null,
      target: { selector: 'this', behavior: 'replace' as const },
      modifiers: [],
    },
    trigger: null,
    inherited: { headers: {}, boost: null },
    abortController: new AbortController(),
  };
}

function makeConfig(overrides: Record<string, any> = {}) {
  return {
    defaultSwap: 'replace' as const,
    defaultTarget: 'this',
    timeout: 0,
    historyEnabled: true,
    historyCacheSize: 10,
    refreshOnHistoryMiss: false,
    scrollBehavior: 'instant' as const,
    selfRequestsOnly: true,
    allowScriptTags: true,
    allowEval: true,
    globalViewTransitions: false,
    indicatorClass: 'pulse-indicator',
    requestClass: 'pulse-request',
    defaultSwapDelay: 0,
    defaultSettleDelay: 20,
    withCredentials: false,
    ignoreTitle: false,
    inlineScriptNonce: '',
    responseHandling: [
      { code: '2xx', swap: true, error: false, ignoreTitle: false, select: '', target: '' },
      { code: '4xx', swap: false, error: true, ignoreTitle: false, select: '', target: '' },
      { code: '5xx', swap: false, error: true, ignoreTitle: false, select: '', target: '' },
    ],
    ...overrides,
  };
}

describe('Response code handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('swaps on 200 response by default', async () => {
    const response = new Response('<p>ok</p>', { status: 200 });
    await processResponse(response, makeCtx(), makeConfig());
    expect(performSwap).toHaveBeenCalled();
    expect(emitError).not.toHaveBeenCalled();
  });

  it('does not swap on 404 and emits error', async () => {
    const response = new Response('Not Found', { status: 404 });
    await processResponse(response, makeCtx(), makeConfig());
    expect(performSwap).not.toHaveBeenCalled();
    expect(emitError).toHaveBeenCalledWith(expect.any(Element), expect.any(Error));
  });

  it('does not swap on 500 and emits error', async () => {
    const response = new Response('Server Error', { status: 500 });
    await processResponse(response, makeCtx(), makeConfig());
    expect(performSwap).not.toHaveBeenCalled();
    expect(emitError).toHaveBeenCalled();
  });

  it('matches exact status codes', async () => {
    const config = makeConfig({
      responseHandling: [
        { code: '201', swap: true, error: false, ignoreTitle: false, select: '', target: '' },
        { code: '2xx', swap: false, error: false, ignoreTitle: false, select: '', target: '' },
      ],
    });
    const response = new Response('<p>created</p>', { status: 201 });
    await processResponse(response, makeCtx(), config);
    expect(performSwap).toHaveBeenCalled();
  });

  it('falls through to wildcard pattern', async () => {
    const config = makeConfig({
      responseHandling: [
        { code: '*', swap: true, error: false, ignoreTitle: false, select: '', target: '' },
      ],
    });
    const response = new Response('<p>any</p>', { status: 418 });
    await processResponse(response, makeCtx(), config);
    expect(performSwap).toHaveBeenCalled();
  });

  it('applies target override from response handling rule', async () => {
    document.body.innerHTML = '<div id="err">old</div>';
    const ctx = makeCtx();
    const config = makeConfig({
      responseHandling: [
        { code: '4xx', swap: true, error: true, ignoreTitle: false, select: '', target: '#err' },
      ],
    });
    const response = new Response('<p>error msg</p>', { status: 404 });
    await processResponse(response, ctx, config);
    expect(performSwap).toHaveBeenCalledWith(
      document.getElementById('err'),
      expect.anything(),
      'replace',
    );
  });

  it('handles missing responseHandling config gracefully', async () => {
    const config = makeConfig({ responseHandling: undefined });
    const response = new Response('<p>ok</p>', { status: 200 });
    await processResponse(response, makeCtx(), config);
    // Should still swap since no rules means no blocking
    expect(performSwap).toHaveBeenCalled();
  });
});
