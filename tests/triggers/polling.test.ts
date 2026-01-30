import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setupPollingTrigger } from '../../src/triggers/polling';
import type { ParsedTriggerEvent, TriggerModifiers } from '../../src/types';

const defaultMods: TriggerModifiers = {
  once: false, changed: false, consume: false,
  debounce: null, throttle: null, delay: null,
};

describe('setupPollingTrigger', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls dispatch at interval', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const dispatch = vi.fn();

    const trigger: ParsedTriggerEvent = {
      name: 'every', isPolling: true, pollingInterval: 1000,
      filter: null, modifiers: defaultMods, from: null,
    };

    const instance = setupPollingTrigger(el, trigger, dispatch);

    vi.advanceTimersByTime(3000);
    expect(dispatch).toHaveBeenCalledTimes(3);

    instance.cleanup();
  });

  it('defaults to 1000ms interval', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const dispatch = vi.fn();

    const trigger: ParsedTriggerEvent = {
      name: 'every', isPolling: true, pollingInterval: null,
      filter: null, modifiers: defaultMods, from: null,
    };

    const instance = setupPollingTrigger(el, trigger, dispatch);

    vi.advanceTimersByTime(2500);
    expect(dispatch).toHaveBeenCalledTimes(2);

    instance.cleanup();
  });

  it('stops when element is disconnected', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const dispatch = vi.fn();

    const trigger: ParsedTriggerEvent = {
      name: 'every', isPolling: true, pollingInterval: 500,
      filter: null, modifiers: defaultMods, from: null,
    };

    setupPollingTrigger(el, trigger, dispatch);

    vi.advanceTimersByTime(500);
    expect(dispatch).toHaveBeenCalledTimes(1);

    el.remove(); // disconnect
    vi.advanceTimersByTime(1000);
    expect(dispatch).toHaveBeenCalledTimes(1); // no more calls
  });

  it('cleanup stops the interval', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const dispatch = vi.fn();

    const trigger: ParsedTriggerEvent = {
      name: 'every', isPolling: true, pollingInterval: 100,
      filter: null, modifiers: defaultMods, from: null,
    };

    const instance = setupPollingTrigger(el, trigger, dispatch);
    instance.cleanup();

    vi.advanceTimersByTime(500);
    expect(dispatch).not.toHaveBeenCalled();
  });
});
