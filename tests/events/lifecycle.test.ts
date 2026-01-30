import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  emitBefore, emitBeforeSend, emitBeforeSwap,
  emitAfterSwap, emitAfterSettle, emitAfterRequest, emitError,
} from '../../src/events/lifecycle';
import type { RequestContext } from '../../src/types';

function makeCtx(): RequestContext {
  return {
    element: document.createElement('div'),
    parsed: { method: 'GET', url: '/', headers: {}, body: null, target: { selector: 'this', behavior: 'replace' }, modifiers: [] },
    trigger: null,
    inherited: { headers: {}, boost: null },
    abortController: new AbortController(),
  };
}

describe('lifecycle events', () => {
  let el: HTMLElement;

  beforeEach(() => {
    el = document.createElement('div');
    document.body.appendChild(el);
  });

  it('emitBefore dispatches cancelable pulse:before', () => {
    const handler = vi.fn();
    el.addEventListener('pulse:before', handler);
    const result = emitBefore(el, makeCtx());
    expect(handler).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('emitBefore returns false when cancelled', () => {
    el.addEventListener('pulse:before', (e) => e.preventDefault());
    expect(emitBefore(el, makeCtx())).toBe(false);
  });

  it('emitBeforeSend dispatches cancelable pulse:beforeSend', () => {
    el.addEventListener('pulse:beforeSend', (e) => e.preventDefault());
    expect(emitBeforeSend(el, makeCtx())).toBe(false);
  });

  it('emitBeforeSwap dispatches cancelable pulse:beforeSwap', () => {
    const target = document.createElement('div');
    const content = document.createDocumentFragment();
    el.addEventListener('pulse:beforeSwap', (e) => e.preventDefault());
    expect(emitBeforeSwap(el, target, content)).toBe(false);
  });

  it('emitAfterSwap dispatches pulse:afterSwap', () => {
    const handler = vi.fn();
    el.addEventListener('pulse:afterSwap', handler);
    emitAfterSwap(el, el);
    expect(handler).toHaveBeenCalled();
  });

  it('emitAfterSettle dispatches pulse:afterSettle', () => {
    const handler = vi.fn();
    el.addEventListener('pulse:afterSettle', handler);
    emitAfterSettle(el, el);
    expect(handler).toHaveBeenCalled();
  });

  it('emitAfterRequest includes response and successful flag', () => {
    let detail: any = null;
    el.addEventListener('pulse:afterRequest', ((e: CustomEvent) => {
      detail = e.detail;
    }) as EventListener);

    const response = new Response('ok');
    emitAfterRequest(el, response, true);
    expect(detail.response).toBe(response);
    expect(detail.successful).toBe(true);
  });

  it('emitError includes error in detail', () => {
    let detail: any = null;
    el.addEventListener('pulse:error', ((e: CustomEvent) => {
      detail = e.detail;
    }) as EventListener);

    const error = new Error('test error');
    emitError(el, error);
    expect(detail.error).toBe(error);
  });
});
