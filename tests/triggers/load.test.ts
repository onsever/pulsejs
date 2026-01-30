import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupLoadTrigger } from '../../src/triggers/load';
import type { ParsedTriggerEvent, TriggerModifiers } from '../../src/types';

const defaultMods: TriggerModifiers = {
  once: false, changed: false, consume: false,
  debounce: null, throttle: null, delay: null,
};

describe('setupLoadTrigger', () => {
  it('fires via microtask by default', async () => {
    const el = document.createElement('div');
    const dispatch = vi.fn();

    const trigger: ParsedTriggerEvent = {
      name: 'load', isPolling: false, pollingInterval: null,
      filter: null, modifiers: defaultMods, from: null,
    };

    setupLoadTrigger(el, trigger, dispatch);

    // Not called synchronously
    expect(dispatch).not.toHaveBeenCalled();

    // Wait for microtask
    await Promise.resolve();
    expect(dispatch).toHaveBeenCalledWith(el);
  });

  it('fires with delay when delay modifier set', () => {
    vi.useFakeTimers();
    const el = document.createElement('div');
    const dispatch = vi.fn();

    const trigger: ParsedTriggerEvent = {
      name: 'load', isPolling: false, pollingInterval: null,
      filter: null, modifiers: { ...defaultMods, delay: 200 }, from: null,
    };

    setupLoadTrigger(el, trigger, dispatch);

    expect(dispatch).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(dispatch).toHaveBeenCalledWith(el);

    vi.useRealTimers();
  });

  it('cleanup cancels delayed load', () => {
    vi.useFakeTimers();
    const el = document.createElement('div');
    const dispatch = vi.fn();

    const trigger: ParsedTriggerEvent = {
      name: 'load', isPolling: false, pollingInterval: null,
      filter: null, modifiers: { ...defaultMods, delay: 500 }, from: null,
    };

    const instance = setupLoadTrigger(el, trigger, dispatch);
    instance.cleanup();

    vi.advanceTimersByTime(500);
    expect(dispatch).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('returns trigger instance with type load', () => {
    const el = document.createElement('div');
    const instance = setupLoadTrigger(el, {
      name: 'load', isPolling: false, pollingInterval: null,
      filter: null, modifiers: defaultMods, from: null,
    }, vi.fn());

    expect(instance.type).toBe('load');
    expect(typeof instance.cleanup).toBe('function');
  });
});
