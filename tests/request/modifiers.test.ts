import { describe, it, expect, vi, beforeEach } from 'vitest';
import { applyPreRequestModifiers, cleanupPostRequest } from '../../src/request/modifiers';
import type { RequestContext, PulseConfig } from '../../src/types';

function makeCtx(modifiers: Array<{ name: string; value: string | null }> = []): RequestContext {
  const el = document.createElement('button');
  document.body.appendChild(el);
  return {
    element: el,
    parsed: {
      method: 'GET', url: '/api', headers: {},
      body: null,
      target: { selector: 'this', behavior: 'replace' },
      modifiers,
    },
    trigger: null,
    inherited: { headers: {}, boost: null },
    abortController: new AbortController(),
  };
}

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

describe('applyPreRequestModifiers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns true with no modifiers', async () => {
    expect(await applyPreRequestModifiers(makeCtx(), makeConfig())).toBe(true);
  });

  it(':confirm falls back to window.confirm when no pulse:confirm handler', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const ctx = makeCtx([{ name: 'confirm', value: 'Delete?' }]);
    const result = await applyPreRequestModifiers(ctx, makeConfig());
    expect(result).toBe(true);
    expect(window.confirm).toHaveBeenCalledWith('Delete?');
    vi.restoreAllMocks();
  });

  it(':confirm returns false when user cancels', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const ctx = makeCtx([{ name: 'confirm', value: 'Sure?' }]);
    const result = await applyPreRequestModifiers(ctx, makeConfig());
    expect(result).toBe(false);
    vi.restoreAllMocks();
  });

  it(':prompt sets promptValue on context', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('my answer');
    const ctx = makeCtx([{ name: 'prompt', value: 'Enter name' }]);
    await applyPreRequestModifiers(ctx, makeConfig());
    expect(ctx.promptValue).toBe('my answer');
    vi.restoreAllMocks();
  });

  it(':prompt returns false when cancelled', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue(null);
    const ctx = makeCtx([{ name: 'prompt', value: 'Enter' }]);
    const result = await applyPreRequestModifiers(ctx, makeConfig());
    expect(result).toBe(false);
    vi.restoreAllMocks();
  });

  it(':disable disables the element', async () => {
    const ctx = makeCtx([{ name: 'disable', value: null }]);
    await applyPreRequestModifiers(ctx, makeConfig());
    expect(ctx.element.hasAttribute('disabled')).toBe(true);
  });

  it(':indicator adds classes', async () => {
    document.body.innerHTML = '<div id="spinner"></div>';
    const ctx = makeCtx([{ name: 'indicator', value: '#spinner' }]);
    document.body.appendChild(ctx.element);
    await applyPreRequestModifiers(ctx, makeConfig());
    expect(document.getElementById('spinner')!.classList.contains('pulse-indicator')).toBe(true);
    expect(ctx.element.classList.contains('pulse-request')).toBe(true);
  });
});

describe('cleanupPostRequest', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('re-enables disabled element', () => {
    const ctx = makeCtx([{ name: 'disable', value: null }]);
    ctx.element.setAttribute('disabled', '');
    cleanupPostRequest(ctx, makeConfig());
    expect(ctx.element.hasAttribute('disabled')).toBe(false);
  });

  it('removes indicator classes', () => {
    document.body.innerHTML = '<div id="spinner" class="pulse-indicator"></div>';
    const ctx = makeCtx([{ name: 'indicator', value: '#spinner' }]);
    document.body.appendChild(ctx.element);
    ctx.element.classList.add('pulse-request');

    cleanupPostRequest(ctx, makeConfig());
    expect(document.getElementById('spinner')!.classList.contains('pulse-indicator')).toBe(false);
    expect(ctx.element.classList.contains('pulse-request')).toBe(false);
  });
});
