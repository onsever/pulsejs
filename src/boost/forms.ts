import { ATTRS } from '../constants';
import { dispatchRequest } from '../request/dispatch';
import { ensureState } from '../engine/state';
import { parseRequest } from '../parsers/request';
import { parseTrigger } from '../parsers/trigger';
import { resolveInheritance } from '../engine/inherit';

export function handleBoostedForm(event: SubmitEvent): void {
  const form = (event.target as Element)?.closest?.('form') as HTMLFormElement | null;
  if (!form) return;

  // Check boost
  if (form.getAttribute(ATTRS.BOOST) === 'false') return;
  if (!form.hasAttribute(ATTRS.BOOST) && !form.closest(`[${ATTRS.BOOST}]`)) return;

  // Check same origin
  const action = form.action || location.href;
  try {
    const url = new URL(action, location.origin);
    if (url.origin !== location.origin) return;
  } catch {
    return;
  }

  event.preventDefault();

  // If the form has its own p-request, use that
  if (form.hasAttribute(ATTRS.REQUEST)) {
    dispatchRequest(form, event);
    return;
  }

  // Build synthetic request
  const method = (form.method || 'GET').toUpperCase();
  const formAction = form.getAttribute('action') || location.pathname;

  const state = ensureState(form);
  state.parsedRequest = parseRequest(`${method} ${formAction} {this} > body`);
  state.parsedTrigger = parseTrigger('submit');
  state.inherited = resolveInheritance(form);

  dispatchRequest(form, event);
}
