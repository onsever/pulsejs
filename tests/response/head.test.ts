import { describe, it, expect, beforeEach } from 'vitest';
import { mergeHead } from '../../src/response/head';
import type { PulseConfig } from '../../src/types';

function makeConfig(overrides: Partial<PulseConfig> = {}): PulseConfig {
  return {
    defaultSwap: 'replace',
    defaultTarget: 'this',
    timeout: 0,
    historyEnabled: true,
    historyCacheSize: 10,
    refreshOnHistoryMiss: false,
    scrollBehavior: 'instant',
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
    responseHandling: [],
    ...overrides,
  };
}

function parseDoc(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

describe('mergeHead', () => {
  beforeEach(() => {
    // Reset document head
    document.head.innerHTML = '<title>Original</title>';
    document.title = 'Original';
  });

  it('updates document.title from new head', () => {
    const doc = parseDoc('<html><head><title>New Title</title></head><body></body></html>');
    mergeHead(doc, makeConfig());
    expect(document.title).toBe('New Title');
  });

  it('ignores title when ignoreTitle is true', () => {
    const doc = parseDoc('<html><head><title>New Title</title></head><body></body></html>');
    mergeHead(doc, makeConfig({ ignoreTitle: true }));
    expect(document.title).toBe('Original');
  });

  it('merges new meta tags by name', () => {
    const doc = parseDoc('<html><head><meta name="description" content="new desc"></head><body></body></html>');
    mergeHead(doc, makeConfig());
    const meta = document.head.querySelector('meta[name="description"]');
    expect(meta).not.toBeNull();
    expect(meta!.getAttribute('content')).toBe('new desc');
  });

  it('replaces existing meta tags', () => {
    document.head.innerHTML = '<title>X</title><meta name="author" content="old">';
    const doc = parseDoc('<html><head><meta name="author" content="new"></head><body></body></html>');
    mergeHead(doc, makeConfig());
    const metas = document.head.querySelectorAll('meta[name="author"]');
    expect(metas).toHaveLength(1);
    expect(metas[0].getAttribute('content')).toBe('new');
  });

  it('adds new stylesheets without duplicating', () => {
    document.head.innerHTML = '<title>X</title><link rel="stylesheet" href="/a.css">';
    const doc = parseDoc('<html><head><link rel="stylesheet" href="/a.css"><link rel="stylesheet" href="/b.css"></head><body></body></html>');
    mergeHead(doc, makeConfig());
    const links = document.head.querySelectorAll('link[rel="stylesheet"]');
    expect(links).toHaveLength(2);
    expect(links[1].getAttribute('href')).toBe('/b.css');
  });

  it('appends new style elements', () => {
    document.head.innerHTML = '<title>X</title>';
    const doc = parseDoc('<html><head><style>.foo { color: red; }</style></head><body></body></html>');
    mergeHead(doc, makeConfig());
    const styles = document.head.querySelectorAll('style');
    expect(styles).toHaveLength(1);
    expect(styles[0].textContent).toContain('.foo');
  });

  it('handles empty head gracefully', () => {
    const doc = parseDoc('<html><head></head><body></body></html>');
    mergeHead(doc, makeConfig());
    expect(document.title).toBe('Original');
  });

  it('merges meta with property attribute (Open Graph)', () => {
    const doc = parseDoc('<html><head><meta property="og:title" content="OG Title"></head><body></body></html>');
    mergeHead(doc, makeConfig());
    const meta = document.head.querySelector('meta[property="og:title"]');
    expect(meta).not.toBeNull();
    expect(meta!.getAttribute('content')).toBe('OG Title');
  });
});
