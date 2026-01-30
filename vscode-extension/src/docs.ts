export const ATTR_DOCS: Record<string, string> = {
  'p-request': [
    '**p-request** — HTTP request + response handling',
    '',
    '```',
    'p-request="{headers} METHOD /url {body} > target.behavior :modifiers"',
    '```',
    '',
    '- `{headers}` — `{\'X-CSRF\': \'token\'}` (before URL)',
    '- `METHOD` — GET (default), POST, PUT, PATCH, DELETE',
    '- `/url` — Required path',
    '- `{body}` — After URL: `{\'key\':\'val\'}`, `{#form}`, `{this}`, `{only name}`, `{not password}`',
    '- `> target` — CSS selector, `this`, `closest X`, `find X`',
    '- `.behavior` — replace, outer, append, prepend, before, after, remove, none',
    '- `:modifiers` — confirm, prompt, validate, disable, indicator, etc.',
  ].join('\n'),

  'p-trigger': [
    '**p-trigger** — When the request fires',
    '',
    '```',
    'p-trigger="event modifiers, event modifiers"',
    '```',
    '',
    'Defaults: button→click, form→submit, input→input, select→change',
    '',
    'Modifiers: once, changed, consume, debounce Xms, throttle Xms, delay Xms, from selector',
    '',
    'Special: `every 2s` (polling), `load` (immediate), `revealed` (viewport)',
  ].join('\n'),

  'p-on': [
    '**p-on** — Lifecycle event hooks',
    '',
    '```',
    'p-on="event: handler() | event: handler()"',
    '```',
    '',
    'Events: pulse:before, pulse:beforeSend, pulse:beforeSwap, pulse:afterSwap, pulse:afterSettle, pulse:error, pulse:confirm',
  ].join('\n'),

  'p-history': [
    '**p-history** — URL/history management',
    '',
    'Values: `push`, `replace`, `false`',
  ].join('\n'),

  'p-boost': [
    '**p-boost** — Progressive enhancement for links/forms',
    '',
    'Values: `true`, `false`',
    '',
    'When enabled, intercepts clicks on `<a>` and submits on `<form>` to use Pulse requests.',
  ].join('\n'),

  'p-oob': [
    '**p-oob** — Out-of-band swap marker (server-side)',
    '',
    'Values: `true`, `replace`, `outer`, `append`, `prepend`, `before`, `after`',
    '',
    'Used on server-rendered elements to swap content into matching elements by ID.',
  ].join('\n'),

  'p-ignore': [
    '**p-ignore** — Skip Pulse processing',
    '',
    'When present, Pulse will not process this element or its subtree.',
  ].join('\n'),

  'p-inherit': [
    '**p-inherit** — Control attribute inheritance',
    '',
    'Values: `false` (stop all inheritance) or a space-separated list of allowed attributes.',
  ].join('\n'),
};

export const METHOD_DOCS: Record<string, string> = {
  GET: 'Retrieve data. Default method. Body is not sent.',
  POST: 'Submit data to create a resource.',
  PUT: 'Replace a resource entirely.',
  PATCH: 'Partially update a resource.',
  DELETE: 'Remove a resource.',
};

export const BEHAVIOR_DOCS: Record<string, string> = {
  replace: 'Replace the target\'s innerHTML (default).',
  outer: 'Replace the target element itself (outerHTML).',
  append: 'Append content to the end of the target.',
  prepend: 'Prepend content to the beginning of the target.',
  before: 'Insert content before the target element.',
  after: 'Insert content after the target element.',
  remove: 'Remove the target element from the DOM.',
  none: 'Do not swap any content into the DOM.',
};

export const MODIFIER_DOCS: Record<string, string> = {
  confirm: '`:confirm(\'message\')` — Show confirm dialog before request.',
  prompt: '`:prompt(\'message\')` — Show prompt dialog; value sent as P-Prompt header.',
  validate: '`:validate` — Validate form before request (calls reportValidity).',
  disable: '`:disable` — Disable element during request.',
  indicator: '`:indicator(#id)` — Show loading indicator element during request.',
  sync: '`:sync(abort|drop|queue)` — Request synchronization strategy.',
  timeout: '`:timeout(5000)` — Request timeout in milliseconds.',
  multipart: '`:multipart` — Send as multipart/form-data instead of JSON.',
  transition: '`:transition` — Use View Transitions API for swap.',
  scroll: '`:scroll(top|bottom)` — Scroll target after swap.',
  select: '`:select(.selector)` — Extract fragment from response before swap.',
  oob: '`:oob` — Process out-of-band swaps in the response.',
  preserve: '`:preserve` — Preserve element state (focus, scroll) across swaps.',
  swap: '`:swap(100ms)` — Delay before performing the swap.',
  settle: '`:settle(100ms)` — Delay before settling CSS classes.',
};

export const TRIGGER_EVENT_DOCS: Record<string, string> = {
  click: 'Mouse click. Default for buttons and links.',
  submit: 'Form submission. Default for `<form>` elements.',
  input: 'Input value change. Default for `<input>` and `<textarea>`.',
  change: 'Value committed. Default for `<select>` elements.',
  keyup: 'Key released.',
  keydown: 'Key pressed down.',
  keypress: 'Key pressed (deprecated, use keydown).',
  mouseenter: 'Mouse enters the element.',
  mouseleave: 'Mouse leaves the element.',
  focus: 'Element receives focus.',
  blur: 'Element loses focus.',
  load: 'Fires immediately when the element is processed.',
  revealed: 'Fires when the element enters the viewport.',
  intersect: 'Alias for `revealed`. Fires on viewport intersection.',
  every: '`every Xs` — Polling trigger. Fires at regular intervals.',
};

export const TRIGGER_MODIFIER_DOCS: Record<string, string> = {
  once: 'Only fire the trigger once.',
  changed: 'Only fire if the value has changed since last trigger.',
  consume: 'Call event.stopPropagation() on the triggering event.',
  debounce: '`debounce Xms` — Wait X ms after last trigger before firing.',
  throttle: '`throttle Xms` — Fire at most once per X ms.',
  delay: '`delay Xms` — Wait X ms before firing.',
  from: '`from <selector>` — Listen on a different element.',
};
