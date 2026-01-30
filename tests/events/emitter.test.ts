import { describe, it, expect, vi } from 'vitest';
import { emit } from '../../src/events/emitter';

describe('emit', () => {
  it('dispatches a CustomEvent on target', () => {
    const el = document.createElement('div');
    const handler = vi.fn();
    el.addEventListener('pulse:test', handler);

    emit(el, 'pulse:test', { element: el });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('event bubbles by default', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.appendChild(child);
    document.body.appendChild(parent);

    const handler = vi.fn();
    parent.addEventListener('pulse:test', handler);

    emit(child, 'pulse:test', { element: child });
    expect(handler).toHaveBeenCalled();
  });

  it('passes detail to event', () => {
    const el = document.createElement('div');
    let receivedDetail: any = null;
    el.addEventListener('pulse:test', ((e: CustomEvent) => {
      receivedDetail = e.detail;
    }) as EventListener);

    emit(el, 'pulse:test', { element: el });
    expect(receivedDetail).toEqual({ element: el });
  });

  it('returns true when not cancelled', () => {
    const el = document.createElement('div');
    expect(emit(el, 'pulse:test', {}, true)).toBe(true);
  });

  it('returns false when cancelled', () => {
    const el = document.createElement('div');
    el.addEventListener('pulse:test', (e) => e.preventDefault());
    expect(emit(el, 'pulse:test', {}, true)).toBe(false);
  });

  it('is not cancelable by default', () => {
    const el = document.createElement('div');
    el.addEventListener('pulse:test', (e) => e.preventDefault());
    // cancelable defaults to false, so preventDefault has no effect
    expect(emit(el, 'pulse:test', {})).toBe(true);
  });
});
