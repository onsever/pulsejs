import { describe, it, expect, vi } from 'vitest';
import { evaluateFilter } from '../../src/triggers/filters';

describe('evaluateFilter', () => {
  it('returns true for truthy expression', () => {
    const event = new KeyboardEvent('keyup', { key: 'Enter' });
    const el = document.createElement('div');
    expect(evaluateFilter("key === 'Enter'", event, el)).toBe(true);
  });

  it('returns false for falsy expression', () => {
    const event = new KeyboardEvent('keyup', { key: 'a' });
    const el = document.createElement('div');
    expect(evaluateFilter("key === 'Enter'", event, el)).toBe(false);
  });

  it('supports ctrlKey modifier', () => {
    const event = new KeyboardEvent('keydown', { ctrlKey: true });
    const el = document.createElement('div');
    expect(evaluateFilter('ctrlKey', event, el)).toBe(true);
  });

  it('supports shiftKey modifier', () => {
    const event = new KeyboardEvent('keydown', { shiftKey: true });
    const el = document.createElement('div');
    expect(evaluateFilter('shiftKey', event, el)).toBe(true);
  });

  it('returns false on expression error', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const event = new Event('click');
    const el = document.createElement('div');
    expect(evaluateFilter('invalid(((', event, el)).toBe(false);
    spy.mockRestore();
  });

  it('provides event and element to expression', () => {
    const event = new MouseEvent('click');
    const el = document.createElement('button');
    expect(evaluateFilter('element.tagName === "BUTTON"', event, el)).toBe(true);
  });
});
