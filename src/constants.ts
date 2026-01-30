import type { PulseConfig, SwapBehavior, HttpMethod } from './types';

export const ATTRS = {
  REQUEST: 'p-request',
  TRIGGER: 'p-trigger',
  ON: 'p-on',
  HISTORY: 'p-history',
  BOOST: 'p-boost',
  OOB: 'p-oob',
  IGNORE: 'p-ignore',
  INHERIT: 'p-inherit',
} as const;

export const ALL_ATTRS = Object.values(ATTRS);

export const CSS = {
  REQUEST: 'pulse-request',
  SWAPPING: 'pulse-swapping',
  SETTLING: 'pulse-settling',
  ADDED: 'pulse-added',
  INDICATOR: 'pulse-indicator',
} as const;

export const HEADERS = {
  REQUEST: 'P-Request',
  CURRENT_URL: 'P-Current-URL',
  TARGET: 'P-Target',
  TRIGGER: 'P-Trigger',
  TRIGGER_NAME: 'P-Trigger-Name',
  BOOSTED: 'P-Boosted',
  PROMPT: 'P-Prompt',
  HISTORY_RESTORE: 'P-History-Restore-Request',
} as const;

export const RESPONSE_HEADERS = {
  REDIRECT: 'P-Redirect',
  REFRESH: 'P-Refresh',
  RETARGET: 'P-Retarget',
  RESWAP: 'P-Reswap',
  RESELECT: 'P-Reselect',
  PUSH: 'P-Push',
  REPLACE: 'P-Replace',
  TRIGGER: 'P-Trigger',
  TRIGGER_AFTER_SWAP: 'P-Trigger-After-Swap',
  TRIGGER_AFTER_SETTLE: 'P-Trigger-After-Settle',
  LOCATION: 'P-Location',
} as const;

export const BEHAVIORS: SwapBehavior[] = [
  'replace', 'outer', 'append', 'prepend', 'before', 'after', 'remove', 'none',
];

export const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

export const DEFAULT_TRIGGERS: Record<string, string> = {
  INPUT: 'input',
  TEXTAREA: 'input',
  SELECT: 'change',
  FORM: 'submit',
  A: 'click',
  BUTTON: 'click',
};

export const DEFAULT_CONFIG: PulseConfig = {
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
  responseHandling: [
    { code: '2xx', swap: true, error: false, ignoreTitle: false, select: '', target: '' },
    { code: '4xx', swap: false, error: true, ignoreTitle: false, select: '', target: '' },
    { code: '5xx', swap: false, error: true, ignoreTitle: false, select: '', target: '' },
  ],
};
