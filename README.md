# Pulse.js

A lightweight, declarative JavaScript library for building dynamic HTML applications. **8 attributes. One unified syntax. ~8.8KB gzipped.**

```html
<button p-request="DELETE /item/1 > closest tr.outer :confirm('Sure?')">
  Delete
</button>
```

One attribute encodes the HTTP method, URL, target, swap behavior, and modifiers — everything needed to make a request and update the DOM.

## Install

### CDN

```html
<script src="https://unpkg.com/pulse-js@1.0.0/dist/pulse.min.js"></script>
```

### npm

```bash
npm install pulse-js
```

```js
import 'pulse-js';
```

Pulse auto-initializes on `DOMContentLoaded`. No setup code needed.

## The 8 Attributes

| Attribute | Purpose | Required |
|-----------|---------|----------|
| `p-request` | HTTP request + response handling | Yes (for actions) |
| `p-trigger` | When the request fires | No (smart defaults) |
| `p-on` | Lifecycle event hooks | No |
| `p-history` | URL/history management | No |
| `p-boost` | Progressive enhancement for links/forms | No |
| `p-oob` | Out-of-band swap marker (server-side) | No |
| `p-ignore` | Skip Pulse processing for element subtree | No |
| `p-inherit` | Control attribute inheritance | No |

## p-request

The core attribute. Encodes method, URL, headers, body, target, swap behavior, and modifiers in one string:

```
p-request="{headers} METHOD /url {body} > target.behavior :modifiers"
```

### Methods

```html
<button p-request="GET /api/items > #list">Load</button>
<button p-request="POST /api/items {#form} > #list">Create</button>
<button p-request="PUT /api/items/1 {#form} > #result">Update</button>
<button p-request="DELETE /api/items/1 > closest .item.remove">Delete</button>
```

GET is the default method if omitted.

### Headers

Place JSON before the method:

```html
<div p-request="{'X-CSRF-Token': 'abc123'} POST /api/submit {#form} > #result">
```

### Body

After the URL, use `{...}` for body:

```html
<!-- JSON literal -->
<button p-request="POST /api {'key': 'value'} > #result">

<!-- Form selector -->
<button p-request="POST /api {#my-form} > #result">

<!-- Element itself (for inputs) -->
<input p-request="GET /search {this} > #results" p-trigger="input debounce 300ms">

<!-- Field filters -->
<button p-request="POST /api {#form only name, email} > #result">
<button p-request="POST /api {#form not password} > #result">
```

### Target + Swap Behavior

After `>`, specify target and optional `.behavior`:

```html
<!-- CSS selector (default: replace innerHTML) -->
<button p-request="GET /api > #output">

<!-- this = triggering element -->
<button p-request="GET /api > this">

<!-- closest ancestor -->
<button p-request="DELETE /item/1 > closest tr.outer">

<!-- find descendant -->
<button p-request="GET /api > find .content">
```

**Behaviors:** `replace` (default), `outer`, `append`, `prepend`, `before`, `after`, `remove`, `none`

### Modifiers

Append `:modifier` or `:modifier(value)`:

| Modifier | Description |
|----------|-------------|
| `:confirm('message')` | Show confirmation dialog before request |
| `:prompt('message')` | Show prompt dialog, send value as `P-Prompt` header |
| `:disable` | Disable element during request |
| `:validate` | Run HTML5 form validation before request |
| `:indicator(#el)` | Show loading indicator during request |
| `:sync(mode)` | Request synchronization: `replace` (default), `drop`, `queue` |
| `:timeout(5000)` | Request timeout in milliseconds |
| `:multipart` | Force multipart/form-data encoding |
| `:transition` | Use View Transitions API for swap |
| `:scroll(top)` | Scroll after swap: `top`, `bottom`, or CSS selector |
| `:select(.inner)` | Extract fragment from response before swapping |
| `:oob` | Process out-of-band elements in response |
| `:preserve` | Preserve element state (focus, scroll) across swaps |
| `:swap(100)` | Delay before swap (ms) |
| `:settle(500)` | Settle class duration (ms) |

```html
<button p-request="DELETE /item/1 > closest .item.remove :confirm('Delete this item?') :disable">
  Delete
</button>
```

## p-trigger

Controls when the request fires. Smart defaults apply if omitted:

- `<button>`, `<a>` → `click`
- `<form>` → `submit`
- `<input>`, `<textarea>` → `input`
- `<select>` → `change`
- Everything else → `click`

