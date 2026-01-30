import { describe, it, expect, beforeEach } from 'vitest';
import { getConfig, setConfig, resetConfig, mergeMetaConfig } from '../../src/engine/config';

describe('engine/config', () => {
  beforeEach(() => {
    resetConfig();
  });

  it('returns default config', () => {
    const c = getConfig();
    expect(c.defaultSwap).toBe('replace');
    expect(c.defaultTarget).toBe('this');
    expect(c.timeout).toBe(0);
  });

  it('setConfig merges overrides', () => {
    setConfig({ timeout: 5000 });
    expect(getConfig().timeout).toBe(5000);
    expect(getConfig().defaultSwap).toBe('replace'); // unchanged
  });

  it('resetConfig restores defaults', () => {
    setConfig({ timeout: 9999 });
    resetConfig();
    expect(getConfig().timeout).toBe(0);
  });

  it('resetConfig accepts base overrides', () => {
    resetConfig({ timeout: 3000 });
    expect(getConfig().timeout).toBe(3000);
  });

  it('mergeMetaConfig does nothing without meta tag', () => {
    const before = { ...getConfig() };
    mergeMetaConfig();
    expect(getConfig()).toEqual(before);
  });

  it('mergeMetaConfig reads from meta tag', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'pulse-config');
    meta.setAttribute('content', JSON.stringify({ timeout: 7000 }));
    document.head.appendChild(meta);

    mergeMetaConfig();
    expect(getConfig().timeout).toBe(7000);

    meta.remove();
  });

  it('mergeMetaConfig warns on invalid JSON', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'pulse-config');
    meta.setAttribute('content', '{invalid}');
    document.head.appendChild(meta);

    // Should not throw
    mergeMetaConfig();
    meta.remove();
  });
});
