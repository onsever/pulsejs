import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  defineExtension,
  removeExtension,
  getExtensions,
  callExtensionEvent,
  callTransformResponse,
  callHandleSwap,
} from '../../src/extensions/index';
import type { PulseExtension, PulseInternalAPI } from '../../src/types';

function makeAPI(): PulseInternalAPI {
  return {
    getConfig: vi.fn() as any,
    setConfig: vi.fn(),
    processTree: vi.fn(),
  };
}

describe('Extension system', () => {
  beforeEach(() => {
    // Clean up all extensions
    for (const ext of getExtensions()) {
      // Can't easily clear by name, so we remove known ones
    }
    removeExtension('test-ext');
    removeExtension('ext-a');
    removeExtension('ext-b');
    removeExtension('transform-ext');
    removeExtension('swap-ext');
  });

  it('defines and retrieves an extension', () => {
    const ext: PulseExtension = {};
    defineExtension('test-ext', ext, makeAPI());
    expect(getExtensions()).toContain(ext);
  });

  it('calls init on define', () => {
    const init = vi.fn();
    const ext: PulseExtension = { init };
    const api = makeAPI();
    defineExtension('test-ext', ext, api);
    expect(init).toHaveBeenCalledWith(api);
  });

  it('removes an extension', () => {
    const ext: PulseExtension = {};
    defineExtension('test-ext', ext, makeAPI());
    removeExtension('test-ext');
    expect(getExtensions()).not.toContain(ext);
  });

  it('replaces existing extension with same name', () => {
    const ext1: PulseExtension = {};
    const ext2: PulseExtension = {};
    defineExtension('test-ext', ext1, makeAPI());
    defineExtension('test-ext', ext2, makeAPI());
    expect(getExtensions()).toContain(ext2);
    expect(getExtensions()).not.toContain(ext1);
  });

  describe('callExtensionEvent', () => {
    it('calls onEvent on all extensions', () => {
      const onEvent = vi.fn(() => true);
      defineExtension('ext-a', { onEvent }, makeAPI());
      const event = new CustomEvent('test');
      callExtensionEvent('test', event);
      expect(onEvent).toHaveBeenCalledWith('test', event);
    });

    it('stops chain if onEvent returns false', () => {
      const onEventA = vi.fn(() => false);
      const onEventB = vi.fn(() => true);
      defineExtension('ext-a', { onEvent: onEventA }, makeAPI());
      defineExtension('ext-b', { onEvent: onEventB }, makeAPI());
      const result = callExtensionEvent('test', new CustomEvent('test'));
      expect(result).toBe(false);
      expect(onEventB).not.toHaveBeenCalled();
    });
  });

  describe('callTransformResponse', () => {
    it('transforms response text through extensions', () => {
      defineExtension('transform-ext', {
        transformResponse: (text) => text.replace('old', 'new'),
      }, makeAPI());
      const result = callTransformResponse('old content', new Response(), {});
      expect(result).toBe('new content');
    });

    it('chains transforms across extensions', () => {
      defineExtension('ext-a', {
        transformResponse: (text) => text + ' A',
      }, makeAPI());
      defineExtension('ext-b', {
        transformResponse: (text) => text + ' B',
      }, makeAPI());
      const result = callTransformResponse('start', new Response(), {});
      expect(result).toBe('start A B');
    });
  });

  describe('callHandleSwap', () => {
    it('returns false if no extension handles swap', () => {
      const fragment = document.createDocumentFragment();
      const target = document.createElement('div');
      expect(callHandleSwap('replace', target, fragment)).toBe(false);
    });

    it('returns true if extension handles swap', () => {
      defineExtension('swap-ext', {
        handleSwap: () => true,
      }, makeAPI());
      const fragment = document.createDocumentFragment();
      const target = document.createElement('div');
      expect(callHandleSwap('replace', target, fragment)).toBe(true);
    });
  });
});
