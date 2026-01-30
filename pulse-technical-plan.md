# Pulse.js — Technical Implementation Plan

> A comprehensive technical specification for building a modern HTMX alternative with 8 attributes.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Design Philosophy](#2-design-philosophy)
3. [Final Attribute Specification](#3-final-attribute-specification)
4. [Architecture Overview](#4-architecture-overview)
5. [Parser System Design](#5-parser-system-design)
6. [Core Engine Design](#6-core-engine-design)
7. [Request Pipeline](#7-request-pipeline)
8. [Response Processing](#8-response-processing)
9. [Trigger System](#9-trigger-system)
10. [History Management](#10-history-management)
11. [Inheritance System](#11-inheritance-system)
12. [Event System](#12-event-system)
13. [Performance Strategy](#13-performance-strategy)
14. [Security Considerations](#14-security-considerations)
15. [HTMX Comparison](#15-htmx-comparison)
16. [Testing Strategy](#16-testing-strategy)
17. [Bundle & Distribution](#17-bundle--distribution)
18. [Migration Guide](#18-migration-guide)
19. [Future Considerations](#19-future-considerations)

---

## 1. Executive Summary

### 1.1 Project Goal

Build a modern, lightweight HTMX alternative that achieves **100% feature parity** with HTMX's 33 attributes using only **8 attributes** through a unified, readable syntax.

### 1.2 Key Metrics

| Metric | HTMX | Pulse (Target) |
|--------|------|----------------|
| Attributes | 33 | 8 |
| Gzipped Size | ~14KB | ~5KB |
| Dependencies | 0 | 0 |
| Browser Support | IE11+ | Modern (ES2020+) |
| Avg. Attributes per Element | 4-6 | 1-2 |

### 1.3 Core Innovation

The `p-request` attribute combines method, URL, headers, body, target, behavior, and modifiers into a single readable string:

```
{headers} METHOD /url {body} > target.behavior :modifiers
```

---

## 2. Design Philosophy

### 2.1 Principles

1. **Readability First**
   - Syntax should read like English
   - `GET /users > #list.append` is self-explanatory
   - No cryptic abbreviations (`beforeend` → `append`)

2. **Sensible Defaults**
   - GET is default method
   - Self is default target
   - Replace is default behavior
   - Click is default trigger for buttons
   - Submit is default trigger for forms

3. **Progressive Complexity**
   - Simple cases should be simple: `p-request="/users"`
   - Complex cases are possible: full syntax with all options
   - No cliff between simple and complex

4. **Single Responsibility per Attribute**
   - `p-request` — What to do
   - `p-trigger` — When to do it
   - `p-on` — How to react
   - Each attribute has one clear purpose

5. **Modern Web Platform**
   - Use native APIs (fetch, IntersectionObserver, View Transitions)
   - No polyfills, no legacy support
   - Smaller bundle, better performance

### 2.2 Non-Goals

- IE11 support
- jQuery compatibility
- Server-side rendering helpers
- Built-in WebSocket/SSE (v2 consideration)
- Virtual DOM or reactive state

---

## 3. Final Attribute Specification

### 3.1 The 8 Attributes

| # | Attribute | Purpose | Required |
|---|-----------|---------|----------|
| 1 | `p-request` | Define HTTP request and response handling | Yes (for actions) |
| 2 | `p-trigger` | Define when request fires | No (has defaults) |
| 3 | `p-on` | Lifecycle event hooks | No |
| 4 | `p-history` | URL/history management | No |
| 5 | `p-boost` | Progressive enhancement for links/forms | No |
| 6 | `p-oob` | Out-of-band swap marker (server-side) | No |
| 7 | `p-ignore` | Skip Pulse processing | No |
| 8 | `p-inherit` | Control attribute inheritance | No |

### 3.2 p-request Syntax

```
p-request="{headers} METHOD /url {body} > target.behavior :modifiers"
```

#### Components

| Component | Format | Required | Default | Examples |
|-----------|--------|----------|---------|----------|
| Headers | `{'Key': 'value'}` | No | `{}` | `{'X-CSRF': 'token'}` |
| Method | `GET\|POST\|PUT\|PATCH\|DELETE` | No | `GET` | `POST` |
| URL | `/path` or full URL | Yes | — | `/api/users` |
| Body | `{...}` (see below) | No | Form data | `{'id': 5}` |
| Target | `> selector` | No | `this` | `> #list` |
| Behavior | `.behavior` | No | `replace` | `.append` |
| Modifiers | `:name` or `:name(value)` | No | — | `:confirm('Sure?')` |

#### Body Syntax Options

| Syntax | Meaning | Example |
|--------|---------|---------|
| `{'key': 'value'}` | Explicit JSON data | `{'name': 'John'}` |
| `{#selector}` | Include inputs from element | `{#form1}` |
| `{#sel1, #sel2}` | Include from multiple | `{#filters, #search}` |
| `{this}` | Include from self | `{this}` |
| `{only field1, field2}` | Only these fields | `{only name, email}` |
| `{not field1, field2}` | Exclude these fields | `{not password}` |

#### Behaviors

| Behavior | Action | HTMX Equivalent |
|----------|--------|-----------------|
| `replace` | Replace innerHTML | `innerHTML` |
| `outer` | Replace entire element | `outerHTML` |
| `append` | Add at end | `beforeend` |
| `prepend` | Add at start | `afterbegin` |
| `before` | Insert before | `beforebegin` |
| `after` | Insert after | `afterend` |
| `remove` | Remove element | `delete` |
| `none` | No DOM change | `none` |

#### Modifiers

| Modifier | Purpose | Parameters |
|----------|---------|------------|
| `:confirm` | Confirmation dialog | Optional message |
| `:prompt` | Prompt dialog | Optional message |
| `:disable` | Disable during request | Optional selector |
| `:validate` | Validate form first | None |
| `:indicator` | Loading indicator | Selector |
| `:sync` | Concurrency control | `abort`, `drop`, `queue` |
| `:timeout` | Request timeout | Milliseconds |
| `:multipart` | File upload encoding | None |
| `:transition` | View Transitions API | None |
| `:scroll` | Scroll after swap | `top`, `bottom`, selector |
| `:select` | Pick fragment from response | Selector |
| `:oob` | Out-of-band selections | Selector list |
| `:preserve` | Preserve element | None |
| `:swap` | Swap timing | Milliseconds |
| `:settle` | Settle timing | Milliseconds |

### 3.3 p-trigger Syntax

```
p-trigger="event modifiers, event modifiers"
```

#### Events

| Event | Description | Default For |
|-------|-------------|-------------|
| `click` | Mouse click | `<button>`, `<a>` |
| `submit` | Form submission | `<form>` |
| `change` | Value change | `<select>`, checkbox |
| `input` | Input event | `<input>`, `<textarea>` |
| `load` | Element mount | — |
| `revealed` | Enters viewport | — |
| `intersect` | Intersection observer | — |
| `every Xs` | Polling interval | — |

#### Trigger Modifiers

| Modifier | Purpose | Example |
|----------|---------|---------|
| `once` | Fire only once | `click once` |
| `changed` | Only if value changed | `input changed` |
| `debounce Xms` | Debounce | `input debounce 300ms` |
| `throttle Xms` | Throttle | `scroll throttle 100ms` |
| `delay Xms` | Delay before fire | `click delay 1s` |
| `from selector` | Delegate from element | `input from #search` |
| `[expression]` | Conditional filter | `click[ctrlKey]` |
| `consume` | Stop propagation | `click consume` |

### 3.4 p-on Syntax

```
p-on="event: handler() | event: handler()"
```

#### Lifecycle Events

| Event | When | Cancelable |
|-------|------|------------|
| `before` | Before request starts | Yes |
| `after` | After DOM swap | No |
| `error` | On request error | No |
| `abort` | On request abort | No |
| `progress` | Upload progress | No |

### 3.5 p-history Syntax

| Value | Action |
|-------|--------|
| `push` | Push URL to history |
| `push /url` | Push custom URL |
| `replace` | Replace current URL |
| `replace /url` | Replace with custom URL |
| `false` | Disable history caching |
| `elt` | Mark as history element |

### 3.6 p-boost Syntax

| Value | Action |
|-------|--------|
| (no value) | Enable boosting |
| `true` | Enable boosting |
| `false` | Disable boosting |

### 3.7 p-oob Syntax (Server Response)

```
p-oob="#selector"
p-oob="#selector.behavior"
```

### 3.8 p-ignore

No value. Simply marks element subtree to skip processing.

### 3.9 p-inherit

| Value | Action |
|-------|--------|
| `false` | Disable all inheritance |
| `attribute-list` | Only inherit listed |

---

## 4. Architecture Overview

### 4.1 High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                         PULSE.JS                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    PARSER    │  │    ENGINE    │  │    EVENTS    │      │
│  │              │  │              │  │              │      │
│  │ • Request    │  │ • Init       │  │ • Emitter    │      │
│  │ • Trigger    │  │ • Process    │  │ • Lifecycle  │      │
│  │ • Body       │  │ • Dispatch   │  │ • Hooks      │      │
│  │ • Modifiers  │  │ • Cleanup    │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                 │               │
│         └────────────────┼─────────────────┘               │
│                          │                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   TRIGGERS   │  │   REQUEST    │  │   RESPONSE   │      │
│  │              │  │              │  │              │      │
│  │ • Events     │  │ • Builder    │  │ • Processor  │      │
│  │ • Polling    │  │ • Executor   │  │ • Swapper    │      │
│  │ • Viewport   │  │ • Sync       │  │ • OOB        │      │
│  │ • Filters    │  │              │  │ • Select     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                 │               │
│         └────────────────┼─────────────────┘               │
│                          │                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   HISTORY    │  │     DOM      │  │    CONFIG    │      │
│  │              │  │              │  │              │      │
│  │ • Manager    │  │ • Observer   │  │ • Defaults   │      │
│  │ • Cache      │  │ • Selectors  │  │ • Merge      │      │
│  │ • Restore    │  │ • Fragments  │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Data Flow

```
User Interaction
       │
       ▼
┌─────────────────┐
│  TRIGGER FIRES  │ ← Event, Timer, Intersection, Load
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PARSE REQUEST  │ ← Cached if possible
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ RESOLVE INHERIT │ ← Walk up DOM tree
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ APPLY MODIFIERS │ ← confirm, validate, etc.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  EMIT: before   │ ← Cancelable
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ BUILD REQUEST   │ ← Headers, body, URL
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ EXECUTE FETCH   │ ← With abort controller
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PROCESS HEADERS │ ← P-Redirect, P-Retarget, etc.
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PARSE HTML    │ ← DOMParser
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  APPLY SELECT   │ ← Extract fragment
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  EXTRACT OOB    │ ← Find p-oob elements
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ EMIT: beforeSwap│ ← Cancelable
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   SWAP DOM      │ ← With View Transition if enabled
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PROCESS OOB    │ ← Swap OOB elements
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ UPDATE HISTORY  │ ← Push/Replace URL
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ HANDLE SCROLL   │ ← Scroll to target
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PROCESS NEW DOM │ ← Attach triggers to new elements
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  EMIT: after    │
└─────────────────┘
```

### 4.3 Module Dependencies

```
                    ┌──────────┐
                    │  index   │ (entry point)
                    └────┬─────┘
                         │
                         ▼
                    ┌──────────┐
                    │  engine  │
                    └────┬─────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌─────────┐    ┌──────────┐    ┌──────────┐
    │ parser  │    │ triggers │    │ request  │
    └────┬────┘    └────┬─────┘    └────┬─────┘
         │              │               │
         │              │               ▼
         │              │         ┌──────────┐
         │              │         │ response │
         │              │         └────┬─────┘
         │              │              │
         ▼              ▼              ▼
    ┌─────────────────────────────────────┐
    │               utils                  │
    │  (debounce, selectors, events, etc) │
    └─────────────────────────────────────┘
```

### 4.4 State Management

#### Element State (WeakMap)

Each processed element has associated state:

| Property | Type | Description |
|----------|------|-------------|
| `triggers` | Array | Active trigger instances |
| `parsedRequest` | Object | Cached parsed p-request |
| `parsedTrigger` | Object | Cached parsed p-trigger |
| `inherited` | Object | Resolved inherited attributes |
| `abortController` | AbortController | For canceling requests |
| `lastValue` | Any | For `changed` modifier |

#### Global State

| Property | Type | Description |
|----------|------|-------------|
| `config` | Object | Merged configuration |
| `historyCache` | LRU Cache | URL → content cache |
| `parserCache` | Map | Attribute string → parsed result |
| `activeRequests` | WeakMap | Element → AbortController |
| `observer` | MutationObserver | For dynamic content |

---

## 5. Parser System Design

### 5.1 Parser Architecture

We need parsers for:
1. **Request Parser** — Most complex, handles full `p-request` syntax
2. **Trigger Parser** — Handles events, modifiers, filters
3. **Body Parser** — Handles `{body}` syntax variants
4. **Modifier Parser** — Handles `:modifier(value)` syntax

### 5.2 Algorithm Choice: Recursive Descent

**Why not Regex?**
- Complex nested structures (JSON in body)
- Better error messages
- Easier to maintain
- More performant for our grammar

**Why not Parser Generator (PEG.js, etc.)?**
- Added dependency
- Larger bundle
- Our grammar is simple enough

**Recursive Descent Benefits:**
- Single pass, O(n) time
- Predictable memory usage
- Clear, maintainable code
- Excellent error messages with position info

### 5.3 Request Parser Grammar

```ebnf
request       ::= [headers] [method] url [body] [target] modifiers*

headers       ::= '{' json_pairs '}'
method        ::= 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
url           ::= '/' path_segment* ['?' query_string]
body          ::= '{' body_content '}'
target        ::= '>' whitespace* selector ['.' behavior]
modifiers     ::= ':' identifier ['(' value ')']

body_content  ::= json_pairs | selector_list | filter_expr | mixed
selector_list ::= selector (',' selector)*
filter_expr   ::= ('only' | 'not') identifier (',' identifier)*
mixed         ::= (selector | filter_expr) (',' (selector | filter_expr))*

selector      ::= '#' identifier 
                | '.' identifier
                | 'this'
                | 'closest' css_selector
                | 'find' css_selector
                | css_selector

behavior      ::= 'replace' | 'outer' | 'append' | 'prepend' 
                | 'before' | 'after' | 'remove' | 'none'
```

### 5.4 Trigger Parser Grammar

```ebnf
trigger       ::= trigger_event (',' trigger_event)*

trigger_event ::= event_name [filter] trigger_mod* [from_clause]

event_name    ::= identifier | 'every' time_value
filter        ::= '[' expression ']'
trigger_mod   ::= 'once' | 'changed' | 'consume'
                | 'debounce' time_value
                | 'throttle' time_value
                | 'delay' time_value
from_clause   ::= 'from' selector

time_value    ::= number ('ms' | 's')?
```

### 5.5 Parser Caching Strategy

**Problem:** Parsing is expensive, same attributes appear repeatedly.

**Solution:** Two-level caching

1. **Global String Cache** (Map)
   - Key: Raw attribute string
   - Value: Parsed result
   - Size limit: 500 entries (LRU eviction)
   - Shared across all elements

2. **Element Cache** (WeakMap)
   - Key: Element reference
   - Value: Parsed result + inherited values
   - Automatically garbage collected

**Cache Invalidation:**
- Global cache: Never invalidated (immutable strings)
- Element cache: Invalidated when attribute changes (MutationObserver)

### 5.6 Parser Complexity Analysis

| Parser | Time Complexity | Space Complexity |
|--------|-----------------|------------------|
| Request | O(n) | O(m) where m = AST nodes |
| Trigger | O(n) | O(k) where k = events |
| Body | O(n) | O(j) where j = JSON size |
| Modifier | O(n) | O(1) per modifier |

All parsers are single-pass, no backtracking for valid input.

### 5.7 Error Handling

Parser errors should include:
- Position in string (character index)
- Expected token type
- Actual token found
- Helpful suggestion when possible

Error format:
```
Pulse Parse Error: Expected URL after method
  p-request="POST > #list"
                  ^
  Hint: Add a URL path like "POST /api/data > #list"
```

---

## 6. Core Engine Design

### 6.1 Initialization Sequence

```
1. DOMContentLoaded fires (or manual Pulse.init())
        │
        ▼
2. Load configuration
   - Check <meta name="pulse-config">
   - Merge with defaults
   - Apply Pulse.config() overrides
        │
        ▼
3. Process existing DOM
   - Query all [p-request], [p-boost]
   - Skip elements inside [p-ignore]
   - Parse attributes, setup triggers
        │
        ▼
4. Setup MutationObserver
   - Watch for added nodes
   - Watch for removed nodes
   - Watch for attribute changes
        │
        ▼
5. Setup global handlers
   - Boosted link clicks
   - Boosted form submits
   - History popstate
        │
        ▼
6. Emit pulse:ready event
```

### 6.2 Element Processing Algorithm

```
processElement(element):
  1. Check if already processed (WeakMap) → skip
  2. Check if inside [p-ignore] → skip
  3. Check for [p-ignore] on self → skip
  
  4. Parse p-request if present
     - Check parser cache
     - Parse if not cached
     - Store in cache
  
  5. Parse p-trigger if present
     - Default based on element type if not present
  
  6. Resolve inheritance
     - Walk up DOM tree
     - Collect inheritable attributes
     - Apply p-inherit restrictions
  
  7. Setup triggers
     - Create trigger instances
     - Attach event listeners
  
  8. Store element state
     - WeakMap for GC friendliness
```

### 6.3 MutationObserver Strategy

**Observed Mutations:**
- `childList: true` — New/removed elements
- `subtree: true` — Entire document
- `attributes: true` — Attribute changes
- `attributeFilter: ['p-request', 'p-trigger', ...]` — Only Pulse attributes

**Processing Strategy:**

For **added nodes:**
1. Check if node is Element
2. Process node if has Pulse attributes
3. Query and process descendants with Pulse attributes
4. Use `requestIdleCallback` for large batches

For **removed nodes:**
1. Cleanup trigger instances
2. Abort pending requests
3. Remove from WeakMap (automatic via GC)

For **attribute changes:**
1. Re-parse changed attribute
2. Re-setup triggers if p-trigger changed
3. Invalidate element cache

### 6.4 Boosting Implementation

**Link Boosting:**
1. Delegate click handler on document
2. On click, find closest `<a>` with href
3. Check if should boost (same origin, no download, etc.)
4. Check if ancestor has `p-boost`
5. Check if element has `p-boost="false"`
6. If boosting: preventDefault, execute as Pulse request

**Form Boosting:**
1. Delegate submit handler on document
2. Check if should boost (same origin)
3. Check boost attributes
4. If boosting: preventDefault, execute as Pulse request

**Boost Exclusions:**
- External links (different origin)
- Links with `target="_blank"`
- Links with `download` attribute
- Elements with `p-boost="false"`

---

## 7. Request Pipeline

### 7.1 Request Building

**Step 1: Collect Headers**
```
1. Start with default Pulse headers:
   - P-Request: true
   - P-Current-URL: current page URL
   - P-Target: target element ID (if has ID)
   - P-Trigger: triggering element ID
   - P-Trigger-Name: triggering element name

2. Add inherited headers (from ancestors)

3. Add explicit headers from p-request

4. Add Content-Type based on body type:
   - JSON: application/json
   - Multipart: multipart/form-data (let browser set)
   - URL encoded: application/x-www-form-urlencoded
```

**Step 2: Build Body/Params**
```
1. Determine body type from {body} syntax

2. For explicit JSON:
   - Parse JSON object
   - Use as-is

3. For selectors:
   - Find each element
   - Collect form data / input values
   - Merge into single object

4. For filters:
   - Collect from self/form
   - Apply only/not filter

5. For GET/DELETE:
   - Convert body to query string
   - Append to URL

6. For POST/PUT/PATCH:
   - If :multipart → FormData
   - Else → JSON.stringify
```

**Step 3: Resolve URL**
```
1. If absolute URL → use as-is
2. If relative URL → resolve against current origin
3. Append query params for GET/DELETE
```

### 7.2 Pre-Request Modifiers

**Execution Order:**

1. `:confirm` — Show dialog, abort if cancelled
2. `:prompt` — Show dialog, store value, abort if cancelled
3. `:validate` — Check form validity, abort if invalid
4. `:disable` — Disable target elements
5. `:indicator` — Add `pulse-request` class

### 7.3 Request Execution

**Sync Modes:**

| Mode | Behavior |
|------|----------|
| `abort` (default for inputs) | Abort previous request from same element |
| `drop` | Don't start if request in flight |
| `queue` | Queue and execute sequentially |
| `queue:first` | Queue, keep only first |
| `queue:last` | Queue, keep only last |
| `queue:all` | Queue all requests |

**Execution Flow:**
```
1. Check sync mode, handle accordingly
2. Create AbortController
3. Store in activeRequests
4. Apply timeout via setTimeout + abort
5. Execute fetch()
6. On complete/error/abort:
   - Remove from activeRequests
   - Restore disabled elements
   - Remove indicator class
   - Process queue if any
```

### 7.4 Timeout Handling

- Default: 0 (no timeout)
- When set: `setTimeout(() => controller.abort(), timeout)`
- On timeout: Emit `pulse:timeout` event
- Distinguish from user abort via error type

---

## 8. Response Processing

### 8.1 Response Header Processing

**Check Order:**

| Header | Action |
|--------|--------|
| `P-Redirect` | Redirect to URL (stops processing) |
| `P-Refresh` | Full page reload (stops processing) |
| `P-Retarget` | Override swap target |
| `P-Reswap` | Override swap behavior |
| `P-Reselect` | Override :select |
| `P-Push` | Push URL to history |
| `P-Replace` | Replace URL in history |
| `P-Trigger` | Trigger events |
| `P-Trigger-After-Swap` | Queue events for after swap |
| `P-Trigger-After-Settle` | Queue events for after settle |

### 8.2 HTML Parsing

**Method:** DOMParser API

**Process:**
1. Parse response text as HTML
2. Extract from `<body>` (ignore `<head>` unless full document needed)
3. Handle scripts: Execute if `config.allowScriptTags`
4. Handle title: Update if found and `config.ignoreTitle` is false

### 8.3 Fragment Selection (:select)

**Algorithm:**
```
1. If :select specified:
   - querySelector on parsed document
   - Clone selected element
   - Use as swap content
2. Else:
   - Use entire body content
```

### 8.4 OOB Extraction

**Algorithm:**
```
1. Find all [p-oob] elements in response
2. For each:
   - Parse p-oob attribute (selector + behavior)
   - Clone content
   - Remove from main response
   - Store for later processing
3. Also check <template p-oob>
```

### 8.5 DOM Swapping

**Pre-Swap:**
1. Add `pulse-swapping` class to target
2. If `:transition`, start View Transition

**Swap Algorithms by Behavior:**

| Behavior | Algorithm |
|----------|-----------|
| `replace` | `target.innerHTML = ''` then `target.appendChild(content)` |
| `outer` | `target.replaceWith(...content.childNodes)` |
| `append` | `target.appendChild(content)` |
| `prepend` | `target.insertBefore(content, target.firstChild)` |
| `before` | `target.parentNode.insertBefore(content, target)` |
| `after` | `target.parentNode.insertBefore(content, target.nextSibling)` |
| `remove` | `target.remove()` |
| `none` | No action |

**Post-Swap:**
1. Remove `pulse-swapping` class
2. Add `pulse-settling` class
3. Add `pulse-added` class to new elements
4. Wait for settle delay
5. Remove `pulse-settling` and `pulse-added`

### 8.6 View Transitions Integration

**Check:**
1. Is `:transition` modifier present?
2. Is View Transitions API available?
3. Is `config.globalViewTransitions` true?

**Execution:**
```
If using transitions:
  document.startViewTransition(() => {
    performSwap()
  }).finished.then(() => {
    postSwapProcessing()
  })
Else:
  performSwap()
  postSwapProcessing()
```

### 8.7 Preserve Handling

**For elements with `:preserve` or `[p-swap*="preserve"]`:**

1. Before swap, find preserved elements in current DOM
2. Each must have an ID
3. After swap, find matching IDs in new content
4. Replace new element with preserved (current) element
5. Preserves: video state, scroll position, focus, etc.

---

## 9. Trigger System

### 9.1 Trigger Types

| Type | Implementation |
|------|----------------|
| Event | `addEventListener` on element or delegate |
| Load | `queueMicrotask` for immediate execution |
| Revealed | `IntersectionObserver` |
| Polling | `setInterval` |

### 9.2 Event Trigger Processing

**Setup:**
1. Determine event target (self, `from` selector, window, document)
2. Create handler function
3. Wrap with modifiers (debounce, throttle, etc.)
4. Attach listener

**Handler Execution:**
1. Evaluate filter expression if present
2. Check `changed` modifier if present
3. Apply `consume` if present
4. Check `once` flag
5. Fire request

### 9.3 Debounce vs Throttle

**Debounce:**
- Delays execution until N ms after last call
- Use case: Search input (wait for user to stop typing)
- Implementation: Clear timeout on each call, set new timeout

**Throttle:**
- Executes at most once per N ms
- Use case: Scroll events (limit frequency)
- Implementation: Track last execution time, skip if too recent

### 9.4 Filter Expression Evaluation

**Security Concern:** Filter expressions are user-provided code

**Safe Evaluation Strategy:**
1. Create sandboxed context with allowed variables:
   - `event` — The event object
   - `this` — The element
   - `ctrlKey`, `shiftKey`, `altKey`, `metaKey` — Keyboard modifiers
   - `key` — Pressed key
   - `target` — Event target
2. Use `new Function()` with limited scope
3. No access to global scope
4. Catch and log errors, return false on error

### 9.5 Intersection Observer Configuration

**For `revealed`:**
- `root`: null (viewport)
- `rootMargin`: "0px"
- `threshold`: 0 (any visibility)

**For `intersect` with options:**
- Parse threshold from syntax
- Parse rootMargin from syntax

### 9.6 Polling Considerations

**Memory Leak Prevention:**
1. Check if element still in DOM on each tick
2. Clear interval if removed
3. Use WeakRef if available for element reference

**Performance:**
1. Don't poll invisible elements
2. Use Intersection Observer to pause/resume
3. Respect `once` modifier

---

## 10. History Management

### 10.1 Cache Strategy

**LRU Cache Implementation:**
- Max entries: Configurable (default 10)
- Eviction: Least recently used
- Key: Full URL
- Value: { content, title, scrollPosition, timestamp }

**Cache Entry:**
```
{
  url: string,
  content: string (HTML),
  title: string,
  scrollPosition: { x: number, y: number },
  timestamp: number
}
```

### 10.2 History Element

When `p-history="elt"` is present:
- Only cache that element's innerHTML
- On restore, only replace that element
- Rest of page remains unchanged

**Default (no history element):**
- Cache `document.body.innerHTML`
- Replace entire body on restore

### 10.3 Popstate Handling

```
1. On popstate event:
2. Get URL from location.href
3. Check cache for URL
4. If cached:
   - Restore from cache
   - Update title
   - Restore scroll position
   - Reprocess new content
5. If not cached:
   - If config.refreshOnHistoryMiss → reload page
   - Else → fetch URL with P-History-Restore-Request header
```

### 10.4 Scroll Restoration

**On cache:**
- Store current scrollX, scrollY

**On restore:**
- Restore scroll position after DOM update
- Use `requestAnimationFrame` for timing

**For new navigation (push):**
- Scroll based on `:scroll` modifier
- Default: scroll to top

---

## 11. Inheritance System

### 11.1 Inheritable Attributes

| Attribute Part | Inherited |
|----------------|-----------|
| Headers (from p-request) | Yes |
| Body defaults | No |
| Target | No |
| Modifiers | Configurable |
| p-boost | Yes |

### 11.2 Inheritance Resolution Algorithm

```
1. Start with element
2. Walk up parentElement chain
3. For each ancestor:
   - If has [p-inherit="false"], stop walking
   - If has [p-inherit="attr1, attr2"], only collect those
   - Collect inheritable values
4. Merge (child values override ancestor)
```

### 11.3 Performance Optimization

**Problem:** Walking DOM on every request is expensive

**Solution:**
1. Cache resolved inheritance in element state
2. Invalidate only when ancestor attributes change
3. Use WeakMap for automatic cleanup

---

## 12. Event System

### 12.1 Event Types

**Lifecycle Events:**
| Event | Bubbles | Cancelable | Detail |
|-------|---------|------------|--------|
| `pulse:ready` | Yes | No | { config } |
| `pulse:before` | Yes | Yes | { element, request, params } |
| `pulse:beforeSend` | Yes | Yes | { element, xhr } |
| `pulse:afterRequest` | Yes | No | { element, response, successful } |
| `pulse:beforeSwap` | Yes | Yes | { element, target, content } |
| `pulse:afterSwap` | Yes | No | { element, target } |
| `pulse:afterSettle` | Yes | No | { element, target } |
| `pulse:error` | Yes | No | { element, error } |
| `pulse:abort` | Yes | No | { element } |
| `pulse:timeout` | Yes | No | { element } |

**OOB Events:**
| Event | Detail |
|-------|--------|
| `pulse:oob` | { target, content, behavior } |

**History Events:**
| Event | Detail |
|-------|--------|
| `pulse:historyRestore` | { url, fromCache } |
| `pulse:historyCacheMiss` | { url } |

### 12.2 p-on Handler Parsing

**Syntax:** `event: handler() | event: handler()`

**Parsing:**
1. Split by `|`
2. For each part, split by first `:`
3. Event name → lifecycle event
4. Handler → JavaScript to execute

**Execution:**
1. Create Function from handler string
2. Bind `this` to element
3. Pass event as parameter `e`
4. Execute in try-catch

### 12.3 Server-Triggered Events (P-Trigger header)

**Format Options:**
```
P-Trigger: eventName
P-Trigger: event1, event2
P-Trigger: {"eventName": {"key": "value"}}
```

**Processing:**
1. Parse header value
2. For simple string: dispatch event with no detail
3. For JSON: dispatch event with detail from JSON

---

## 13. Performance Strategy

### 13.1 Parsing Performance

| Strategy | Impact |
|----------|--------|
| Parser caching | Avoid re-parsing same strings |
| Single-pass parsing | O(n) complexity |
| No regex for complex parsing | Faster, less memory |

### 13.2 DOM Performance

| Strategy | Impact |
|----------|--------|
| Event delegation for boost | One listener vs many |
| WeakMap for element state | Automatic GC |
| requestIdleCallback for batch processing | Don't block main thread |
| DocumentFragment for multiple inserts | Single reflow |

### 13.3 Network Performance

| Strategy | Impact |
|----------|--------|
| AbortController | Cancel unnecessary requests |
| Request deduplication | Don't repeat identical requests |
| Sync modes | Prevent request flooding |

### 13.4 Memory Performance

| Strategy | Impact |
|----------|--------|
| WeakMap/WeakRef | Automatic cleanup |
| LRU cache limits | Bounded memory usage |
| Cleanup on element removal | No orphaned listeners |

### 13.5 Bundle Size Strategy

**Techniques:**
1. Tree-shakeable exports
2. No runtime dependencies
3. Terser with aggressive settings
4. Avoid polyfills (modern browsers only)
5. Share code between modules

**Size Budget:**
- Unminified: ~20KB
- Minified: ~8KB
- Gzipped: ~5KB

---

## 14. Security Considerations

### 14.1 XSS Prevention

**Risks:**
- Filter expressions (`[expr]`) execute code
- p-on handlers execute code
- Response HTML is inserted into DOM

**Mitigations:**
1. Filter expressions: Sandboxed execution, limited scope
2. p-on handlers: Developer's responsibility (same as onclick)
3. HTML insertion: Same as HTMX, rely on server sanitization
4. CSP compatibility: Support nonce for inline scripts

### 14.2 CSRF Protection

**Built-in Support:**
1. Custom headers option (server can verify)
2. Easy to add CSRF token via inherited headers
3. Same-origin default (config.selfRequestsOnly)

### 14.3 Same-Origin Policy

**Default:** `config.selfRequestsOnly = true`

**Behavior:**
- Block requests to different origins
- Can be disabled for CORS scenarios
- Always respect CORS headers from server

### 14.4 Content-Type Handling

**Request:**
- JSON: `application/json`
- Form: `application/x-www-form-urlencoded`
- Multipart: `multipart/form-data`

**Response:**
- Only process `text/html` for swapping
- JSON handling for non-swap scenarios

---

## 15. HTMX Comparison

### 15.1 Feature Mapping

| HTMX | Pulse | Notes |
|------|-------|-------|
| `hx-get` | `p-request="GET /url"` | Method in p-request |
| `hx-post` | `p-request="POST /url"` | Method in p-request |
| `hx-put` | `p-request="PUT /url"` | Method in p-request |
| `hx-patch` | `p-request="PATCH /url"` | Method in p-request |
| `hx-delete` | `p-request="DELETE /url"` | Method in p-request |
| `hx-target` | `> selector` | In p-request |
| `hx-swap` | `.behavior` | In p-request |
| `hx-trigger` | `p-trigger` | Separate attribute |
| `hx-vals` | `{body}` | In p-request |
| `hx-headers` | `{headers}` | In p-request |
| `hx-include` | `{#selector}` | In body syntax |
| `hx-params` | `{only/not}` | In body syntax |
| `hx-confirm` | `:confirm` | Modifier |
| `hx-prompt` | `:prompt` | Modifier |
| `hx-indicator` | `:indicator` | Modifier |
| `hx-disabled-elt` | `:disable` | Modifier |
| `hx-validate` | `:validate` | Modifier |
| `hx-sync` | `:sync` | Modifier |
| `hx-encoding` | `:multipart` | Modifier |
| `hx-push-url` | `p-history="push"` | Separate attribute |
| `hx-replace-url` | `p-history="replace"` | Separate attribute |
| `hx-select` | `:select` | Modifier |
| `hx-select-oob` | `:oob` | Modifier |
| `hx-swap-oob` | `p-oob` | Separate attribute |
| `hx-preserve` | `:preserve` | Modifier |
| `hx-boost` | `p-boost` | Separate attribute |
| `hx-on` | `p-on` | Separate attribute |
| `hx-disable` | `p-ignore` | Separate attribute |
| `hx-disinherit` | `p-inherit` | Separate attribute |
| `hx-history` | `p-history="false"` | Separate attribute |
| `hx-history-elt` | `p-history="elt"` | Separate attribute |

### 15.2 Syntax Comparison

**Example 1: Simple GET**
```html
<!-- HTMX -->
<button hx-get="/users" hx-target="#list">Load</button>

<!-- Pulse -->
<button p-request="GET /users > #list">Load</button>
```

**Example 2: POST with Body**
```html
<!-- HTMX -->
<button hx-post="/users" hx-vals='{"name":"John"}' hx-target="#list">Add</button>

<!-- Pulse -->
<button p-request="POST /users {'name':'John'} > #list">Add</button>
```

**Example 3: Delete with Confirmation**
```html
<!-- HTMX (4 attributes) -->
<button 
  hx-delete="/item/1" 
  hx-target="closest tr" 
  hx-swap="outerHTML" 
  hx-confirm="Sure?"
>Delete</button>

<!-- Pulse (1 attribute) -->
<button p-request="DELETE /item/1 > closest tr.outer :confirm('Sure?')">Delete</button>
```

**Example 4: Search Input**
```html
<!-- HTMX (5 attributes) -->
<input 
  hx-get="/search" 
  hx-target="#results" 
  hx-trigger="input changed delay:300ms"
  hx-indicator="#spinner"
  hx-sync="this:abort"
>

<!-- Pulse (2 attributes) -->
<input 
  p-request="GET /search > #results :indicator(#spinner) :sync(abort)"
  p-trigger="input changed debounce 300ms"
>
```

**Example 5: Complex Form**
```html
<!-- HTMX (7 attributes) -->
<form 
  hx-post="/save"
  hx-target="#result"
  hx-push-url="true"
  hx-validate="true"
  hx-disabled-elt="find button"
  hx-indicator="#spinner"
  hx-headers='{"X-CSRF":"token"}'
>

<!-- Pulse (3 attributes) -->
<form 
  p-request="{'X-CSRF':'token'} POST /save > #result :validate :disable(button) :indicator(#spinner)"
  p-history="push"
>
```

### 15.3 Architecture Comparison

| Aspect | HTMX | Pulse |
|--------|------|-------|
| Attribute parsing | Simple key-value | Recursive descent parser |
| State management | Data attributes | WeakMap |
| Event delegation | Per-element | Global + per-element |
| History | Custom | Native + LRU cache |
| Extensions | Plugin system | None (v1) |
| Browser support | IE11+ | ES2020+ |

### 15.4 Bundle Size Comparison

| Library | Raw | Minified | Gzipped |
|---------|-----|----------|---------|
| HTMX 1.9 | 47KB | 14KB | ~14KB |
| Pulse (target) | 20KB | 8KB | ~5KB |

### 15.5 Performance Comparison (Expected)

| Operation | HTMX | Pulse |
|-----------|------|-------|
| Initial parse | Faster (simpler) | Slightly slower |
| Cached parse | N/A | Much faster |
| DOM observation | Same | Same |
| Request execution | Same | Same |
| DOM swapping | Same | Same |

---

## 16. Testing Strategy

### 16.1 Unit Tests

**Parser Tests:**
- Valid p-request strings (all variations)
- Invalid p-request strings (error messages)
- Edge cases (empty, whitespace, unicode)
- Body syntax variations
- Modifier parsing
- Trigger parsing

**Engine Tests:**
- Initialization
- Element processing
- Inheritance resolution
- Cleanup

**Trigger Tests:**
- Event attachment
- Debounce/throttle
- Filter evaluation
- Polling
- Intersection

### 16.2 Integration Tests

**Request Flow:**
- End-to-end request execution
- Header verification
- Body building
- Response processing

**DOM Operations:**
- All swap behaviors
- OOB updates
- Preserve handling
- View Transitions (where supported)

**History:**
- Push/replace
- Popstate handling
- Cache hit/miss

### 16.3 E2E Tests

**Scenarios:**
- Active search
- Form submission
- Infinite scroll
- Modal loading
- SPA navigation
- File upload

**Browser Matrix:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### 16.4 Performance Tests

**Metrics:**
- Parse time (cold/warm)
- Time to first swap
- Memory usage over time
- Event listener count

---

## 17. Bundle & Distribution

### 17.1 Build Outputs

| File | Format | Use Case |
|------|--------|----------|
| `pulse.js` | UMD | Script tag, AMD |
| `pulse.min.js` | UMD minified | Production script tag |
| `pulse.esm.js` | ES modules | Bundlers |
| `pulse.d.ts` | TypeScript | Type definitions |

### 17.2 Build Tools

- **Bundler:** Rollup (smaller output than webpack)
- **Minifier:** Terser
- **Types:** TypeScript compiler
- **Tests:** Vitest

### 17.3 CDN Distribution

```html
<!-- Recommended: specific version -->
<script src="https://unpkg.com/pulse-js@1.0.0/dist/pulse.min.js"></script>

<!-- Latest (not recommended for production) -->
<script src="https://unpkg.com/pulse-js/dist/pulse.min.js"></script>
```

### 17.4 NPM Package

```json
{
  "name": "pulse-js",
  "main": "dist/pulse.js",
  "module": "dist/pulse.esm.js",
  "types": "dist/pulse.d.ts",
  "exports": {
    ".": {
      "import": "./dist/pulse.esm.js",
      "require": "./dist/pulse.js"
    }
  }
}
```

---

## 18. Migration Guide

### 18.1 From HTMX

**Step 1: Replace Attributes**

Use search/replace patterns:
```
hx-get="URL" → p-request="GET URL"
hx-post="URL" → p-request="POST URL"
hx-target="SEL" → (merge into p-request)
hx-swap="VAL" → (convert to behavior)
```

**Step 2: Combine Attributes**

Before:
```html
<button hx-get="/url" hx-target="#list" hx-swap="beforeend">
```

After:
```html
<button p-request="GET /url > #list.append">
```

**Step 3: Convert Swap Values**

| HTMX | Pulse |
|------|-------|
| `innerHTML` | `replace` (default) |
| `outerHTML` | `outer` |
| `beforeend` | `append` |
| `afterbegin` | `prepend` |
| `beforebegin` | `before` |
| `afterend` | `after` |

**Step 4: Update Headers**

| HTMX Header | Pulse Header |
|-------------|--------------|
| `HX-Request` | `P-Request` |
| `HX-Target` | `P-Target` |
| `HX-Trigger` | `P-Trigger` |
| etc. | etc. |

### 18.2 Codemod Tool (Future)

Automated migration tool to convert HTMX → Pulse.

---

## 19. Future Considerations

### 19.1 Version 2 Features

| Feature | Priority | Complexity |
|---------|----------|------------|
| WebSocket support | High | Medium |
| SSE support | High | Medium |
| Extension/plugin system | Medium | High |
| Morphing (idiomorph) | Medium | Medium |
| Preloading | Low | Low |
| Optimistic UI helpers | Low | Medium |

### 19.2 Potential Optimizations

- Web Worker for parsing
- WASM parser for complex documents
- Service Worker for request caching
- Streaming response processing

### 19.3 Ecosystem

- Browser DevTools extension
- VS Code extension (autocomplete)
- Server framework integrations (Go, PHP, Ruby, Python)
- Documentation site
- Example gallery

---

## Appendix A: Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultSwap` | string | `"replace"` | Default swap behavior |
| `defaultTarget` | string | `"this"` | Default target |
| `timeout` | number | `0` | Request timeout (0 = none) |
| `historyEnabled` | boolean | `true` | Enable history management |
| `historyCacheSize` | number | `10` | LRU cache size |
| `refreshOnHistoryMiss` | boolean | `false` | Reload on cache miss |
| `scrollBehavior` | string | `"instant"` | Scroll animation |
| `selfRequestsOnly` | boolean | `true` | Same-origin only |
| `allowScriptTags` | boolean | `true` | Execute scripts in responses |
| `allowEval` | boolean | `true` | Allow filter expressions |
| `globalViewTransitions` | boolean | `false` | Use View Transitions API |
| `indicatorClass` | string | `"pulse-indicator"` | Indicator class name |
| `requestClass` | string | `"pulse-request"` | Request class name |
| `defaultSwapDelay` | number | `0` | Swap delay ms |
| `defaultSettleDelay` | number | `20` | Settle delay ms |
| `withCredentials` | boolean | `false` | Include credentials |

---

## Appendix B: CSS Classes

| Class | Applied To | When |
|-------|------------|------|
| `pulse-request` | Element + indicator | During request |
| `pulse-swapping` | Target | During swap |
| `pulse-settling` | Target | After swap, before settle |
| `pulse-added` | New elements | After insert, before settle |

---

## Appendix C: Response Headers

| Header | Type | Description |
|--------|------|-------------|
| `P-Redirect` | URL | Redirect to URL |
| `P-Refresh` | boolean | Full page refresh |
| `P-Retarget` | selector | Override target |
| `P-Reswap` | behavior | Override swap |
| `P-Reselect` | selector | Override select |
| `P-Push` | URL | Push to history |
| `P-Replace` | URL | Replace in history |
| `P-Trigger` | event/JSON | Trigger events |
| `P-Trigger-After-Swap` | event/JSON | Trigger after swap |
| `P-Trigger-After-Settle` | event/JSON | Trigger after settle |

---

## Appendix D: Request Headers

| Header | Value | Description |
|--------|-------|-------------|
| `P-Request` | `true` | Identifies Pulse request |
| `P-Current-URL` | URL | Current page URL |
| `P-Target` | ID | Target element ID |
| `P-Trigger` | ID | Triggering element ID |
| `P-Trigger-Name` | name | Triggering element name |
| `P-Boosted` | `true` | If request was boosted |
| `P-Prompt` | string | Prompt response value |
| `P-History-Restore-Request` | `true` | If history restore |

---

*Document Version: 1.0*
*Last Updated: 2025*
