import { describe, it, expect, beforeEach } from 'vitest';
import { checkSync, processQueue } from '../../src/request/sync';
import { ensureState } from '../../src/engine/state';

describe('request/sync', () => {
  let el: HTMLElement;

  beforeEach(() => {
    el = document.createElement('div');
    document.body.appendChild(el);
  });

  describe('checkSync', () => {
    it('returns proceed when no state', () => {
      const other = document.createElement('div');
      expect(checkSync(other, 'abort')).toBe('proceed');
    });

    it('returns proceed when no active request (abort mode)', () => {
      ensureState(el);
      expect(checkSync(el, 'abort')).toBe('proceed');
    });

    it('aborts previous and proceeds (abort mode)', () => {
      const state = ensureState(el);
      const ac = new AbortController();
      state.abortController = ac;

      expect(checkSync(el, 'abort')).toBe('proceed');
      expect(ac.signal.aborted).toBe(true);
      expect(state.abortController).toBeNull();
    });

    it('drops when active request exists (drop mode)', () => {
      const state = ensureState(el);
      state.abortController = new AbortController();

      expect(checkSync(el, 'drop')).toBe('drop');
    });

    it('returns proceed when no active request (drop mode)', () => {
      ensureState(el);
      expect(checkSync(el, 'drop')).toBe('proceed');
    });

    it('returns queue when active request (queue mode)', () => {
      const state = ensureState(el);
      state.abortController = new AbortController();

      expect(checkSync(el, 'queue')).toBe('queue');
    });

    it('returns proceed for unknown mode', () => {
      ensureState(el);
      expect(checkSync(el, 'unknown')).toBe('proceed');
    });
  });

  describe('processQueue', () => {
    it('does nothing when no state', () => {
      const other = document.createElement('div');
      processQueue(other); // should not throw
    });

    it('does nothing when queue is empty', () => {
      ensureState(el);
      processQueue(el); // should not throw
    });

    it('resolves the next queued request', () => {
      const state = ensureState(el);
      let resolved = false;
      state.requestQueue.push({
        context: {} as any,
        resolve: () => { resolved = true; },
      });

      processQueue(el);
      expect(resolved).toBe(true);
      expect(state.requestQueue).toHaveLength(0);
    });
  });
});
