import { describe, it, expect, vi } from 'vitest';
import { processServerTriggers } from '../../src/events/server-events';

describe('processServerTriggers', () => {
  it('dispatches CSV event names', () => {
    const target = document.createElement('div');
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    target.addEventListener('eventA', handler1);
    target.addEventListener('eventB', handler2);

    processServerTriggers('eventA, eventB', target);

    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });

  it('dispatches single event', () => {
    const target = document.createElement('div');
    const handler = vi.fn();
    target.addEventListener('myEvent', handler);

    processServerTriggers('myEvent', target);
    expect(handler).toHaveBeenCalled();
  });

  it('dispatches JSON format with detail', () => {
    const target = document.createElement('div');
    let receivedDetail: any = null;
    target.addEventListener('showMessage', ((e: CustomEvent) => {
      receivedDetail = e.detail;
    }) as EventListener);

    processServerTriggers('{"showMessage": {"text": "Hello"}}', target);
    expect(receivedDetail).toEqual({ text: 'Hello' });
  });

  it('dispatches multiple JSON events', () => {
    const target = document.createElement('div');
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    target.addEventListener('ev1', handler1);
    target.addEventListener('ev2', handler2);

    processServerTriggers('{"ev1": {}, "ev2": {"key": "val"}}', target);
    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });

  it('falls back to CSV on invalid JSON', () => {
    const target = document.createElement('div');
    const handler = vi.fn();
    target.addEventListener('{invalid', handler);
    // "{invalid" starts with { but isn't valid JSON, so falls to CSV
    processServerTriggers('{invalid', target);
    expect(handler).toHaveBeenCalled();
  });

  it('skips empty entries in CSV', () => {
    const target = document.createElement('div');
    const handler = vi.fn();
    target.addEventListener('ev', handler);

    processServerTriggers('ev, , ', target);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('trims whitespace from event names', () => {
    const target = document.createElement('div');
    const handler = vi.fn();
    target.addEventListener('trimmed', handler);

    processServerTriggers('  trimmed  ', target);
    expect(handler).toHaveBeenCalled();
  });
});
