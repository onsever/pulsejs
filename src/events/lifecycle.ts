import type { RequestContext } from '../types';
import { emit } from './emitter';

export function emitBefore(el: Element, ctx: RequestContext): boolean {
  return emit(el, 'pulse:before', { element: el, request: ctx }, true);
}

export function emitBeforeSend(el: Element, ctx: RequestContext): boolean {
  return emit(el, 'pulse:beforeSend', { element: el, request: ctx }, true);
}

export function emitBeforeSwap(el: Element, target: Element, content: DocumentFragment): boolean {
  return emit(el, 'pulse:beforeSwap', { element: el, target, content }, true);
}

export function emitAfterSwap(el: Element, target: Element): void {
  emit(el, 'pulse:afterSwap', { element: el, target });
}

export function emitAfterSettle(el: Element, target: Element): void {
  emit(el, 'pulse:afterSettle', { element: el, target });
}

export function emitAfterRequest(el: Element, response: Response, successful: boolean): void {
  emit(el, 'pulse:afterRequest', { element: el, response, successful });
}

export function emitError(el: Element, error: Error): void {
  emit(el, 'pulse:error', { element: el, error });
}
