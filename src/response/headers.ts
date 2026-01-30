import type { RequestContext, ResponseOverrides, SwapBehavior } from '../types';
import { RESPONSE_HEADERS, BEHAVIORS } from '../constants';

export interface HeaderResult {
  stop: boolean;
  overrides: ResponseOverrides;
  triggerAfterSwap: string | null;
  triggerAfterSettle: string | null;
  location?: string;
}

export function processResponseHeaders(response: Response, _ctx: RequestContext): HeaderResult {
  const result: HeaderResult = {
    stop: false,
    overrides: {},
    triggerAfterSwap: null,
    triggerAfterSettle: null,
  };

  // P-Location — client-side navigation via ajax
  const location = response.headers.get(RESPONSE_HEADERS.LOCATION);
  if (location) {
    result.stop = true;
    result.location = location;
    return result;
  }

  // P-Redirect — redirect and stop processing
  const redirect = response.headers.get(RESPONSE_HEADERS.REDIRECT);
  if (redirect) {
    window.location.assign(redirect);
    result.stop = true;
    return result;
  }

  // P-Refresh — reload and stop
  const refresh = response.headers.get(RESPONSE_HEADERS.REFRESH);
  if (refresh === 'true') {
    window.location.reload();
    result.stop = true;
    return result;
  }

  // P-Retarget
  const retarget = response.headers.get(RESPONSE_HEADERS.RETARGET);
  if (retarget) result.overrides.target = retarget;

  // P-Reswap
  const reswap = response.headers.get(RESPONSE_HEADERS.RESWAP);
  if (reswap && BEHAVIORS.includes(reswap as SwapBehavior)) {
    result.overrides.behavior = reswap as SwapBehavior;
  }

  // P-Reselect
  const reselect = response.headers.get(RESPONSE_HEADERS.RESELECT);
  if (reselect) result.overrides.select = reselect;

  // P-Push
  const push = response.headers.get(RESPONSE_HEADERS.PUSH);
  if (push) result.overrides.pushUrl = push;

  // P-Replace
  const replace = response.headers.get(RESPONSE_HEADERS.REPLACE);
  if (replace) result.overrides.replaceUrl = replace;

  // P-Trigger (immediate)
  const trigger = response.headers.get(RESPONSE_HEADERS.TRIGGER);
  if (trigger) {
    dispatchServerTriggers(trigger);
  }

  // P-Trigger-After-Swap / P-Trigger-After-Settle
  result.triggerAfterSwap = response.headers.get(RESPONSE_HEADERS.TRIGGER_AFTER_SWAP);
  result.triggerAfterSettle = response.headers.get(RESPONSE_HEADERS.TRIGGER_AFTER_SETTLE);

  return result;
}

function dispatchServerTriggers(headerValue: string): void {
  // Lazy import to avoid circular dependency
  import('../events/server-events').then(({ processServerTriggers }) => {
    processServerTriggers(headerValue, document);
  });
}
