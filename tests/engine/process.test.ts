import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/engine/state', () => ({
  hasState: vi.fn(),
  ensureState: vi.fn(),
  getState: vi.fn(),
  removeState: vi.fn(),
}));

vi.mock('../../src/parsers/cache', () => ({
  requestCache: { get: vi.fn(), set: vi.fn() },
  triggerCache: { get: vi.fn(), set: vi.fn() },
}));

vi.mock('../../src/parsers/request', () => ({
  parseRequest: vi.fn(),
}));

vi.mock('../../src/parsers/trigger', () => ({
  parseTrigger: vi.fn(),
}));

vi.mock('../../src/engine/inherit', () => ({
  resolveInheritance: vi.fn(() => ({ headers: {}, boost: null })),
}));

vi.mock('../../src/triggers/setup', () => ({
  setupTriggers: vi.fn(() => []),
}));

vi.mock('../../src/request/dispatch', () => ({
  dispatchRequest: vi.fn(),
}));

vi.mock('../../src/events/on-parser', () => ({
  parseOnAttribute: vi.fn(() => []),
  setupOnHandlers: vi.fn(() => vi.fn()),
}));

import { processElement, processTree, cleanupElement, cleanupTree } from '../../src/engine/process';
import { hasState, ensureState, getState, removeState } from '../../src/engine/state';
import { requestCache, triggerCache } from '../../src/parsers/cache';
import { parseRequest } from '../../src/parsers/request';
import { parseTrigger } from '../../src/parsers/trigger';
import { setupTriggers } from '../../src/triggers/setup';
import { parseOnAttribute, setupOnHandlers } from '../../src/events/on-parser';

describe('processElement', () => {
  const mockState = () => ({
    triggers: [],
    parsedRequest: null,
    parsedTrigger: null,
    inherited: { headers: {}, boost: null },
    abortController: null,
    lastValue: undefined,
    requestQueue: [],
    onCleanup: null,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    (hasState as any).mockReturnValue(false);
    (ensureState as any).mockReturnValue(mockState());
    (requestCache.get as any).mockReturnValue(null);
    (triggerCache.get as any).mockReturnValue(null);
  });

  it('skips if element already has state', () => {
    (hasState as any).mockReturnValue(true);
    const el = document.createElement('div');

    processElement(el);

    expect(ensureState).not.toHaveBeenCalled();
  });

  it('skips if element has p-ignore', () => {
    const el = document.createElement('div');
    el.setAttribute('p-ignore', '');
    document.body.appendChild(el);

    processElement(el);

    expect(ensureState).not.toHaveBeenCalled();
  });

  it('skips if inside an ignored ancestor', () => {
    document.body.innerHTML = '<div p-ignore><button id="child" p-request="GET /api"></button></div>';
    const child = document.getElementById('child')!;

    processElement(child);

    expect(ensureState).not.toHaveBeenCalled();
  });

  it('parses p-request attribute', () => {
    const state = mockState();
    (ensureState as any).mockReturnValue(state);
    const parsed = { method: 'GET', url: '/api', headers: {}, body: null, target: { selector: 'this', behavior: 'replace' }, modifiers: [] };
    (parseRequest as any).mockReturnValue(parsed);

    const el = document.createElement('button');
    el.setAttribute('p-request', 'GET /api');
    document.body.appendChild(el);

    processElement(el);

    expect(parseRequest).toHaveBeenCalledWith('GET /api');
    expect(state.parsedRequest).toBe(parsed);
  });

  it('uses default trigger when no p-trigger for button', () => {
    const state = mockState();
    state.parsedRequest = { method: 'GET', url: '/api', headers: {}, body: null, target: { selector: 'this', behavior: 'replace' }, modifiers: [] } as any;
    (ensureState as any).mockReturnValue(state);
    (parseRequest as any).mockReturnValue(state.parsedRequest);
    const triggerResult = { events: [{ name: 'click' }] };
    (parseTrigger as any).mockReturnValue(triggerResult);

    const el = document.createElement('button');
    el.setAttribute('p-request', 'GET /api');
    document.body.appendChild(el);

    processElement(el);

    expect(parseTrigger).toHaveBeenCalledWith('click');
  });

  it('sets up triggers when both request and trigger are parsed', () => {
    const state = mockState();
    const parsed = { method: 'GET', url: '/api', headers: {}, body: null, target: { selector: 'this', behavior: 'replace' }, modifiers: [] };
    const trigger = { events: [{ name: 'click' }] };
    state.parsedRequest = parsed as any;
    state.parsedTrigger = trigger as any;
    (ensureState as any).mockReturnValue(state);
    (parseRequest as any).mockReturnValue(parsed);
    (parseTrigger as any).mockReturnValue(trigger);

    const el = document.createElement('button');
    el.setAttribute('p-request', 'GET /api');
    document.body.appendChild(el);

    processElement(el);

    expect(setupTriggers).toHaveBeenCalled();
  });

  it('sets up p-on handlers', () => {
    const state = mockState();
    (ensureState as any).mockReturnValue(state);

    const el = document.createElement('div');
    el.setAttribute('p-on', 'before: doSomething()');
    document.body.appendChild(el);

    processElement(el);

    expect(parseOnAttribute).toHaveBeenCalledWith('before: doSomething()');
    expect(setupOnHandlers).toHaveBeenCalled();
  });
});

describe('processTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (hasState as any).mockReturnValue(false);
    (ensureState as any).mockReturnValue({
      triggers: [], parsedRequest: null, parsedTrigger: null,
      inherited: { headers: {}, boost: null }, abortController: null,
      lastValue: undefined, requestQueue: [], onCleanup: null,
    });
    (requestCache.get as any).mockReturnValue(null);
    (triggerCache.get as any).mockReturnValue(null);
  });

  it('processes all elements with pulse attributes', () => {
    document.body.innerHTML = `
      <button p-request="GET /a"></button>
      <button p-request="GET /b"></button>
      <div p-trigger="click"></div>
    `;

    processTree(document.body);

    // Each element with a pulse attr should call ensureState
    expect(ensureState).toHaveBeenCalledTimes(3);
  });
});

describe('cleanupElement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does nothing if no state', () => {
    (getState as any).mockReturnValue(undefined);
    const el = document.createElement('div');

    cleanupElement(el);

    expect(removeState).not.toHaveBeenCalled();
  });

  it('cleans up triggers, aborts requests, and removes state', () => {
    const cleanup = vi.fn();
    const abort = vi.fn();
    const onCleanup = vi.fn();
    (getState as any).mockReturnValue({
      triggers: [{ cleanup }],
      abortController: { abort },
      onCleanup,
    });

    const el = document.createElement('div');
    cleanupElement(el);

    expect(cleanup).toHaveBeenCalled();
    expect(abort).toHaveBeenCalled();
    expect(onCleanup).toHaveBeenCalled();
    expect(removeState).toHaveBeenCalledWith(el);
  });
});

describe('cleanupTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getState as any).mockReturnValue(undefined);
  });

  it('cleans up all pulse elements in subtree plus root', () => {
    document.body.innerHTML = '<div id="root" p-request="GET /a"><button p-request="GET /b"></button></div>';
    const root = document.getElementById('root')!;

    cleanupTree(root);

    // getState called for the child + root
    expect(getState).toHaveBeenCalledTimes(2);
  });
});