```html
<!-- Debounced search -->
<input p-request="GET /search {this} > #results"
       p-trigger="input debounce 300ms">

<!-- Polling every 2 seconds -->
<div p-request="GET /api/time > this"
     p-trigger="every 2s">

<!-- Load on page load -->
<div p-request="GET /api/data > this"
     p-trigger="load">

<!-- Load when scrolled into view -->
<div p-request="GET /api/lazy > this"
     p-trigger="revealed">

<!-- Multiple triggers -->
<input p-trigger="input debounce 300ms, focus once">

<!-- Event modifiers -->
<button p-trigger="click once">             <!-- Fire once -->
<input p-trigger="input changed">           <!-- Only if value changed -->
<button p-trigger="click consume">          <!-- preventDefault + stopPropagation -->
<input p-trigger="input throttle 500ms">    <!-- Throttle -->
<input p-trigger="input delay 200ms">       <!-- Delay -->

<!-- Event filters -->
<input p-trigger="keyup[key === 'Enter']">

<!-- Listen from another element -->
<div p-trigger="click from #other-button">
```

## p-on

Attach handlers to Pulse lifecycle events:

```html
<button p-request="GET /api > #result"
        p-on="before: console.log('starting') | afterSwap: console.log('done')">
```

Events: `before`, `beforeSend`, `beforeSwap`, `afterSwap`, `afterSettle`, `error`, `confirm`

## p-boost

Progressively enhance links and forms to use Pulse instead of full page navigation:

```html
<nav p-boost>
  <a href="/page1">Page 1</a>  <!-- intercepted, loaded via Pulse -->
  <a href="/page2">Page 2</a>
  <a href="/external" p-boost="false">External</a>  <!-- opt out -->
</nav>
```

## p-oob (Out-of-Band)

Server responses can update multiple targets by including elements with `p-oob`:

```html
<!-- Server response -->
<div>Main content here</div>
<div p-oob="#notification">New notification!</div>
<div p-oob="#counter.replace">Count: 5</div>
```

The main content swaps into the primary target. OOB elements swap into their specified selectors.

## p-history

Control browser history integration:

```html
<a p-request="GET /page > #content" p-history="push">Page</a>
<a p-request="GET /page > #content" p-history="replace">Page</a>
<a p-request="GET /page > #content" p-history="false">No history</a>
```

## p-inherit

Control attribute inheritance from ancestors:

```html
<!-- All children inherit headers -->
<div p-request="{'Authorization': 'Bearer token'} GET /api">
  <button p-request="GET /items > #list">Load</button>
  <button p-request="POST /items {#form} > #list">Create</button>
</div>

<!-- Stop inheritance -->
<div p-inherit="false">
  <button p-request="GET /public > #list">No inherited headers</button>
</div>

<!-- Allow only specific attributes -->
<div p-inherit="p-request">
  <!-- Only p-request (headers) inherited, not p-boost -->
</div>
```

## Response Headers

Pulse reads these headers from server responses to control client behavior:

| Header | Effect |
|--------|--------|
| `P-Location` | Client-side navigation via ajax (no full reload) |
| `P-Redirect` | Redirect to URL (full page) |
| `P-Refresh` | Reload the page |
| `P-Retarget` | Override swap target |
| `P-Reswap` | Override swap behavior |
| `P-Reselect` | Override `:select` modifier |
| `P-Push` | Push URL to browser history |
| `P-Replace` | Replace URL in browser history |
| `P-Trigger` | Dispatch custom events on target |
| `P-Trigger-After-Swap` | Dispatch events after swap |
| `P-Trigger-After-Settle` | Dispatch events after settle |

### P-Location

Navigate client-side without a full page reload:

```
P-Location: /new-path
P-Location: {"path": "/new-path", "target": "#content", "swap": "replace"}
```

String form performs `GET /new-path` into `body`. JSON form allows specifying target, swap behavior, and headers.

## Request Headers

Pulse sends these headers with every request:

| Header | Value |
|--------|-------|
| `P-Request` | `true` |
| `P-Current-URL` | Current page URL |
| `P-Target` | Target element ID |
| `P-Trigger` | Triggering element ID |
| `P-Trigger-Name` | Triggering element `name` attribute |

## CSS Classes

Pulse applies these classes during the request lifecycle:

| Class | When |
|-------|------|
| `pulse-request` | On element + indicator during request |
| `pulse-swapping` | On target during swap |
| `pulse-settling` | On target after swap (for transition animations) |
| `pulse-added` | On newly inserted elements (for entry animations) |

## JavaScript API

