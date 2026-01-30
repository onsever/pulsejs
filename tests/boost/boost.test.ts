import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/request/dispatch', () => ({
  dispatchRequest: vi.fn(),
}));

vi.mock('../../src/engine/state', () => ({
  ensureState: vi.fn(() => ({
    triggers: [],
    parsedRequest: null,
    parsedTrigger: null,
    inherited: { headers: {}, boost: null },
    abortController: null,
    lastValue: undefined,
    requestQueue: [],
    onCleanup: null,
  })),
}));

vi.mock('../../src/parsers/request', () => ({
  parseRequest: vi.fn(() => ({
    method: 'GET',
    url: '/',
    headers: {},
    body: null,
    target: { selector: 'body', behavior: 'replace' },
    modifiers: [],
  })),
}));

vi.mock('../../src/parsers/trigger', () => ({
  parseTrigger: vi.fn(() => ({ events: [{ name: 'click' }] })),
}));

vi.mock('../../src/engine/inherit', () => ({
  resolveInheritance: vi.fn(() => ({ headers: {}, boost: null })),
}));

import { setupBoost } from '../../src/boost/setup';
import { handleBoostedLink } from '../../src/boost/links';
import { handleBoostedForm } from '../../src/boost/forms';
import { dispatchRequest } from '../../src/request/dispatch';

describe('setupBoost', () => {
  it('adds click and submit listeners to document', () => {
    const addSpy = vi.spyOn(document, 'addEventListener');
    const cleanup = setupBoost();

    expect(addSpy).toHaveBeenCalledWith('click', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('submit', expect.any(Function));

    cleanup();
    addSpy.mockRestore();
  });

  it('cleanup removes listeners', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const cleanup = setupBoost();
    cleanup();

    expect(removeSpy).toHaveBeenCalledWith('click', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('submit', expect.any(Function));
    removeSpy.mockRestore();
  });
});

describe('handleBoostedLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  function clickEvent(target: Element): MouseEvent {
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: target });
    return event;
  }

  it('returns early if target is not inside an anchor', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    handleBoostedLink(clickEvent(div));
    expect(dispatchRequest).not.toHaveBeenCalled();
  });

  it('skips links with target="_blank"', () => {
    document.body.innerHTML = '<div p-boost><a id="link" href="/page" target="_blank">Link</a></div>';
    const link = document.getElementById('link')!;

    handleBoostedLink(clickEvent(link));
    expect(dispatchRequest).not.toHaveBeenCalled();
  });

  it('skips links with download attribute', () => {
    document.body.innerHTML = '<div p-boost><a id="link" href="/file" download>Download</a></div>';
    const link = document.getElementById('link')!;

    handleBoostedLink(clickEvent(link));
    expect(dispatchRequest).not.toHaveBeenCalled();
  });

  it('skips links with p-boost="false"', () => {
    document.body.innerHTML = '<div p-boost><a id="link" href="/page" p-boost="false">Link</a></div>';
    const link = document.getElementById('link')!;

    handleBoostedLink(clickEvent(link));
    expect(dispatchRequest).not.toHaveBeenCalled();
  });

  it('skips links without p-boost on self or ancestor', () => {
    document.body.innerHTML = '<a id="link" href="/page">Link</a>';
    const link = document.getElementById('link')!;

    handleBoostedLink(clickEvent(link));
    expect(dispatchRequest).not.toHaveBeenCalled();
  });

  it('dispatches request for valid boosted link', () => {
    document.body.innerHTML = '<div p-boost><a id="link" href="/page">Link</a></div>';
    const link = document.getElementById('link')!;

    const event = clickEvent(link);
    const preventSpy = vi.spyOn(event, 'preventDefault');

    handleBoostedLink(event);

    expect(preventSpy).toHaveBeenCalled();
    expect(dispatchRequest).toHaveBeenCalledWith(link, event);
  });

  it('uses existing p-request if present on link', () => {
    document.body.innerHTML = '<div p-boost><a id="link" href="/page" p-request="GET /custom">Link</a></div>';
    const link = document.getElementById('link')!;

    handleBoostedLink(clickEvent(link));

    expect(dispatchRequest).toHaveBeenCalledWith(link, expect.any(MouseEvent));
  });
});

describe('handleBoostedForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  function submitEvent(target: Element): SubmitEvent {
    const event = new Event('submit', { bubbles: true }) as SubmitEvent;
    Object.defineProperty(event, 'target', { value: target });
    return event;
  }

  it('returns early if target is not a form', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    handleBoostedForm(submitEvent(div));
    expect(dispatchRequest).not.toHaveBeenCalled();
  });

  it('skips forms with p-boost="false"', () => {
    document.body.innerHTML = '<form id="f" p-boost="false" action="/submit"></form>';
    const form = document.getElementById('f')!;

    handleBoostedForm(submitEvent(form));
    expect(dispatchRequest).not.toHaveBeenCalled();
  });

  it('skips forms without p-boost on self or ancestor', () => {
    document.body.innerHTML = '<form id="f" action="/submit"></form>';
    const form = document.getElementById('f')!;

    handleBoostedForm(submitEvent(form));
    expect(dispatchRequest).not.toHaveBeenCalled();
  });

  it('dispatches request for valid boosted form', () => {
    document.body.innerHTML = '<div p-boost><form id="f" action="/submit" method="POST"></form></div>';
    const form = document.getElementById('f')!;

    const event = submitEvent(form);
    const preventSpy = vi.spyOn(event, 'preventDefault');

    handleBoostedForm(event);

    expect(preventSpy).toHaveBeenCalled();
    expect(dispatchRequest).toHaveBeenCalledWith(form, event);
  });

  it('uses existing p-request if present on form', () => {
    document.body.innerHTML = '<div p-boost><form id="f" p-request="POST /custom {this}">ok</form></div>';
    const form = document.getElementById('f')!;

    handleBoostedForm(submitEvent(form));

    expect(dispatchRequest).toHaveBeenCalledWith(form, expect.any(Event));
  });
});
