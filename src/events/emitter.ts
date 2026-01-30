import type { PulseEventDetail } from '../types';

export function emit(
  target: EventTarget,
  name: string,
  detail: Partial<PulseEventDetail>,
  cancelable = false,
): boolean {
  const event = new CustomEvent(name, {
    bubbles: true,
    cancelable,
    detail,
  });
  target.dispatchEvent(event);
  return !event.defaultPrevented;
}
