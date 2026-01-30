import type { ElementState } from '../types';

const elementStates = new WeakMap<Element, ElementState>();

export function getState(el: Element): ElementState | undefined {
  return elementStates.get(el);
}

export function setState(el: Element, state: ElementState): void {
  elementStates.set(el, state);
}

export function ensureState(el: Element): ElementState {
  let state = elementStates.get(el);
  if (!state) {
    state = {
      triggers: [],
      parsedRequest: null,
      parsedTrigger: null,
      inherited: { headers: {}, boost: null },
      abortController: null,
      lastValue: undefined,
      requestQueue: [],
      onCleanup: null,
    };
    elementStates.set(el, state);
  }
  return state;
}

export function hasState(el: Element): boolean {
  return elementStates.has(el);
}

export function removeState(el: Element): void {
  elementStates.delete(el);
}
