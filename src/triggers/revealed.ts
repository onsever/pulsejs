import type { ParsedTriggerEvent, TriggerInstance } from '../types';

let sharedObserver: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, () => void>();

function getObserver(): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const cb = callbacks.get(entry.target);
          if (cb) cb();
        }
      }
    });
  }
  return sharedObserver;
}

export function setupRevealedTrigger(
  el: Element,
  triggerEvent: ParsedTriggerEvent,
  dispatch: (el: Element) => void,
): TriggerInstance {
  const observer = getObserver();
  let fired = false;

  callbacks.set(el, () => {
    if (triggerEvent.modifiers.once && fired) return;
    fired = true;
    dispatch(el);
    if (triggerEvent.modifiers.once) {
      observer.unobserve(el);
      callbacks.delete(el);
    }
  });

  observer.observe(el);

  return {
    type: 'revealed',
    cleanup: () => {
      observer.unobserve(el);
      callbacks.delete(el);
    },
  };
}
