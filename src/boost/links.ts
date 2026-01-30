import { ATTRS } from '../constants';
import { dispatchRequest } from '../request/dispatch';
import { ensureState } from '../engine/state';
import { parseRequest } from '../parsers/request';
import { parseTrigger } from '../parsers/trigger';
import { resolveInheritance } from '../engine/inherit';

export function handleBoostedLink(event: MouseEvent): void {
  const link = (event.target as Element)?.closest?.('a[href]') as HTMLAnchorElement | null;
  if (!link) return;

  // Skip conditions
  if (link.getAttribute('target') === '_blank') return;
  if (link.hasAttribute('download')) return;
  if (link.getAttribute(ATTRS.BOOST) === 'false') return;

  // Check same origin
  try {
    const url = new URL(link.href, location.origin);
    if (url.origin !== location.origin) return;
  } catch {
    return;
  }

  // Check if boosted (self or ancestor)
  if (!link.hasAttribute(ATTRS.BOOST) && !link.closest(`[${ATTRS.BOOST}]`)) return;

  // Check for double-negative
  const boostAncestor = link.closest(`[${ATTRS.BOOST}]`);
  if (boostAncestor?.getAttribute(ATTRS.BOOST) === 'false') return;

  event.preventDefault();

  // If the link has its own p-request, use that
  if (link.hasAttribute(ATTRS.REQUEST)) {
    dispatchRequest(link, event);
    return;
  }

  // Build a synthetic request for the link
  const href = link.getAttribute('href') || '/';
  const state = ensureState(link);

  state.parsedRequest = parseRequest(`GET ${href} > body`);
  state.parsedRequest.headers = {};
  state.parsedTrigger = parseTrigger('click');
  state.inherited = resolveInheritance(link);

  // Add p-history push
  const historyAttr = link.getAttribute(ATTRS.HISTORY);
  if (!historyAttr) {
    // Default: push for boosted links
    import('../history/manager').then(({ pushHistory, cacheCurrentPage }) => {
      cacheCurrentPage();
      history.pushState({ pulse: true }, '', href);
    });
  }

  dispatchRequest(link, event);
}
