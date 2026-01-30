// ── HTTP & Parsing Types ──

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type SwapBehavior =
  | 'replace'
  | 'outer'
  | 'append'
  | 'prepend'
  | 'before'
  | 'after'
  | 'remove'
  | 'none';

export interface ParsedModifier {
  name: string;
  value: string | null;
}

export interface ParsedTarget {
  selector: string; // 'this' for self-targeting
  behavior: SwapBehavior;
}

export interface ParsedBody {
  type: 'json' | 'selectors' | 'filter';
  data: Record<string, string> | null;
  selectors: string[] | null;
  filter: { mode: 'only' | 'not'; fields: string[] } | null;
}

export interface ParsedRequest {
  headers: Record<string, string>;
  method: HttpMethod;
  url: string;
  body: ParsedBody | null;
  target: ParsedTarget;
  modifiers: ParsedModifier[];
}

export interface ParsedTriggerEvent {
  name: string;
  isPolling: boolean;
  pollingInterval: number | null;
  filter: string | null;
  modifiers: TriggerModifiers;
  from: string | null;
}

export interface TriggerModifiers {
  once: boolean;
  changed: boolean;
  consume: boolean;
  debounce: number | null;
  throttle: number | null;
  delay: number | null;
}

export interface ParsedTrigger {
  events: ParsedTriggerEvent[];
}

// ── Element State ──

export interface TriggerInstance {
  type: 'event' | 'load' | 'revealed' | 'polling';
  cleanup: () => void;
}

export interface InheritedValues {
  headers: Record<string, string>;
  boost: boolean | null;
}

export interface QueuedRequest {
  context: RequestContext;
  resolve: () => void;
}

export interface ElementState {
  triggers: TriggerInstance[];
  parsedRequest: ParsedRequest | null;
  parsedTrigger: ParsedTrigger | null;
  inherited: InheritedValues;
  abortController: AbortController | null;
  lastValue: unknown;
  requestQueue: QueuedRequest[];
  onCleanup: (() => void) | null;
}

// ── Configuration ──

export interface PulseConfig {
  defaultSwap: SwapBehavior;
  defaultTarget: string;
  timeout: number;
  historyEnabled: boolean;
  historyCacheSize: number;
  refreshOnHistoryMiss: boolean;
  scrollBehavior: ScrollBehavior;
  selfRequestsOnly: boolean;
  allowScriptTags: boolean;
  allowEval: boolean;
  globalViewTransitions: boolean;
  indicatorClass: string;
  requestClass: string;
  defaultSwapDelay: number;
  defaultSettleDelay: number;
  withCredentials: boolean;
  ignoreTitle: boolean;
  inlineScriptNonce: string;
  responseHandling: ResponseHandlingConfig[];
}

// ── History ──

export interface HistoryCacheEntry {
  url: string;
  content: string;
  title: string;
  scrollPosition: { x: number; y: number };
  timestamp: number;
}

// ── Request Context ──

export interface RequestContext {
  element: Element;
  parsed: ParsedRequest;
  trigger: ParsedTriggerEvent | null;
  inherited: InheritedValues;
  abortController: AbortController;
  promptValue?: string;
  isBoosted?: boolean;
}

// ── Events ──

export interface PulseEventDetail {
  element: Element;
  request?: RequestContext;
  response?: Response;
  target?: Element;
  content?: DocumentFragment;
  error?: Error;
  successful?: boolean;
}

// ── Response Handling Config ──

export interface ResponseHandlingConfig {
  code: string;       // "200", "2xx", "404", "4xx", "5xx", "*"
  swap: boolean;
  error: boolean;
  ignoreTitle: boolean;
  select: string;
  target: string;
}

// ── Extension System ──

export interface PulseExtension {
  init?(api: PulseInternalAPI): void;
  onEvent?(name: string, event: CustomEvent): boolean;
  transformResponse?(text: string, xhr: Response, ctx: RequestContext): string;
  isInlineSwap?(behavior: SwapBehavior): boolean;
  handleSwap?(behavior: SwapBehavior, target: Element, fragment: DocumentFragment): boolean;
  encodeParameters?(xhr: Request, params: FormData, el: Element): FormData | null;
}

export interface PulseInternalAPI {
  getConfig(): PulseConfig;
  setConfig(overrides: Partial<PulseConfig>): void;
  processTree(root: Element | Document): void;
}

// ── Response Overrides ──

export interface ResponseOverrides {
  target?: string;
  behavior?: SwapBehavior;
  select?: string;
  pushUrl?: string;
  replaceUrl?: string;
}

// ── OOB Entry ──

export interface OOBEntry {
  selector: string;
  behavior: SwapBehavior;
  content: DocumentFragment;
}
