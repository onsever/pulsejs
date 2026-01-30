import { describe, it, expect } from 'vitest';
import { parseTrigger } from '../../src/parsers/trigger';

describe('parseTrigger', () => {
  it('parses simple event', () => {
    const t = parseTrigger('click');
    expect(t.events).toHaveLength(1);
    expect(t.events[0].name).toBe('click');
    expect(t.events[0].isPolling).toBe(false);
  });

  it('parses once modifier', () => {
    const t = parseTrigger('click once');
    expect(t.events[0].modifiers.once).toBe(true);
  });

  it('parses changed modifier', () => {
    const t = parseTrigger('input changed');
    expect(t.events[0].name).toBe('input');
    expect(t.events[0].modifiers.changed).toBe(true);
  });

  it('parses debounce', () => {
    const t = parseTrigger('input debounce 300ms');
    expect(t.events[0].modifiers.debounce).toBe(300);
  });

  it('parses throttle with seconds', () => {
    const t = parseTrigger('scroll throttle 1s');
    expect(t.events[0].modifiers.throttle).toBe(1000);
  });

  it('parses delay', () => {
    const t = parseTrigger('click delay 500ms');
    expect(t.events[0].modifiers.delay).toBe(500);
  });

  it('parses filter expression', () => {
    const t = parseTrigger('click[ctrlKey]');
    expect(t.events[0].filter).toBe('ctrlKey');
  });

  it('parses from clause', () => {
    const t = parseTrigger('input from #search');
    expect(t.events[0].from).toBe('#search');
  });

  it('parses polling', () => {
    const t = parseTrigger('every 2s');
    expect(t.events[0].isPolling).toBe(true);
    expect(t.events[0].pollingInterval).toBe(2000);
  });

  it('parses multiple events', () => {
    const t = parseTrigger('click, input changed');
    expect(t.events).toHaveLength(2);
    expect(t.events[0].name).toBe('click');
    expect(t.events[1].name).toBe('input');
    expect(t.events[1].modifiers.changed).toBe(true);
  });

  it('parses consume modifier', () => {
    const t = parseTrigger('click consume');
    expect(t.events[0].modifiers.consume).toBe(true);
  });

  it('parses combined modifiers', () => {
    const t = parseTrigger('input changed debounce 300ms');
    expect(t.events[0].modifiers.changed).toBe(true);
    expect(t.events[0].modifiers.debounce).toBe(300);
  });
});
