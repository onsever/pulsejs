import type { ParsedBody } from '../types';

export function buildBody(
  parsedBody: ParsedBody | null,
  element: Element,
): Record<string, unknown> | FormData | null {
  if (!parsedBody) return null;

  switch (parsedBody.type) {
    case 'json':
      return parsedBody.data ?? {};

    case 'selectors':
      return collectFromSelectors(parsedBody.selectors ?? [], element);

    case 'filter':
      return applyFilter(parsedBody.filter!, element);

    default:
      return null;
  }
}

function collectFromSelectors(selectors: string[], contextElement: Element): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const sel of selectors) {
    let target: Element | null = null;

    if (sel === 'this') {
      target = contextElement;
    } else if (sel.startsWith('closest ')) {
      target = contextElement.closest(sel.slice(8));
    } else if (sel.startsWith('find ')) {
      target = contextElement.querySelector(sel.slice(5));
    } else {
      target = document.querySelector(sel);
    }

    if (!target) continue;
    collectInputValues(target, result);
  }

  return result;
}

function applyFilter(
  filter: { mode: 'only' | 'not'; fields: string[] },
  element: Element,
): Record<string, unknown> {
  const all: Record<string, unknown> = {};
  const form = element.closest('form') ?? element;
  collectInputValues(form, all);

  if (filter.mode === 'only') {
    const filtered: Record<string, unknown> = {};
    for (const field of filter.fields) {
      if (field in all) filtered[field] = all[field];
    }
    return filtered;
  }

  // 'not' mode
  for (const field of filter.fields) {
    delete all[field];
  }
  return all;
}

function collectInputValues(root: Element, result: Record<string, unknown>): void {
  // If root is a form, use FormData
  if (root instanceof HTMLFormElement) {
    const formData = new FormData(root);
    for (const [key, value] of formData.entries()) {
      if (result[key] !== undefined) {
        // Multiple values — convert to array
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
    return;
  }

  // Otherwise collect from input/select/textarea descendants
  const inputs = root.querySelectorAll('input, select, textarea');
  for (const input of inputs) {
    const el = input as HTMLInputElement;
    const name = el.name || el.id;
    if (!name) continue;

    if (el.type === 'checkbox') {
      result[name] = el.checked;
    } else if (el.type === 'radio') {
      if (el.checked) result[name] = el.value;
    } else if (el.type === 'file') {
      result[name] = el.files;
    } else {
      result[name] = el.value;
    }
  }

  // Also check if root itself is an input
  if (root instanceof HTMLInputElement || root instanceof HTMLTextAreaElement || root instanceof HTMLSelectElement) {
    const name = root.name || root.id;
    if (name) result[name] = root.value;
  }
}
