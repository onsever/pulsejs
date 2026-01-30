import { ATTRS, ALL_ATTRS, DEFAULT_TRIGGERS } from '../constants';
import { parseRequest } from '../parsers/request';
import { parseTrigger } from '../parsers/trigger';
import { requestCache, triggerCache } from '../parsers/cache';
import { ensureState, getState, hasState, removeState } from './state';
import { resolveInheritance } from './inherit';
import { setupTriggers } from '../triggers/setup';
import { dispatchRequest } from '../request/dispatch';
import { parseOnAttribute, setupOnHandlers } from '../events/on-parser';

export function processElement(el: Element): void {
  if (hasState(el)) return;
  if (isInsideIgnored(el)) return;
  if (el.hasAttribute(ATTRS.IGNORE)) return;

  const state = ensureState(el);

  // Parse p-request
  const requestStr = el.getAttribute(ATTRS.REQUEST);
  if (requestStr) {
    let parsed = requestCache.get(requestStr, el);
    if (!parsed) {
      try {
        parsed = parseRequest(requestStr);
        requestCache.set(requestStr, parsed, el);
      } catch (e) {
        console.error((e as Error).message || e);
        return;
      }
    }
    state.parsedRequest = parsed;
  }

  // Parse p-trigger (or use default)
  const triggerStr = el.getAttribute(ATTRS.TRIGGER);
  if (triggerStr) {
    let parsed = triggerCache.get(triggerStr, el);
    if (!parsed) {
      try {
        parsed = parseTrigger(triggerStr);
        triggerCache.set(triggerStr, parsed, el);
      } catch (e) {
        console.error((e as Error).message || e);
        return;
      }
    }
    state.parsedTrigger = parsed;
  } else if (state.parsedRequest) {
    // Default trigger based on element type
    const tagName = el.tagName;
    const defaultEvent = DEFAULT_TRIGGERS[tagName] || DEFAULT_TRIGGERS.DEFAULT;
    if (defaultEvent) {
      const defaultTrigger = parseTrigger(defaultEvent);
      state.parsedTrigger = defaultTrigger;
    }
  }

  // Resolve inheritance
  state.inherited = resolveInheritance(el);

  // Setup triggers
  if (state.parsedRequest && state.parsedTrigger) {
    state.triggers = setupTriggers(el, state.parsedTrigger, (element, event) => {
      dispatchRequest(element, event);
    });
  }

  // Setup p-on handlers
  const onStr = el.getAttribute(ATTRS.ON);
  if (onStr) {
    const handlers = parseOnAttribute(onStr);
    state.onCleanup = setupOnHandlers(el, handlers);
  }
}

export function processTree(root: Element | Document): void {
  const selector = ALL_ATTRS.map(a => `[${a}]`).join(',');
  const elements = root.querySelectorAll(selector);
  for (let i = 0; i < elements.length; i++) {
    processElement(elements[i]);
  }
}

export function cleanupElement(el: Element): void {
  const state = getState(el);
  if (!state) return;

  // Cleanup triggers
  for (const trigger of state.triggers) {
    trigger.cleanup();
  }

  // Abort pending requests
  if (state.abortController) {
    state.abortController.abort();
  }

  // Cleanup p-on handlers
  if (state.onCleanup) {
    state.onCleanup();
  }

  removeState(el);
}

export function cleanupTree(root: Element): void {
  const selector = ALL_ATTRS.map(a => `[${a}]`).join(',');
  const elements = root.querySelectorAll(selector);
  for (let i = 0; i < elements.length; i++) {
    cleanupElement(elements[i]);
  }
  cleanupElement(root);
}

function isInsideIgnored(el: Element): boolean {
  let current = el.parentElement;
  while (current) {
    if (current.hasAttribute(ATTRS.IGNORE)) return true;
    current = current.parentElement;
  }
  return false;
}
