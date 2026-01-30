import type { ParsedTrigger, TriggerInstance } from '../types';
import { setupEventTrigger } from './event';
import { setupLoadTrigger } from './load';
import { setupRevealedTrigger } from './revealed';
import { setupPollingTrigger } from './polling';

export function setupTriggers(
  el: Element,
  parsedTrigger: ParsedTrigger,
  dispatch: (el: Element, event?: Event) => void,
): TriggerInstance[] {
  const instances: TriggerInstance[] = [];

  for (const triggerEvent of parsedTrigger.events) {
    if (triggerEvent.isPolling) {
      instances.push(setupPollingTrigger(el, triggerEvent, dispatch));
    } else if (triggerEvent.name === 'load') {
      instances.push(setupLoadTrigger(el, triggerEvent, dispatch));
    } else if (triggerEvent.name === 'revealed' || triggerEvent.name === 'intersect') {
      instances.push(setupRevealedTrigger(el, triggerEvent, dispatch));
    } else {
      instances.push(setupEventTrigger(el, triggerEvent, dispatch));
    }
  }

  return instances;
}
