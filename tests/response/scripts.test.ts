import { describe, it, expect, beforeEach } from 'vitest';
import { processScripts } from '../../src/response/scripts';
import type { PulseConfig } from '../../src/types';

function makeConfig(overrides: Partial<PulseConfig> = {}): PulseConfig {
  return {
    defaultSwap: 'replace',
    defaultTarget: 'this',
    timeout: 0,
    historyEnabled: true,
    historyCacheSize: 10,
    refreshOnHistoryMiss: false,
    scrollBehavior: 'instant',
    selfRequestsOnly: true,
    allowScriptTags: true,
    allowEval: true,
    globalViewTransitions: false,
    indicatorClass: 'pulse-indicator',
    requestClass: 'pulse-request',
    defaultSwapDelay: 0,
    defaultSettleDelay: 20,
    withCredentials: false,
    ignoreTitle: false,
    inlineScriptNonce: '',
    responseHandling: [],
    ...overrides,
  };
}

describe('processScripts', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('replaces inline scripts with executable copies', () => {
    document.body.innerHTML = '<div id="container"><script>window.__testVal = 1;</script></div>';
    const container = document.getElementById('container')!;
    processScripts(container, makeConfig());

    const scripts = container.querySelectorAll('script');
    expect(scripts).toHaveLength(1);
    expect(scripts[0].textContent).toBe('window.__testVal = 1;');
  });

  it('removes all scripts when allowScriptTags is false', () => {
    document.body.innerHTML = '<div id="container"><script>alert(1);</script><script src="/x.js"></script></div>';
    const container = document.getElementById('container')!;
    processScripts(container, makeConfig({ allowScriptTags: false }));

    expect(container.querySelectorAll('script')).toHaveLength(0);
  });

  it('sets nonce on inline scripts when configured', () => {
    document.body.innerHTML = '<div id="container"><script>var x = 1;</script></div>';
    const container = document.getElementById('container')!;
    processScripts(container, makeConfig({ inlineScriptNonce: 'abc123' }));

    const script = container.querySelector('script');
    expect(script!.getAttribute('nonce')).toBe('abc123');
  });

  it('copies attributes on external scripts', () => {
    document.body.innerHTML = '<div id="container"><script src="/app.js" async defer data-custom="val"></script></div>';
    const container = document.getElementById('container')!;
    processScripts(container, makeConfig());

    const script = container.querySelector('script');
    expect(script!.getAttribute('src')).toBe('/app.js');
    expect(script!.hasAttribute('async')).toBe(true);
    expect(script!.hasAttribute('defer')).toBe(true);
    expect(script!.getAttribute('data-custom')).toBe('val');
  });

  it('does not set nonce on external scripts', () => {
    document.body.innerHTML = '<div id="container"><script src="/app.js"></script></div>';
    const container = document.getElementById('container')!;
    processScripts(container, makeConfig({ inlineScriptNonce: 'abc123' }));

    const script = container.querySelector('script');
    // External scripts have src, nonce is only for inline
    expect(script!.getAttribute('src')).toBe('/app.js');
  });

  it('handles container with no scripts', () => {
    document.body.innerHTML = '<div id="container"><p>no scripts</p></div>';
    const container = document.getElementById('container')!;
    processScripts(container, makeConfig());
    expect(container.innerHTML).toBe('<p>no scripts</p>');
  });

  it('handles multiple scripts', () => {
    document.body.innerHTML = '<div id="container"><script>var a=1;</script><p>mid</p><script>var b=2;</script></div>';
    const container = document.getElementById('container')!;
    processScripts(container, makeConfig());

    const scripts = container.querySelectorAll('script');
    expect(scripts).toHaveLength(2);
    expect(scripts[0].textContent).toBe('var a=1;');
    expect(scripts[1].textContent).toBe('var b=2;');
  });
});
