import type { RequestContext, PulseConfig, SwapBehavior, ResponseHandlingConfig } from '../types';
import { CSS } from '../constants';
import { hasModifier, getModifierValue } from '../parsers/modifier';
import { processResponseHeaders } from './headers';
import { parseHTML, parseHTMLDocument } from './parser';
import { applySelect } from './select';
import { extractOOB, processOOBSwaps } from './oob';
import { performSwap } from './swap';
import { withTransition } from './transitions';
import { savePreserved, restorePreserved } from './preserve';
import { settle } from './settle';
import { mergeHead } from './head';
import { processScripts } from './scripts';
import { emitBeforeSwap, emitAfterSwap, emitAfterSettle, emitError } from '../events/lifecycle';
import { processServerTriggers } from '../events/server-events';
import { callTransformResponse, callHandleSwap } from '../extensions/index';

function matchResponseCode(status: number, pattern: string): boolean {
  if (pattern === '*') return true;
  if (pattern === String(status)) return true;
  if (pattern.endsWith('xx')) {
    const prefix = pattern[0];
    return String(status)[0] === prefix;
  }
  return false;
}

function getResponseHandling(status: number, config: PulseConfig): ResponseHandlingConfig | null {
  if (!config.responseHandling) return null;
  for (const rule of config.responseHandling) {
    if (matchResponseCode(status, rule.code)) return rule;
  }
  return null;
}

