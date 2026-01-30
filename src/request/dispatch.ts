import type { RequestContext } from '../types';
import { getConfig } from '../engine/config';
import { getState, ensureState } from '../engine/state';
import { buildFetchRequest } from './builder';
import { executeRequest } from './executor';
import { applyPreRequestModifiers, cleanupPostRequest } from './modifiers';
import { getSyncMode, checkSync, enqueue, processQueue } from './sync';
import { processResponse } from '../response/processor';
import { emitBefore, emitBeforeSend, emitAfterRequest, emitError } from '../events/lifecycle';

export async function dispatchRequest(el: Element, event?: Event): Promise<void> {
  const state = getState(el);
  if (!state?.parsedRequest) return;

  const config = getConfig();

  const ctx: RequestContext = {
    element: el,
    parsed: state.parsedRequest,
    trigger: state.parsedTrigger?.events[0] ?? null,
    inherited: state.inherited,
    abortController: new AbortController(),
  };

  // Pre-request modifiers (confirm, prompt, validate, disable, indicator)
  const proceed = await applyPreRequestModifiers(ctx, config);
  if (!proceed) return;

  // Emit pulse:before (cancelable)
  if (!emitBefore(el, ctx)) {
    cleanupPostRequest(ctx, config);
    return;
  }

  // Sync mode check
  const syncMode = getSyncMode(ctx);
  const action = checkSync(el, syncMode);

  if (action === 'drop') {
    cleanupPostRequest(ctx, config);
    return;
  }

  if (action === 'queue') {
    await enqueue(el, ctx, syncMode);
  }

  // Store abort controller in state
  const elState = ensureState(el);
  elState.abortController = ctx.abortController;

  try {
    // Build and send request
    const request = buildFetchRequest(ctx, config);

    if (!emitBeforeSend(el, ctx)) {
      cleanupPostRequest(ctx, config);
      return;
    }

    const response = await executeRequest(request, ctx, config);

    // Process response
    await processResponse(response, ctx, config);

    emitAfterRequest(el, response, response.ok);
  } catch (error) {
    if ((error as DOMException)?.name === 'AbortError') {
      // Aborted — don't treat as error
    } else {
      emitError(el, error instanceof Error ? error : new Error(String(error)));
    }
  } finally {
    elState.abortController = null;
    cleanupPostRequest(ctx, config);
    processQueue(el);
  }
}
