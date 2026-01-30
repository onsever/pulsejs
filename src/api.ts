import type { HttpMethod, SwapBehavior, RequestContext, InheritedValues } from './types';
import { getConfig } from './engine/config';
import { buildFetchRequest } from './request/builder';
import { executeRequest } from './request/executor';
import { processResponse } from './response/processor';
import { parseHTML } from './response/parser';
import { performSwap } from './response/swap';
import { settle } from './response/settle';
import { emit } from './events/emitter';

export interface AjaxOptions {
  headers?: Record<string, string>;
  body?: Record<string, string>;
  swap?: SwapBehavior;
  target?: string;
}

/**
 * Internal ajax call used by P-Location and public API.
 */
export async function ajaxInternal(
  method: HttpMethod,
  url: string,
  target?: string | Element,
  options?: AjaxOptions,
): Promise<void> {
  const config = getConfig();
  const targetSelector = typeof target === 'string' ? target : 'body';
  const behavior: SwapBehavior = options?.swap || config.defaultSwap;

  // Build a synthetic context
  const targetEl = typeof target === 'string'
    ? (document.querySelector(target) ?? document.body)
    : (target ?? document.body);

  const ctx: RequestContext = {
    element: targetEl,
    parsed: {
      headers: options?.headers ?? {},
      method,
      url,
      body: options?.body ? { type: 'json', data: options.body, selectors: null, filter: null } : null,
      target: { selector: targetSelector, behavior },
      modifiers: [],
    },
    trigger: null,
    inherited: { headers: {}, boost: null },
    abortController: new AbortController(),
  };

  const request = buildFetchRequest(ctx, config);
  const response = await executeRequest(request, ctx, config);
  await processResponse(response, ctx, config);
}

/**
 * Public Pulse.ajax() — returns a Promise.
 */
export function ajax(
  method: string,
  url: string,
  target?: string | Element,
  options?: AjaxOptions,
): Promise<void> {
  return ajaxInternal(method.toUpperCase() as HttpMethod, url, target, options);
}

/**
 * Pulse.swap() — swap DOM content programmatically.
 */
export async function swap(
  target: string | Element,
  content: string,
  behavior: SwapBehavior = 'replace',
): Promise<void> {
  const config = getConfig();
  const el = typeof target === 'string'
    ? document.querySelector(target)
    : target;
  if (!el) return;

  const fragment = parseHTML(content);
  performSwap(el, fragment, behavior);

  const newElements = Array.from(el.querySelectorAll('*')) as Element[];
  await settle(el, newElements, config);

  const { processTree } = await import('./engine/process');
  processTree(el);
}

/**
 * Pulse.trigger() — dispatch a custom event.
 */
export function trigger(el: Element | string, eventName: string, detail?: any): boolean {
  const target = typeof el === 'string' ? document.querySelector(el) : el;
  if (!target) return false;
  return emit(target, eventName, detail ?? {});
}

/**
 * Pulse.on() — global event listener (auto-prefixes pulse:).
 */
export function on(eventName: string, handler: EventListener): void {
  const name = eventName.startsWith('pulse:') ? eventName : `pulse:${eventName}`;
  document.addEventListener(name, handler);
}

/**
 * Pulse.off() — remove global event listener.
 */
export function off(eventName: string, handler: EventListener): void {
  const name = eventName.startsWith('pulse:') ? eventName : `pulse:${eventName}`;
  document.removeEventListener(name, handler);
}

// DOM helpers
export function find(selector: string): Element | null {
  return document.querySelector(selector);
}

export function findAll(selector: string): Element[] {
  return Array.from(document.querySelectorAll(selector));
}

export function closest(el: Element, selector: string): Element | null {
  return el.closest(selector);
}

export function addClass(el: Element, cls: string): void {
  el.classList.add(cls);
}

export function removeClass(el: Element, cls: string): void {
  el.classList.remove(cls);
}

export function toggleClass(el: Element, cls: string): void {
  el.classList.toggle(cls);
}

export function remove(el: Element): void {
  el.remove();
}

export function values(el: Element | string): Record<string, unknown> {
  const target = typeof el === 'string' ? document.querySelector(el) : el;
  if (!target) return {};

  const result: Record<string, unknown> = {};
  if (target instanceof HTMLFormElement) {
    const fd = new FormData(target);
    for (const [key, value] of fd.entries()) {
      if (result[key] !== undefined) {
        const existing = result[key];
        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          result[key] = [existing, value];
        }
      } else {
        result[key] = value;
      }
    }
  } else {
    const inputs = target.querySelectorAll('input, select, textarea');
    for (const input of inputs) {
      const inp = input as HTMLInputElement;
      const name = inp.name || inp.id;
      if (!name) continue;
      if (inp.type === 'checkbox') {
        result[name] = inp.checked;
      } else if (inp.type === 'radio') {
        if (inp.checked) result[name] = inp.value;
      } else {
        result[name] = inp.value;
      }
    }
  }
  return result;
}