Pulse exposes a full programmatic API:

```js
// AJAX requests
await Pulse.ajax('GET', '/api/data', '#target');
await Pulse.ajax('POST', '/api/items', '#list', {
  headers: { 'X-Custom': 'value' },
  body: { name: 'test' },
  swap: 'append',
});

// DOM swapping
await Pulse.swap('#target', '<p>New content</p>');
await Pulse.swap('#list', '<li>Item</li>', 'append');

// Events
Pulse.trigger('#btn', 'pulse:myEvent', { foo: 'bar' });
Pulse.on('beforeSwap', (e) => console.log('swapping', e.detail));
Pulse.off('beforeSwap', handler);

// DOM helpers
Pulse.find('.item');           // querySelector
Pulse.findAll('.item');        // querySelectorAll
Pulse.closest(el, '.parent'); // el.closest()
Pulse.addClass(el, 'active');
Pulse.removeClass(el, 'active');
Pulse.toggleClass(el, 'active');
Pulse.remove(el);

// Form values
Pulse.values('#my-form');  // { name: 'John', email: 'john@...' }
```

## Custom Confirm

The `:confirm` modifier emits a cancelable `pulse:confirm` event before falling back to `window.confirm()`. Intercept it to use a custom confirmation UI:

```js
document.addEventListener('pulse:confirm', (e) => {
  e.preventDefault(); // Take control
  const { message, issueRequest } = e.detail;

  showMyDialog(message).then((confirmed) => {
    if (confirmed) issueRequest(); // Continue the request
  });
});
```

## Extension System

Register extensions to hook into the request/response pipeline:

```js
Pulse.defineExtension('my-ext', {
  init(api) {
    console.log('Extension loaded', api.getConfig());
  },
  transformResponse(text, response, ctx) {
    return text; // Modify response HTML before swap
  },
  handleSwap(behavior, target, fragment) {
    return false; // Return true to handle swap yourself
  },
  onEvent(name, event) {
    return true; // Return false to stop event chain
  },
});

Pulse.removeExtension('my-ext');
```

## Response Code Handling

By default, 2xx responses swap content, 4xx/5xx emit errors without swapping. Configure per-status behavior:

```js
Pulse.init({
  responseHandling: [
    { code: '2xx', swap: true, error: false, ignoreTitle: false, select: '', target: '' },
    { code: '404', swap: true, error: false, ignoreTitle: false, select: '', target: '#error-panel' },
    { code: '4xx', swap: false, error: true, ignoreTitle: false, select: '', target: '' },
    { code: '5xx', swap: false, error: true, ignoreTitle: false, select: '', target: '' },
  ],
});
```

## Head Tag Merging

When a response contains a full HTML document (e.g. from boosted links), Pulse merges the `<head>`:

- Updates `document.title` (unless `ignoreTitle: true`)
- Merges `<meta>` by `name`/`property` (replaces existing, adds new)
- Adds new `<link rel="stylesheet">` (skips duplicates by `href`)
- Appends new `<style>` elements

## Script Tag Evaluation

`<script>` tags in swapped content are executed automatically. Configure with:

```js
Pulse.init({
  allowScriptTags: true,     // Set false to strip all scripts
  inlineScriptNonce: 'abc',  // Set nonce for inline scripts (CSP)
});
```

## Configuration

```js
Pulse.init({
  defaultSwap: 'replace',       // Default swap behavior
  defaultTarget: 'this',        // Default target
  timeout: 0,                   // Request timeout (0 = none)
  historyEnabled: true,         // Enable history management
  historyCacheSize: 10,         // Max cached pages
  scrollBehavior: 'instant',    // 'instant' | 'smooth' | 'auto'
  globalViewTransitions: false, // Use View Transitions API globally
  defaultSwapDelay: 0,          // Delay before swap (ms)
  defaultSettleDelay: 20,       // Settle class duration (ms)
  ignoreTitle: false,           // Skip title updates from head merging
  inlineScriptNonce: '',        // Nonce for inline scripts
  responseHandling: [...],      // Per-status-code behavior (see above)
});
```

## Browser Support

ES2020+ — All modern browsers (Chrome 80+, Firefox 80+, Safari 14+, Edge 80+).

## Documentation

Full documentation is available at [https://onsever.github.io/pulsejs/](https://onsever.github.io/pulsejs/)

## VS Code Extension

Install the [Pulse.js IntelliSense](vscode-extension/) extension for attribute completions, hover docs, diagnostics, syntax highlighting, and snippets.

## License

MIT
