import { describe, it, expect, vi } from 'vitest';
import { parseOnAttribute, setupOnHandlers } from '../../src/events/on-parser';

describe('parseOnAttribute', () => {
  it('parses a single handler', () => {
    const result = parseOnAttribute("before: console.log('hi')");
    expect(result).toEqual([{ event: 'before', handler: "console.log('hi')" }]);
  });

  it('parses multiple handlers separated by |', () => {
    const result = parseOnAttribute("before: doA() | after: doB()");
    expect(result).toEqual([
      { event: 'before', handler: 'doA()' },
      { event: 'after', handler: 'doB()' },
    ]);
  });

  it('returns empty handler when no colon present', () => {
    const result = parseOnAttribute('before');
    expect(result).toEqual([{ event: 'before', handler: '' }]);
  });

  it('trims whitespace from event and handler', () => {
    const result = parseOnAttribute('  before  :  doSomething()  ');
    expect(result).toEqual([{ event: 'before', handler: 'doSomething()' }]);
  });

  it('handles handler with colons in it', () => {
    const result = parseOnAttribute("before: x ? 'a:b' : 'c'");
    expect(result).toEqual([{ event: 'before', handler: "x ? 'a:b' : 'c'" }]);
  });
});

describe('setupOnHandlers', () => {
  it('adds event listeners with pulse: prefix', () => {
    const el = document.createElement('div');
    const spy = vi.spyOn(el, 'addEventListener');

    setupOnHandlers(el, [{ event: 'before', handler: 'return true' }]);

    expect(spy).toHaveBeenCalledWith('pulse:before', expect.any(Function));
  });

  it('skips handlers with empty handler string', () => {
    const el = document.createElement('div');
    const spy = vi.spyOn(el, 'addEventListener');

    setupOnHandlers(el, [{ event: 'before', handler: '' }]);

    expect(spy).not.toHaveBeenCalled();
  });

  it('cleanup function removes listeners', () => {
    const el = document.createElement('div');
    const spy = vi.spyOn(el, 'removeEventListener');

    const cleanup = setupOnHandlers(el, [{ event: 'before', handler: 'return true' }]);
    cleanup();

    expect(spy).toHaveBeenCalledWith('pulse:before', expect.any(Function));
  });

  it('executes handler when event is dispatched', () => {
    const el = document.createElement('div');
    const fn = vi.fn();
    (globalThis as any).__testFn = fn;

    setupOnHandlers(el, [{ event: 'before', handler: '__testFn()' }]);
    el.dispatchEvent(new CustomEvent('pulse:before'));

    expect(fn).toHaveBeenCalledTimes(1);
    delete (globalThis as any).__testFn;
  });

  it('logs error for invalid handler compilation', () => {
    const el = document.createElement('div');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    setupOnHandlers(el, [{ event: 'before', handler: '{{invalid' }]);

    expect(spy).toHaveBeenCalledWith('Pulse: Failed to compile p-on handler:', '{{invalid', expect.any(Error));
    spy.mockRestore();
  });

  it('logs error for handler runtime error', () => {
    const el = document.createElement('div');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    setupOnHandlers(el, [{ event: 'before', handler: 'throw new Error("boom")' }]);
    el.dispatchEvent(new CustomEvent('pulse:before'));

    expect(spy).toHaveBeenCalledWith('Pulse: p-on handler error:', expect.any(Error));
    spy.mockRestore();
  });
});
