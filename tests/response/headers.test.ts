import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/events/server-events', () => ({
  processServerTriggers: vi.fn(),
}));

import { processResponseHeaders } from '../../src/response/headers';
import { processServerTriggers } from '../../src/events/server-events';
import type { RequestContext } from '../../src/types';

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

function makeResponse(headers: Record<string, string>, status = 200): Response {
  return new Response('', { status, headers });
}

describe('processResponseHeaders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns stop:false with no special headers', () => {
    const result = processResponseHeaders(makeResponse({}), makeCtx());
    expect(result.stop).toBe(false);
  });

  it('handles P-Location (stops processing)', () => {
    const result = processResponseHeaders(makeResponse({ 'P-Location': '/dashboard' }), makeCtx());
    expect(result.stop).toBe(true);
    expect(result.location).toBe('/dashboard');
  });

  it('handles P-Redirect (stops processing)', () => {
    // Mock window.location.assign
    const assignMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, assign: assignMock },
      writable: true,
    });

    const result = processResponseHeaders(makeResponse({ 'P-Redirect': '/new-page' }), makeCtx());
    expect(result.stop).toBe(true);
    expect(assignMock).toHaveBeenCalledWith('/new-page');
  });

  it('handles P-Retarget', () => {
    const result = processResponseHeaders(makeResponse({ 'P-Retarget': '#other' }), makeCtx());
    expect(result.overrides.target).toBe('#other');
  });

  it('handles P-Reswap with valid behavior', () => {
    const result = processResponseHeaders(makeResponse({ 'P-Reswap': 'append' }), makeCtx());
    expect(result.overrides.behavior).toBe('append');
  });

  it('ignores P-Reswap with invalid behavior', () => {
    const result = processResponseHeaders(makeResponse({ 'P-Reswap': 'invalid' }), makeCtx());
    expect(result.overrides.behavior).toBeUndefined();
  });

  it('handles P-Reselect', () => {
    const result = processResponseHeaders(makeResponse({ 'P-Reselect': '.inner' }), makeCtx());
    expect(result.overrides.select).toBe('.inner');
  });

  it('handles P-Push', () => {
    const result = processResponseHeaders(makeResponse({ 'P-Push': '/new-url' }), makeCtx());
    expect(result.overrides.pushUrl).toBe('/new-url');
  });

  it('handles P-Replace', () => {
    const result = processResponseHeaders(makeResponse({ 'P-Replace': '/replaced' }), makeCtx());
    expect(result.overrides.replaceUrl).toBe('/replaced');
  });

  it('handles P-Trigger-After-Swap and P-Trigger-After-Settle', () => {
    const result = processResponseHeaders(makeResponse({
      'P-Trigger-After-Swap': 'swapEvent',
      'P-Trigger-After-Settle': 'settleEvent',
    }), makeCtx());
    expect(result.triggerAfterSwap).toBe('swapEvent');
    expect(result.triggerAfterSettle).toBe('settleEvent');
  });
});
