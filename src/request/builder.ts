import type { RequestContext, PulseConfig } from '../types';
import { HEADERS } from '../constants';
import { buildBody } from './body-builder';
import { hasModifier } from '../parsers/modifier';

export function buildFetchRequest(ctx: RequestContext, config: PulseConfig): Request {
  const { parsed, inherited, element } = ctx;

  // 1. Build headers
  const headers = new Headers();
  headers.set(HEADERS.REQUEST, 'true');
  headers.set(HEADERS.CURRENT_URL, window.location.href);

  // Target element ID
  const targetSelector = parsed.target.selector;
  if (targetSelector !== 'this') {
    const targetEl = document.querySelector(targetSelector);
    if (targetEl?.id) headers.set(HEADERS.TARGET, targetEl.id);
  } else if (element.id) {
    headers.set(HEADERS.TARGET, element.id);
  }

  // Trigger element ID/name
  if (element.id) headers.set(HEADERS.TRIGGER, element.id);
  const name = element.getAttribute('name');
  if (name) headers.set(HEADERS.TRIGGER_NAME, name);

  // Boosted flag
  if (ctx.isBoosted) headers.set(HEADERS.BOOSTED, 'true');

  // Prompt value
  if (ctx.promptValue) headers.set(HEADERS.PROMPT, ctx.promptValue);

  // Inherited headers
  for (const [key, value] of Object.entries(inherited.headers)) {
    headers.set(key, value);
  }

  // Explicit headers from p-request
  for (const [key, value] of Object.entries(parsed.headers)) {
    headers.set(key, value);
  }

  // 2. Build body
  const bodyData = buildBody(parsed.body, element);
  const isMultipart = hasModifier(parsed.modifiers, 'multipart');
  const method = parsed.method;

  // 3. Resolve URL
  let url = parsed.url;
  if (!url.startsWith('http')) {
    url = new URL(url, window.location.origin).href;
  }

  // 4. For GET/DELETE — append params to URL
  let fetchBody: BodyInit | null = null;

  if (method === 'GET' || method === 'DELETE') {
    if (bodyData && !(bodyData instanceof FormData)) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(bodyData)) {
        params.set(key, String(value));
      }
      const separator = url.includes('?') ? '&' : '?';
      url += separator + params.toString();
    }
  } else {
    // POST/PUT/PATCH
    if (bodyData) {
      if (bodyData instanceof FormData || isMultipart) {
        if (bodyData instanceof FormData) {
          fetchBody = bodyData;
        } else {
          const fd = new FormData();
          for (const [key, value] of Object.entries(bodyData)) {
            fd.append(key, String(value));
          }
          fetchBody = fd;
        }
        // Don't set Content-Type for FormData (browser sets it with boundary)
      } else {
        fetchBody = JSON.stringify(bodyData);
        headers.set('Content-Type', 'application/json');
      }
    }
  }

  return new Request(url, {
    method,
    headers,
    body: fetchBody,
    signal: ctx.abortController.signal,
    credentials: config.withCredentials ? 'include' : 'same-origin',
  });
}
