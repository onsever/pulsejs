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
  parseHTML: vi.fn(() => document.createDocumentFragment()),
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

vi.mock('../../src/events/lifecycle', () => ({
  emitBeforeSwap: vi.fn(() => true),
  emitAfterSwap: vi.fn(),
  emitAfterSettle: vi.fn(),
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

import { processResponse } from '../../src/response/processor';
import { processResponseHeaders } from '../../src/response/headers';
import { parseHTML } from '../../src/response/parser';
import { performSwap } from '../../src/response/swap';
import { emitBeforeSwap, emitAfterSwap, emitAfterSettle } from '../../src/events/lifecycle';
import { extractOOB } from '../../src/response/oob';

function makeCtx(overrides: Record<string, any> = {}) {
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
    ...overrides,
  };
}

function makeConfig() {
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
  };
}

describe('processResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('stops processing when headerResult.stop is true', async () => {
    (processResponseHeaders as any).mockReturnValueOnce({ stop: true, overrides: {} });
    const response = new Response('content');

    await processResponse(response, makeCtx(), makeConfig());

    expect(parseHTML).not.toHaveBeenCalled();
  });

  it('returns on empty response text', async () => {
    const response = new Response('   ');

    await processResponse(response, makeCtx(), makeConfig());

    expect(parseHTML).not.toHaveBeenCalled();
  });

  it('runs full pipeline on valid response', async () => {
    const fragment = document.createDocumentFragment();
    fragment.appendChild(document.createElement('p'));
    (parseHTML as any).mockReturnValueOnce(fragment);

    const response = new Response('<p>hello</p>');
    const ctx = makeCtx();

    await processResponse(response, ctx, makeConfig());

    expect(parseHTML).toHaveBeenCalled();
    expect(extractOOB).toHaveBeenCalled();
    expect(performSwap).toHaveBeenCalled();
    expect(emitAfterSwap).toHaveBeenCalled();
    expect(emitAfterSettle).toHaveBeenCalled();
  });

  it('stops if beforeSwap is cancelled', async () => {
    const fragment = document.createDocumentFragment();
    fragment.appendChild(document.createElement('p'));
    (parseHTML as any).mockReturnValueOnce(fragment);
    (emitBeforeSwap as any).mockReturnValueOnce(false);

    const response = new Response('<p>hello</p>');

    await processResponse(response, makeCtx(), makeConfig());

    expect(performSwap).not.toHaveBeenCalled();
  });

  it('resolves target with CSS selector', async () => {
    document.body.innerHTML = '<div id="output">old</div>';
    const fragment = document.createDocumentFragment();
    fragment.appendChild(document.createElement('p'));
    (parseHTML as any).mockReturnValueOnce(fragment);

    const ctx = makeCtx({
      parsed: {
        method: 'GET',
        url: '/api',
        headers: {},
        body: null,
        target: { selector: '#output', behavior: 'replace' },
        modifiers: [],
      },
    });
    // Ensure element is in DOM
    const el = document.createElement('div');
    document.body.appendChild(el);
    ctx.element = el;

    const response = new Response('<p>new</p>');
    await processResponse(response, ctx, makeConfig());

    expect(performSwap).toHaveBeenCalledWith(
      document.getElementById('output'),
      expect.anything(),
      'replace'
    );
  });

  // Bug fix #2: empty response with remove/none behavior
  it('allows empty response when behavior is "remove"', async () => {
    (processResponseHeaders as any).mockReturnValueOnce({
      stop: false,
      overrides: {},
      triggerAfterSwap: null,
      triggerAfterSettle: null,
    });
    const fragment = document.createDocumentFragment();
    (parseHTML as any).mockReturnValueOnce(fragment);

    const ctx = makeCtx({
      parsed: {
        method: 'DELETE',
        url: '/api/items/1',
        headers: {},
        body: null,
        target: { selector: 'this', behavior: 'remove' as const },
        modifiers: [],
      },
    });

    const response = new Response('');
    await processResponse(response, ctx, makeConfig());

    expect(performSwap).toHaveBeenCalledWith(
      ctx.element,
      expect.anything(),
      'remove'
    );
  });

  it('allows empty response when behavior is "none"', async () => {
    (processResponseHeaders as any).mockReturnValueOnce({
      stop: false,
      overrides: {},
      triggerAfterSwap: null,
      triggerAfterSettle: null,
    });
    const fragment = document.createDocumentFragment();
    (parseHTML as any).mockReturnValueOnce(fragment);

    const ctx = makeCtx({
      parsed: {
        method: 'POST',
        url: '/api/action',
        headers: {},
        body: null,
        target: { selector: 'this', behavior: 'none' as const },
        modifiers: [],
      },
    });

    const response = new Response('');
    await processResponse(response, ctx, makeConfig());

    expect(performSwap).toHaveBeenCalledWith(
      ctx.element,
      expect.anything(),
      'none'
    );
  });

  it('uses P-Reswap header override for empty response check', async () => {
    (processResponseHeaders as any).mockReturnValueOnce({
      stop: false,
      overrides: { behavior: 'remove' },
      triggerAfterSwap: null,
      triggerAfterSettle: null,
    });
    const fragment = document.createDocumentFragment();
    (parseHTML as any).mockReturnValueOnce(fragment);

    const ctx = makeCtx(); // default behavior is 'replace'
    const response = new Response('');
    await processResponse(response, ctx, makeConfig());

    // Should still swap because header override sets behavior to 'remove'
    expect(performSwap).toHaveBeenCalledWith(
      ctx.element,
      expect.anything(),
      'remove'
    );
  });

  it('resolves "closest" target selector', async () => {
    document.body.innerHTML = '<div class="wrapper"><button id="btn">x</button></div>';
    const btn = document.getElementById('btn')!;
    const fragment = document.createDocumentFragment();
    fragment.appendChild(document.createElement('p'));
    (parseHTML as any).mockReturnValueOnce(fragment);

    const ctx = makeCtx({
      element: btn,
      parsed: {
        method: 'GET',
        url: '/api',
        headers: {},
        body: null,
        target: { selector: 'closest .wrapper', behavior: 'replace' },
        modifiers: [],
      },
    });

    const response = new Response('<p>new</p>');
    await processResponse(response, ctx, makeConfig());

    expect(performSwap).toHaveBeenCalledWith(
      document.querySelector('.wrapper'),
      expect.anything(),
      'replace'
    );
  });
});
