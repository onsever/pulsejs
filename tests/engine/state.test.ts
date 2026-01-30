import { describe, it, expect, beforeEach } from 'vitest';
import { getState, setState, ensureState, hasState, removeState } from '../../src/engine/state';

describe('engine/state', () => {
  let el: Element;

  beforeEach(() => {
    el = document.createElement('div');
  });

  it('getState returns undefined for unknown element', () => {
    expect(getState(el)).toBeUndefined();
  });

  it('setState and getState round-trip', () => {
    const state = {
      triggers: [],
      parsedRequest: null,
      parsedTrigger: null,
      inherited: { headers: {}, boost: null },
      abortController: null,
      lastValue: undefined,
      requestQueue: [],
      onCleanup: null,
    };
    setState(el, state);
    expect(getState(el)).toBe(state);
  });

  it('ensureState creates state if not present', () => {
    expect(hasState(el)).toBe(false);
    const state = ensureState(el);
    expect(state).toBeDefined();
    expect(state.triggers).toEqual([]);
    expect(state.parsedRequest).toBeNull();
    expect(hasState(el)).toBe(true);
  });

  it('ensureState returns existing state', () => {
    const first = ensureState(el);
    first.lastValue = 'test';
    const second = ensureState(el);
    expect(second.lastValue).toBe('test');
    expect(second).toBe(first);
  });

  it('hasState returns correct boolean', () => {
    expect(hasState(el)).toBe(false);
    ensureState(el);
    expect(hasState(el)).toBe(true);
  });

  it('removeState deletes state', () => {
    ensureState(el);
    expect(hasState(el)).toBe(true);
    removeState(el);
    expect(hasState(el)).toBe(false);
    expect(getState(el)).toBeUndefined();
  });
});
