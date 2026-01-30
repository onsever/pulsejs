import type { RequestContext, PulseConfig } from '../types';
import { hasModifier, getModifierValue } from '../parsers/modifier';
import { CSS } from '../constants';

export async function applyPreRequestModifiers(
  ctx: RequestContext,
  config: PulseConfig,
): Promise<boolean> {
  const { parsed, element } = ctx;
  const mods = parsed.modifiers;

  // :confirm — emit pulse:confirm, fall back to window.confirm if not prevented
  if (hasModifier(mods, 'confirm')) {
    const message = getModifierValue(mods, 'confirm') || 'Are you sure?';
    const confirmed = await handleConfirm(element, message);
    if (!confirmed) return false;
  }

  // :prompt
  if (hasModifier(mods, 'prompt')) {
    const message = getModifierValue(mods, 'prompt') || '';
    const result = window.prompt(message);
    if (result === null) return false;
    ctx.promptValue = result;
  }

  // :validate
  if (hasModifier(mods, 'validate')) {
    const form = element.closest('form') ?? element;
    if (form instanceof HTMLFormElement && !form.checkValidity()) {
      form.reportValidity();
      return false;
    }
  }

  // :disable
  if (hasModifier(mods, 'disable')) {
    const selector = getModifierValue(mods, 'disable');
    const targets = selector
      ? element.querySelectorAll(selector)
      : [element];
    for (const t of targets) {
      (t as HTMLElement).setAttribute('disabled', '');
    }
  }

  // :indicator
  if (hasModifier(mods, 'indicator')) {
    const selector = getModifierValue(mods, 'indicator');
    if (selector) {
      const indicator = document.querySelector(selector);
      if (indicator) indicator.classList.add(config.indicatorClass);
    }
    element.classList.add(config.requestClass);
  }

  return true;
}

function handleConfirm(element: Element, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    let issueRequestCalled = false;
    const event = new CustomEvent('pulse:confirm', {
      bubbles: true,
      cancelable: true,
      detail: {
        message,
        issueRequest() {
          issueRequestCalled = true;
          resolve(true);
        },
      },
    });
    element.dispatchEvent(event);
    if (event.defaultPrevented) {
      // Handler took control — if issueRequest wasn't called synchronously,
      // it may be called later (async confirm UI). We don't resolve(false) yet.
      if (!issueRequestCalled) {
        // The handler is responsible for calling issueRequest(). If they never do, the request just won't fire.
        // We use a timeout as a safety net — if after 5 minutes nothing happened, reject.
        setTimeout(() => {
          if (!issueRequestCalled) resolve(false);
        }, 300000);
      }
    } else {
      // No handler prevented — fall back to window.confirm
      resolve(window.confirm(message));
    }
  });
}

export function cleanupPostRequest(ctx: RequestContext, config: PulseConfig): void {
  const { parsed, element } = ctx;
  const mods = parsed.modifiers;

  // Restore disabled elements
  if (hasModifier(mods, 'disable')) {
    const selector = getModifierValue(mods, 'disable');
    const targets = selector
      ? element.querySelectorAll(selector)
      : [element];
    for (const t of targets) {
      (t as HTMLElement).removeAttribute('disabled');
    }
  }

  // Remove indicator
  if (hasModifier(mods, 'indicator')) {
    const selector = getModifierValue(mods, 'indicator');
    if (selector) {
      const indicator = document.querySelector(selector);
      if (indicator) indicator.classList.remove(config.indicatorClass);
    }
    element.classList.remove(config.requestClass);
  }
}
