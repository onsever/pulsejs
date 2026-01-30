import type { RequestContext, PulseConfig } from '../types';
import { getModifierValue } from '../parsers/modifier';

export async function executeRequest(
  request: Request,
  ctx: RequestContext,
  config: PulseConfig,
): Promise<Response> {
  // Determine timeout
  const timeoutModifier = getModifierValue(ctx.parsed.modifiers, 'timeout');
  const timeout = timeoutModifier ? parseInt(timeoutModifier, 10) : config.timeout;

  let timer: ReturnType<typeof setTimeout> | null = null;

  if (timeout > 0) {
    timer = setTimeout(() => {
      ctx.abortController.abort('timeout');
    }, timeout);
  }

  try {
    const response = await fetch(request);
    return response;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
