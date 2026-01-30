import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ajax, swap, trigger, on, off,
  find, findAll, closest,
  addClass, removeClass, toggleClass,
  remove, values,
} from '../../src/api';

// Mock internal dependencies
vi.mock('../../src/engine/config', () => ({
  getConfig: vi.fn(() => ({
    defaultSwap: 'replace',
    defaultTarget: 'this',
    timeout: 0,
    defaultSwapDelay: 0,
    defaultSettleDelay: 20,
    selfRequestsOnly: true,
    allowScriptTags: true,
    allowEval: true,
    globalViewTransitions: false,
    indicatorClass: 'pulse-indicator',
    requestClass: 'pulse-request',
    withCredentials: false,
    historyEnabled: true,
    historyCacheSize: 10,
    refreshOnHistoryMiss: false,
    scrollBehavior: 'instant',
    ignoreTitle: false,
    inlineScriptNonce: '',
    responseHandling: [
      { code: '2xx', swap: true, error: false, ignoreTitle: false, select: '', target: '' },
    ],
  })),
}));

vi.mock('../../src/request/builder', () => ({
  buildFetchRequest: vi.fn(() => new Request('http://localhost/api')),
}));

vi.mock('../../src/request/executor', () => ({
  executeRequest: vi.fn(() => Promise.resolve(new Response('<p>hi</p>', { status: 200 }))),
}));

vi.mock('../../src/response/processor', () => ({
  processResponse: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../src/engine/process', () => ({
  processTree: vi.fn(),
}));

vi.mock('../../src/response/settle', () => ({
  settle: vi.fn(() => Promise.resolve()),
}));

import { buildFetchRequest } from '../../src/request/builder';
import { executeRequest } from '../../src/request/executor';
import { processResponse } from '../../src/response/processor';

