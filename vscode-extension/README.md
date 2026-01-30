# Pulse.js IntelliSense for VS Code

VS Code extension for [Pulse.js](https://github.com/onsever/pulsejs) — a lightweight, declarative library for building dynamic HTML applications with 8 attributes.

## Features

### Attribute Completions

Type `p-` inside any HTML tag to get completions for all 8 Pulse attributes with documentation.

Inside attribute values, get context-aware completions for:

- **p-request** — HTTP methods, `> target` keywords (`this`, `closest`, `find`), `.behavior` values, `:modifier` names, and body keywords (`this`, `only`, `not`)
- **p-trigger** — Event names (`click`, `submit`, `load`, `revealed`, `every`), trigger modifiers (`once`, `changed`, `debounce`, `throttle`, `delay`, `from`)
- **p-on** — Lifecycle events (`before`, `beforeSend`, `beforeSwap`, `afterSwap`, `afterSettle`, `error`)
- **p-history** — `push`, `replace`, `false`
- **p-boost** — `true`, `false`
- **p-oob** — `true`, `replace`, `outer`, `append`, `prepend`, `before`, `after`
- **p-inherit** — `false` or attribute names (`p-request`, `p-trigger`, etc.)

### Snippet Templates

Type any of these prefixes in an HTML file:

| Prefix | Description |
|--------|-------------|
| `p-get` | GET request element |
| `p-form` | POST form |
| `p-delete` | Delete button with confirmation |
| `p-search` | Debounced search input |
| `p-infinite-scroll` | Infinite scroll pattern |
| `p-poll` | Polling element |
| `p-modal` | Modal trigger + container |
| `p-inline-edit` | Click-to-edit element |
| `p-tabs` | Tab navigation |
| `p-load-more` | Load more button |
| `p-nav` | Boosted navigation |
| `p-page` | Full HTML page with Pulse.js |

Or use **Cmd+Shift+P → Pulse: Insert Template** to pick from a list.

### Hover Documentation

Hover over any `p-*` attribute name or value keyword to see inline documentation with syntax examples.

### Diagnostics & Validation

Real-time validation as you type:

- **p-request** — Parse errors, unknown modifiers, duplicate modifiers, missing required modifier values (`:timeout` without value), wrong types (`:timeout(abc)`), invalid enums (`:sync(invalid)`)
- **p-trigger** — Parse errors from the Pulse parser
- **p-history** / **p-boost** / **p-oob** — Invalid values
- **p-on** — Missing `event: handler()` syntax, unknown event names
- **p-inherit** — Unknown attribute names
- **p-ignore** — Warning if a value is provided (should be bare attribute)

### Syntax Highlighting

`p-*` attribute names, HTTP methods (`GET`, `POST`, etc.), target operators (`>`), behavior values (`.outer`, `.append`), and `:modifier` names are highlighted with distinct colors via an injected TextMate grammar.

### CSS Class Completions

Inside `class=""` attributes, get completions for Pulse's CSS classes:

- `pulse-request` — Applied during active request
- `pulse-swapping` — Applied during DOM swap
- `pulse-settling` — Applied after swap, before settle
- `pulse-added` — Applied to newly inserted elements

### Multi-Language Support

Works in HTML, PHP, Blade, EJS, ERB, Handlebars, and Twig files.

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `pulse.completions.enabled` | `true` | Enable attribute completions |
| `pulse.hover.enabled` | `true` | Enable hover documentation |
| `pulse.diagnostics.enabled` | `true` | Enable diagnostics and validation |
| `pulse.syntaxHighlighting.enabled` | `true` | Enable syntax highlighting |

## Quick Reference

```
p-request="{headers} METHOD /url {body} > target.behavior :modifiers"
```

```html
<!-- GET (default method) -->
<div p-request="GET /api/users > #user-list">Load Users</div>

<!-- POST with form body -->
<form p-request="POST /api/users {this} > #result">
  <input name="email" />
  <button type="submit">Create</button>
</form>

<!-- DELETE with confirmation -->
<button p-request="DELETE /api/users/1 > closest tr.outer :confirm('Sure?')">
  Delete
</button>

<!-- Debounced search -->
<input p-request="GET /api/search {this} > #results"
       p-trigger="input changed debounce 300ms" />

<!-- Polling -->
<div p-request="GET /api/status > this"
     p-trigger="every 2s">
  Loading...
</div>
```
