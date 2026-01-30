import type { InheritedValues } from '../types';
import { ATTRS } from '../constants';
import { parseRequest } from '../parsers/request';
import { requestCache } from '../parsers/cache';

export function resolveInheritance(el: Element): InheritedValues {
  const result: InheritedValues = { headers: {}, boost: null };
  const ancestors: Element[] = [];

  // Walk up and collect ancestors (closest first)
  let current = el.parentElement;
  while (current) {
    // Stop if inheritance is disabled
    const inheritAttr = current.getAttribute(ATTRS.INHERIT);
    if (inheritAttr === 'false') break;

    ancestors.push(current);
    current = current.parentElement;
  }

  // Process from farthest ancestor to closest (so closer values override)
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const ancestor = ancestors[i];
    const inheritAttr = ancestor.getAttribute(ATTRS.INHERIT);
    const allowedAttrs = inheritAttr ? inheritAttr.split(',').map(a => a.trim()) : null;

    // Inherit headers from p-request
    if (!allowedAttrs || allowedAttrs.includes(ATTRS.REQUEST)) {
      const requestStr = ancestor.getAttribute(ATTRS.REQUEST);
      if (requestStr) {
        let parsed = requestCache.get(requestStr, ancestor);
        if (!parsed) {
          try {
            parsed = parseRequest(requestStr);
            requestCache.set(requestStr, parsed, ancestor);
          } catch {
            // Ignore parse errors in ancestors
          }
        }
        if (parsed && Object.keys(parsed.headers).length > 0) {
          Object.assign(result.headers, parsed.headers);
        }
      }
    }

    // Inherit p-boost
    if (!allowedAttrs || allowedAttrs.includes(ATTRS.BOOST)) {
      const boostAttr = ancestor.getAttribute(ATTRS.BOOST);
      if (boostAttr !== null) {
        result.boost = boostAttr !== 'false';
      }
    }
  }

  return result;
}
