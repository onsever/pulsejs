import type { ParsedTriggerEvent, TriggerInstance } from '../types';

export function setupLoadTrigger(
  el: Element,
  triggerEvent: ParsedTriggerEvent,
  dispatch: (el: Element) => void,
): TriggerInstance {
  const ms = triggerEvent.modifiers.delay;

  if (ms) {
    const timer = setTimeout(() => dispatch(el), ms);
    return { type: 'load', cleanup: () => clearTimeout(timer) };
  }

  queueMicrotask(() => dispatch(el));
  return { type: 'load', cleanup: () => {} };
}
