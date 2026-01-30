import type { RequestContext, QueuedRequest } from '../types';
import { getState } from '../engine/state';
import { getModifierValue } from '../parsers/modifier';

export type SyncAction = 'proceed' | 'drop' | 'queue';

export function getSyncMode(ctx: RequestContext): string {
  return getModifierValue(ctx.parsed.modifiers, 'sync') ?? 'abort';
}

export function checkSync(el: Element, mode: string): SyncAction {
  const state = getState(el);
  if (!state) return 'proceed';

  const hasActive = state.abortController !== null;

  switch (mode) {
    case 'abort':
      // Abort previous, proceed with new
      if (hasActive) {
        state.abortController!.abort();
        state.abortController = null;
      }
      return 'proceed';

    case 'drop':
      return hasActive ? 'drop' : 'proceed';

    case 'queue':
    case 'queue:all':
    case 'queue:first':
    case 'queue:last':
      return hasActive ? 'queue' : 'proceed';

    default:
      return 'proceed';
  }
}

export function enqueue(el: Element, ctx: RequestContext, mode: string): Promise<void> {
  const state = getState(el);
  if (!state) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const entry: QueuedRequest = { context: ctx, resolve };

    if (mode === 'queue:first' && state.requestQueue.length > 0) {
      resolve(); // Drop this one, keep existing first
      return;
    }

    if (mode === 'queue:last') {
      // Replace all queued with this one
      for (const queued of state.requestQueue) {
        queued.resolve();
      }
      state.requestQueue = [entry];
      return;
    }

    state.requestQueue.push(entry);
  });
}

export function processQueue(el: Element): void {
  const state = getState(el);
  if (!state || state.requestQueue.length === 0) return;

  const next = state.requestQueue.shift()!;
  next.resolve();
}
