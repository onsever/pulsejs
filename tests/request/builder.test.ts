import { describe, it, expect, beforeEach } from 'vitest';
import { buildFetchRequest } from '../../src/request/builder';
import type { RequestContext, PulseConfig } from '../../src/types';

function makeCtx(overrides: Partial<RequestContext> = {}): RequestContext {
  const el = document.createElement('div');
  el.id = 'trigger-el';
  el.setAttribute('name', 'myBtn');
  document.body.appendChild(el);
  return {
    element: el,
    parsed: {
      method: 'GET',
      url: '/api/test',
      headers: {},
      body: null,
      target: { selector: 'this', behavior: 'replace' },
      modifiers: [],
    },
    trigger: null,
    inherited: { headers: {}, boost: null },
    abortController: new AbortController(),
    ...overrides,
  };
}

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

describe('buildFetchRequest', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('builds a GET request with correct URL', () => {
    const req = buildFetchRequest(makeCtx(), makeConfig());
    expect(req.method).toBe('GET');
    expect(req.url).toContain('/api/test');
  });

  it('sets P-Request header', () => {
    const req = buildFetchRequest(makeCtx(), makeConfig());
    expect(req.headers.get('P-Request')).toBe('true');
  });

  it('sets P-Current-URL header', () => {
    const req = buildFetchRequest(makeCtx(), makeConfig());
    expect(req.headers.get('P-Current-URL')).toBeTruthy();
  });

  it('sets P-Trigger and P-Trigger-Name from element', () => {
    const req = buildFetchRequest(makeCtx(), makeConfig());
    expect(req.headers.get('P-Trigger')).toBe('trigger-el');
    expect(req.headers.get('P-Trigger-Name')).toBe('myBtn');
  });

  it('sets P-Boosted when isBoosted', () => {
    const ctx = makeCtx();
    ctx.isBoosted = true;
    const req = buildFetchRequest(ctx, makeConfig());
    expect(req.headers.get('P-Boosted')).toBe('true');
  });

  it('sets P-Prompt when promptValue present', () => {
    const ctx = makeCtx();
    ctx.promptValue = 'my answer';
    const req = buildFetchRequest(ctx, makeConfig());
    expect(req.headers.get('P-Prompt')).toBe('my answer');
  });

  it('includes inherited headers', () => {
    const ctx = makeCtx();
    ctx.inherited = { headers: { 'Authorization': 'Bearer xyz' }, boost: null };
    const req = buildFetchRequest(ctx, makeConfig());
    expect(req.headers.get('Authorization')).toBe('Bearer xyz');
  });

  it('includes explicit headers from p-request', () => {
    const ctx = makeCtx();
    ctx.parsed.headers = { 'X-Custom': 'val' };
    const req = buildFetchRequest(ctx, makeConfig());
    expect(req.headers.get('X-Custom')).toBe('val');
  });

  it('appends body params to URL for GET', () => {
    const ctx = makeCtx();
    ctx.parsed.body = { type: 'json', data: { q: 'test' }, selectors: null, filter: null };
    const req = buildFetchRequest(ctx, makeConfig());
    expect(req.url).toContain('q=test');
    expect(req.body).toBeNull();
  });

  it('sends JSON body for POST', async () => {
    const ctx = makeCtx();
    ctx.parsed.method = 'POST';
    ctx.parsed.body = { type: 'json', data: { name: 'val' }, selectors: null, filter: null };
    const req = buildFetchRequest(ctx, makeConfig());
    expect(req.headers.get('Content-Type')).toBe('application/json');
    const body = await req.text();
    expect(JSON.parse(body)).toEqual({ name: 'val' });
  });

  it('uses include credentials when withCredentials is true', () => {
    const req = buildFetchRequest(makeCtx(), makeConfig({ withCredentials: true }));
    expect(req.credentials).toBe('include');
  });

  it('uses same-origin credentials by default', () => {
    const req = buildFetchRequest(makeCtx(), makeConfig());
    expect(req.credentials).toBe('same-origin');
  });
});
