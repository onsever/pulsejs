import type { PulseExtension, PulseInternalAPI } from '../types';

const extensions = new Map<string, PulseExtension>();

export function defineExtension(name: string, ext: PulseExtension, api: PulseInternalAPI): void {
  if (extensions.has(name)) {
    console.warn(`Pulse: Extension "${name}" already defined, replacing.`);
  }
  extensions.set(name, ext);
  ext.init?.(api);
}

export function removeExtension(name: string): void {
  extensions.delete(name);
}

export function getExtensions(): PulseExtension[] {
  return Array.from(extensions.values());
}

export function callExtensionEvent(name: string, event: CustomEvent): boolean {
  for (const ext of extensions.values()) {
    if (ext.onEvent?.(name, event) === false) return false;
  }
  return true;
}

export function callTransformResponse(text: string, response: Response, ctx: any): string {
  let result = text;
  for (const ext of extensions.values()) {
    if (ext.transformResponse) {
      result = ext.transformResponse(result, response, ctx);
    }
  }
  return result;
}

export function callHandleSwap(behavior: any, target: Element, fragment: DocumentFragment): boolean {
  for (const ext of extensions.values()) {
    if (ext.handleSwap?.(behavior, target, fragment)) return true;
  }
  return false;
}
