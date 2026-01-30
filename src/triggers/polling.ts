import type { ParsedTriggerEvent, TriggerInstance } from '../types';

export function setupPollingTrigger(
  el: Element,
  triggerEvent: ParsedTriggerEvent,
  dispatch: (el: Element) => void,
): TriggerInstance {
  const interval = triggerEvent.pollingInterval ?? 1000;

  const id = setInterval(() => {
    if (!el.isConnected) {
      clearInterval(id);
      return;
    }
    dispatch(el);
  }, interval);

  return {
    type: 'polling',
    cleanup: () => clearInterval(id),
  };
}