describe('JS Public API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('ajax', () => {
    it('calls build, execute, and process', async () => {
      document.body.innerHTML = '<div id="target">old</div>';
      await ajax('GET', '/api', '#target');

      expect(buildFetchRequest).toHaveBeenCalled();
      expect(executeRequest).toHaveBeenCalled();
      expect(processResponse).toHaveBeenCalled();
    });

    it('uppercases the method', async () => {
      await ajax('get', '/api');
      const ctx = (buildFetchRequest as any).mock.calls[0][0];
      expect(ctx.parsed.method).toBe('GET');
    });

    it('accepts options with headers and body', async () => {
      await ajax('POST', '/api', 'body', {
        headers: { 'X-Custom': 'val' },
        body: { name: 'test' },
      });
      const ctx = (buildFetchRequest as any).mock.calls[0][0];
      expect(ctx.parsed.headers['X-Custom']).toBe('val');
      expect(ctx.parsed.body).toEqual({
        type: 'json',
        data: { name: 'test' },
        selectors: null,
        filter: null,
      });
    });

    it('defaults target to body', async () => {
      await ajax('GET', '/test');
      const ctx = (buildFetchRequest as any).mock.calls[0][0];
      expect(ctx.parsed.target.selector).toBe('body');
    });

    it('accepts Element as target', async () => {
      const el = document.createElement('div');
      document.body.appendChild(el);
      await ajax('GET', '/test', el);
      const ctx = (buildFetchRequest as any).mock.calls[0][0];
      expect(ctx.element).toBe(el);
    });
  });

  describe('swap', () => {
    it('swaps content into target by selector', async () => {
      document.body.innerHTML = '<div id="target">old</div>';
      await swap('#target', '<p>new</p>');
      expect(document.getElementById('target')!.innerHTML).toBe('<p>new</p>');
    });

    it('swaps content into target Element', async () => {
      const el = document.createElement('div');
      el.textContent = 'old';
      document.body.appendChild(el);
      await swap(el, '<span>new</span>');
      expect(el.innerHTML).toBe('<span>new</span>');
    });

    it('supports append behavior', async () => {
      document.body.innerHTML = '<div id="target"><span>old</span></div>';
      await swap('#target', '<p>new</p>', 'append');
      expect(document.getElementById('target')!.innerHTML).toBe('<span>old</span><p>new</p>');
    });

    it('does nothing if target not found', async () => {
      await swap('#nonexistent', '<p>new</p>');
      // Should not throw
    });
  });

  describe('trigger', () => {
    it('dispatches a custom event on element', () => {
      const el = document.createElement('div');
      const handler = vi.fn();
      el.addEventListener('myEvent', handler);

      trigger(el, 'myEvent', { foo: 'bar' });

      expect(handler).toHaveBeenCalled();
    });

    it('accepts a string selector', () => {
      document.body.innerHTML = '<div id="target"></div>';
      const handler = vi.fn();
      document.getElementById('target')!.addEventListener('test', handler);

      trigger('#target', 'test');
      expect(handler).toHaveBeenCalled();
    });

    it('returns false if element not found', () => {
      expect(trigger('#nope', 'test')).toBe(false);
    });
  });

  describe('on/off', () => {
    it('adds and removes global pulse event listeners', () => {
      const handler = vi.fn();
      on('beforeSwap', handler);

      document.dispatchEvent(new CustomEvent('pulse:beforeSwap', { bubbles: true }));
      expect(handler).toHaveBeenCalledTimes(1);

      off('beforeSwap', handler);
      document.dispatchEvent(new CustomEvent('pulse:beforeSwap', { bubbles: true }));
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('auto-prefixes pulse: if not present', () => {
      const handler = vi.fn();
      on('afterSwap', handler);

      document.dispatchEvent(new CustomEvent('pulse:afterSwap', { bubbles: true }));
      expect(handler).toHaveBeenCalledTimes(1);
      off('afterSwap', handler);
    });

    it('does not double-prefix', () => {
      const handler = vi.fn();
      on('pulse:error', handler);

      document.dispatchEvent(new CustomEvent('pulse:error', { bubbles: true }));
      expect(handler).toHaveBeenCalledTimes(1);
      off('pulse:error', handler);
    });
  });

  describe('DOM helpers', () => {
    beforeEach(() => {
      document.body.innerHTML = '<div class="a" id="one"><span class="b"></span></div><div class="a" id="two"></div>';
    });

    it('find returns first match', () => {
      expect(find('.a')?.id).toBe('one');
    });

    it('find returns null if not found', () => {
      expect(find('.nope')).toBeNull();
    });

    it('findAll returns all matches', () => {
      expect(findAll('.a')).toHaveLength(2);
    });

    it('closest finds ancestor', () => {
      const span = document.querySelector('.b')!;
      expect(closest(span, '.a')?.id).toBe('one');
    });

    it('addClass adds class', () => {
      const el = document.getElementById('one')!;
      addClass(el, 'new-class');
      expect(el.classList.contains('new-class')).toBe(true);
    });

    it('removeClass removes class', () => {
      const el = document.getElementById('one')!;
      removeClass(el, 'a');
      expect(el.classList.contains('a')).toBe(false);
    });

    it('toggleClass toggles class', () => {
      const el = document.getElementById('one')!;
      toggleClass(el, 'a');
      expect(el.classList.contains('a')).toBe(false);
      toggleClass(el, 'a');
      expect(el.classList.contains('a')).toBe(true);
    });

    it('remove removes element from DOM', () => {
      const el = document.getElementById('one')!;
      remove(el);
      expect(document.getElementById('one')).toBeNull();
    });
  });

  describe('values', () => {
    it('collects form values via FormData', () => {
      document.body.innerHTML = '<form id="f"><input name="name" value="John"><input name="age" value="30"></form>';
      const result = values('#f');
      expect(result.name).toBe('John');
      expect(result.age).toBe('30');
    });

    it('collects input values from non-form container', () => {
      document.body.innerHTML = '<div id="d"><input name="x" value="1"><select name="y"><option value="a" selected>A</option></select></div>';
      const result = values('#d');
      expect(result.x).toBe('1');
      expect(result.y).toBe('a');
    });

    it('returns empty object if not found', () => {
      expect(values('#nope')).toEqual({});
    });

    it('accepts Element directly', () => {
      document.body.innerHTML = '<div id="d"><input name="val" value="hi"></div>';
      const el = document.getElementById('d')!;
      expect(values(el).val).toBe('hi');
    });
  });
});
