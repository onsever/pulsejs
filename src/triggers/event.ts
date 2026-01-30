import type { ParsedTriggerEvent, TriggerInstance } from '../types';
import { evaluateFilter } from './filters';
import { debounce, throttle, delay } from './timing';
import { getState } from '../engine/state';

export function setupEventTrigger(
  el: Element,
  triggerEvent: ParsedTriggerEvent,
  dispatch: (el: Element, event?: Event) => void,
): TriggerInstance {
  // Resolve event target
  let target: EventTarget = el;
  if (triggerEvent.from) {
    if (triggerEvent.from === 'window') target = window;
    else if (triggerEvent.from === 'document') target = document;
    else if (triggerEvent.from === 'body') target = document.body;
    else {
      const found = document.querySelector(triggerEvent.from);
      if (found) target = found;
    }
  }

  let fired = false;

  let handler = (event: Event) => {
    // Filter check
    if (triggerEvent.filter) {
      if (!evaluateFilter(triggerEvent.filter, event, el)) return;
    }

    // Changed check
    if (triggerEvent.modifiers.changed) {
      const state = getState(el);
      const currentValue = (el as HTMLInputElement).value;
      if (state && state.lastValue === currentValue) return;
      if (state) state.lastValue = currentValue;
    }

    // Once check
    if (triggerEvent.modifiers.once && fired) return;
    fired = true;

    // Consume (stopPropagation)
    if (triggerEvent.modifiers.consume) {
      event.stopPropagation();
    }

    dispatch(el, event);
  };

  // Wrap with timing modifiers
  if (triggerEvent.modifiers.debounce) {
    const original = handler;
    const debounced = debounce((e: unknown) => original(e as Event), triggerEvent.modifiers.debounce);
    handler = (e: Event) => debounced(e);
  } else if (triggerEvent.modifiers.throttle) {
    const original = handler;
    const throttled = throttle((e: unknown) => original(e as Event), triggerEvent.modifiers.throttle);
    handler = (e: Event) => throttled(e);
  }

  if (triggerEvent.modifiers.delay) {
    const original = handler;
    const delayed = delay((e: unknown) => original(e as Event), triggerEvent.modifiers.delay);
    handler = (e: Event) => delayed(e);
  }

  target.addEventListener(triggerEvent.name, handler);

  return {
    type: 'event',
    cleanup: () => target.removeEventListener(triggerEvent.name, handler),
  };
}
