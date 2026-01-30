import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupEventTrigger } from '../../src/triggers/event';
import { ensureState } from '../../src/engine/state';
import type { ParsedTriggerEvent, TriggerModifiers } from '../../src/types';

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

describe('setupEventTrigger', () => {
  let el: HTMLElement;
  let dispatch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    el = document.createElement('button');
    document.body.innerHTML = '';
    document.body.appendChild(el);
    dispatch = vi.fn();
  });

  it('fires dispatch on event', () => {
    setupEventTrigger(el, makeEvent(), dispatch);
    el.click();
    expect(dispatch).toHaveBeenCalledWith(el, expect.any(Event));
  });

  it('respects once modifier', () => {
    setupEventTrigger(el, makeEvent({ modifiers: { ...defaultMods, once: true } }), dispatch);
    el.click();
    el.click();
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it('respects consume modifier (stopPropagation)', () => {
    const parent = document.createElement('div');
    parent.appendChild(el);
    document.body.appendChild(parent);
    const parentHandler = vi.fn();
    parent.addEventListener('click', parentHandler);

    setupEventTrigger(el, makeEvent({ modifiers: { ...defaultMods, consume: true } }), dispatch);
    el.click();

    expect(dispatch).toHaveBeenCalled();
    expect(parentHandler).not.toHaveBeenCalled();
  });

  it('respects changed modifier', () => {
    const input = document.createElement('input') as HTMLInputElement;
    document.body.appendChild(input);
    ensureState(input);

    setupEventTrigger(input, makeEvent({
      name: 'input',
      modifiers: { ...defaultMods, changed: true },
    }), dispatch);

    input.value = 'hello';
    input.dispatchEvent(new Event('input'));
    expect(dispatch).toHaveBeenCalledTimes(1);

    // Same value — should not fire
    input.dispatchEvent(new Event('input'));
    expect(dispatch).toHaveBeenCalledTimes(1);

    // Different value — should fire
    input.value = 'world';
    input.dispatchEvent(new Event('input'));
    expect(dispatch).toHaveBeenCalledTimes(2);
  });

  it('respects filter expression', () => {
    setupEventTrigger(el, makeEvent({
      name: 'keyup',
      filter: "key === 'Enter'",
    }), dispatch);

    el.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
    expect(dispatch).not.toHaveBeenCalled();

    el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it('supports from: window', () => {
    setupEventTrigger(el, makeEvent({ from: 'window', name: 'resize' }), dispatch);
    window.dispatchEvent(new Event('resize'));
    expect(dispatch).toHaveBeenCalled();
  });

  it('supports from: document', () => {
    setupEventTrigger(el, makeEvent({ from: 'document', name: 'custom' }), dispatch);
    document.dispatchEvent(new Event('custom'));
    expect(dispatch).toHaveBeenCalled();
  });

  it('supports from: CSS selector', () => {
    const other = document.createElement('div');
    other.id = 'other';
    document.body.appendChild(other);

    setupEventTrigger(el, makeEvent({ from: '#other', name: 'click' }), dispatch);
    other.click();
    expect(dispatch).toHaveBeenCalled();
  });

  it('cleanup removes the listener', () => {
    const instance = setupEventTrigger(el, makeEvent(), dispatch);
    instance.cleanup();
    el.click();
    expect(dispatch).not.toHaveBeenCalled();
  });
});