export async function processResponse(
  response: Response,
  ctx: RequestContext,
  config: PulseConfig,
): Promise<void> {
  // 1. Process response headers
  const headerResult = processResponseHeaders(response, ctx);

  // Handle P-Location — client-side ajax navigation
  if (headerResult.location) {
    let path: string;
    let target = 'body';
    let swap: SwapBehavior = 'replace';
    let extraHeaders: Record<string, string> = {};

    try {
      const parsed = JSON.parse(headerResult.location);
      path = parsed.path;
      if (parsed.target) target = parsed.target;
      if (parsed.swap) swap = parsed.swap;
      if (parsed.headers) extraHeaders = parsed.headers;
    } catch {
      path = headerResult.location;
    }

    // Perform ajax navigation using internal mechanisms
    const { ajaxInternal } = await import('../api');
    await ajaxInternal('GET', path, target, { swap, headers: extraHeaders });
    return;
  }

  if (headerResult.stop) return;

  // 2. Check response handling rules
  const handling = getResponseHandling(response.status, config);
  if (handling) {
    if (handling.error) {
      emitError(ctx.element, new Error(`HTTP ${response.status}`));
    }
    if (!handling.swap) return;
    // Apply handling overrides
    if (handling.target) headerResult.overrides.target = handling.target;
    if (handling.select) headerResult.overrides.select = handling.select;
  }

  // 3. Get response text
  let text = await response.text();
  const behavior: SwapBehavior = headerResult.overrides.behavior || ctx.parsed.target.behavior;
  if (!text.trim() && behavior !== 'remove' && behavior !== 'none') return;

  // 3b. Extension transform
  text = callTransformResponse(text, response, ctx);

  // 4. Check for full document — merge head if present
  const isFullDocument = /<html[\s>]/i.test(text) || /<head[\s>]/i.test(text);
  if (isFullDocument) {
    const fullDoc = parseHTMLDocument(text);
    const titleIgnore = (handling?.ignoreTitle ?? false) || config.ignoreTitle;
    mergeHead(fullDoc, { ...config, ignoreTitle: titleIgnore });
    // Extract body content for swapping
    const bodyHTML = fullDoc.body ? fullDoc.body.innerHTML : text;
    text = bodyHTML;
  }

  // 5. Parse HTML
  let content = parseHTML(text);

  // 6. Apply :select
  const selectModifier = getModifierValue(ctx.parsed.modifiers, 'select');
  const selectOverride = headerResult.overrides.select;
  const selectSelector = selectOverride || selectModifier;
  if (selectSelector) {
    content = applySelect(content, selectSelector);
  }

  // 7. Extract OOB elements
  const oobEntries = extractOOB(content);

  // 8. Resolve target
  const targetSelector = headerResult.overrides.target || ctx.parsed.target.selector;
  let target: Element;
  if (targetSelector === 'this') {
    target = ctx.element;
  } else if (targetSelector.startsWith('closest ')) {
    target = ctx.element.closest(targetSelector.slice(8)) ?? ctx.element;
  } else if (targetSelector.startsWith('find ')) {
    target = ctx.element.querySelector(targetSelector.slice(5)) ?? ctx.element;
  } else {
    target = document.querySelector(targetSelector) ?? ctx.element;
  }

  // 9. Save preserved elements
  const preserveIds: string[] = [];
  if (hasModifier(ctx.parsed.modifiers, 'preserve')) {
    target.querySelectorAll('[id]').forEach(el => preserveIds.push(el.id));
  }
  const preserved = preserveIds.length > 0 ? savePreserved(target, preserveIds) : null;

  // 10. Emit pulse:beforeSwap (cancelable)
  if (!emitBeforeSwap(ctx.element, target, content)) return;

  // 11. Determine if view transitions should be used
  const useTransition = hasModifier(ctx.parsed.modifiers, 'transition') || config.globalViewTransitions;

  // 12. Apply swap delay
  const swapDelay = parseInt(getModifierValue(ctx.parsed.modifiers, 'swap') ?? '', 10) || config.defaultSwapDelay;
  if (swapDelay > 0) {
    await new Promise(r => setTimeout(r, swapDelay));
  }

  // 13. Perform swap (optionally with view transition)
  target.classList.add(CSS.SWAPPING);

  // Check if extension handles the swap
  const extHandled = callHandleSwap(behavior, target, content);

  if (!extHandled) {
    await withTransition(() => {
      performSwap(target, content, behavior);
    }, useTransition);
  }

  target.classList.remove(CSS.SWAPPING);

  // 14. Restore preserved elements
  if (preserved) {
    restorePreserved(target, preserved);
  }

  // 15. Process OOB swaps
  processOOBSwaps(oobEntries);

  // 16. Process scripts in swapped content
  processScripts(target, config);

  // 17. Settle
  const newElements = Array.from(target.querySelectorAll('*')) as Element[];
  await settle(target, newElements, config);

  // 18. Process server trigger-after-swap
  if (headerResult.triggerAfterSwap) {
    processServerTriggers(headerResult.triggerAfterSwap, target);
  }

  // 19. Handle history
  if (headerResult.overrides.pushUrl) {
    const { pushHistory } = await import('../history/manager');
    pushHistory(headerResult.overrides.pushUrl, config);
  } else if (headerResult.overrides.replaceUrl) {
    const { replaceHistory } = await import('../history/manager');
    replaceHistory(headerResult.overrides.replaceUrl, config);
  }

  // 20. Handle scroll
  const scrollModifier = getModifierValue(ctx.parsed.modifiers, 'scroll');
  if (scrollModifier) {
    handleScroll(scrollModifier, target, config);
  }

  // 21. Process new DOM content for Pulse attributes (lazy to avoid circular dep)
  const { processTree } = await import('../engine/process');
  processTree(target);

  // 22. Emit events
  emitAfterSwap(ctx.element, target);

  // Process server trigger-after-settle
  if (headerResult.triggerAfterSettle) {
    processServerTriggers(headerResult.triggerAfterSettle, target);
  }

  emitAfterSettle(ctx.element, target);
}

function handleScroll(value: string, target: Element, config: PulseConfig): void {
  if (value === 'top') {
    window.scrollTo({ top: 0, behavior: config.scrollBehavior });
  } else if (value === 'bottom') {
    window.scrollTo({ top: document.body.scrollHeight, behavior: config.scrollBehavior });
  } else {
    const el = document.querySelector(value);
    if (el) el.scrollIntoView({ behavior: config.scrollBehavior });
  }
}
