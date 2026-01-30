import { CSS } from '../constants';
import type { PulseConfig } from '../types';

export function settle(target: Element, newElements: Element[], config: PulseConfig): Promise<void> {
  target.classList.add(CSS.SETTLING);
  for (const el of newElements) {
    el.classList.add(CSS.ADDED);
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      target.classList.remove(CSS.SETTLING);
      for (const el of newElements) {
        el.classList.remove(CSS.ADDED);
      }
      resolve();
    }, config.defaultSettleDelay);
  });
}
