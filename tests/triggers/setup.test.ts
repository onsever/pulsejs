import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { setupTriggers } from '../../src/triggers/setup';

// Mock IntersectionObserver for jsdom
beforeAll(() => {
  globalThis.IntersectionObserver = class IntersectionObserver {
    constructor(private cb: IntersectionObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds = [] as number[];
    takeRecords() { return []; }
  } as any;
});
import type { ParsedTrigger, ParsedTriggerEvent, TriggerModifiers } from '../../src/types';

const defaultMods: TriggerModifiers = {
  once: false, changed: false, consume: false,
  debounce: null, throttle: null, delay: null,
};

function makeEvent(overrides: Partial<ParsedTriggerEvent> = {}): ParsedTriggerEvent {
  return {
    name: 'click',
    isPolling: false,
    pollingInterval: null,
    filter: null,
    modifiers: { ...defaultMods },
    from: null,
    ...overrides,
  };
}

describe('setupTriggers', () => {
  let el: HTMLElement;
  let dispatch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    el = document.createElement('button');
    document.body.appendChild(el);
    dispatch = vi.fn();
  });

  it('sets up event trigger for standard events', () => {
    const trigger: ParsedTrigger = { events: [makeEvent({ name: 'click' })] };
    const instances = setupTriggers(el, trigger, dispatch);

    expect(instances).toHaveLength(1);
    expect(instances[0].type).toBe('event');

    el.click();
    expect(dispatch).toHaveBeenCalledWith(el, expect.any(Event));
  });

  it('sets up load trigger', () => {
    const trigger: ParsedTrigger = { events: [makeEvent({ name: 'load' })] };
    const instances = setupTriggers(el, trigger, dispatch);

    expect(instances).toHaveLength(1);
    expect(instances[0].type).toBe('load');
  });

  it('sets up revealed trigger', () => {
    const trigger: ParsedTrigger = { events: [makeEvent({ name: 'revealed' })] };
    const instances = setupTriggers(el, trigger, dispatch);

    expect(instances).toHaveLength(1);
    expect(instances[0].type).toBe('revealed');
  });

  it('sets up intersect trigger (alias)', () => {
    const trigger: ParsedTrigger = { events: [makeEvent({ name: 'intersect' })] };
    const instances = setupTriggers(el, trigger, dispatch);

    expect(instances).toHaveLength(1);
    expect(instances[0].type).toBe('revealed');
  });

  it('sets up polling trigger', () => {
    const trigger: ParsedTrigger = {
      events: [makeEvent({ name: 'every', isPolling: true, pollingInterval: 1000 })],
    };
    const instances = setupTriggers(el, trigger, dispatch);

    expect(instances).toHaveLength(1);
    expect(instances[0].type).toBe('polling');
    instances[0].cleanup();
  });

  it('sets up multiple triggers', () => {
    const trigger: ParsedTrigger = {
      events: [makeEvent({ name: 'click' }), makeEvent({ name: 'mouseenter' })],
    };
    const instances = setupTriggers(el, trigger, dispatch);
    expect(instances).toHaveLength(2);
  });

  it('cleanup removes event listener', () => {
    const trigger: ParsedTrigger = { events: [makeEvent({ name: 'click' })] };
    const instances = setupTriggers(el, trigger, dispatch);

    instances[0].cleanup();
    el.click();
    expect(dispatch).not.toHaveBeenCalled();
  });
});
