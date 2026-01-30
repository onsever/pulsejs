import { describe, it, expect, vi, beforeEach } from 'vitest';
import { debounce, throttle, delay } from '../../src/triggers/timing';

describe('timing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe('debounce', () => {
    it('delays execution', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced('a');
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledWith('a');
    });

    it('resets timer on subsequent calls', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced('a');
      vi.advanceTimersByTime(50);
      debounced('b');
      vi.advanceTimersByTime(50);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('b');
    });
  });

  describe('throttle', () => {
    it('fires immediately on first call', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled('a');
      expect(fn).toHaveBeenCalledWith('a');
    });

    it('drops calls within the throttle window', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled('a');
      throttled('b');
      throttled('c');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('allows calls after throttle window', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled('a');
      vi.advanceTimersByTime(100);
      throttled('b');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('delay', () => {
    it('delays execution by ms', () => {
      const fn = vi.fn();
      const delayed = delay(fn, 50);

      delayed('a');
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledWith('a');
    });
  });
});
