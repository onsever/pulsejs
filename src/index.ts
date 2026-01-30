import type { PulseConfig, PulseExtension } from './types';
import { DEFAULT_CONFIG } from './constants';
import { init } from './engine/init';
import { setConfig, getConfig } from './engine/config';
import { processTree } from './engine/process';
import { parseRequest } from './parsers/request';
import { parseTrigger } from './parsers/trigger';
import {
  ajax, swap, trigger, on, off,
  find, findAll, closest,
  addClass, removeClass, toggleClass,
  remove, values,
} from './api';
import { defineExtension, removeExtension } from './extensions/index';

const Pulse = {
  version: '__VERSION__',

  init(config?: Partial<PulseConfig>): void {
    init(config);
  },

  config(overrides: Partial<PulseConfig>): void {
    setConfig(overrides);
  },

  process(root: Element | Document = document): void {
    processTree(root);
  },

  // JS API (Feature 1)
  ajax,
  swap,
  trigger,
  on,
  off,
  find,
  findAll,
  closest,
  addClass,
  removeClass,
  toggleClass,
  remove,
  values,

  // Extension system (Feature 7)
  defineExtension(name: string, ext: PulseExtension): void {
    defineExtension(name, ext, {
      getConfig,
      setConfig,
      processTree,
    });
  },
  removeExtension,

  _internal: {
    parseRequest,
    parseTrigger,
  },
};

// Auto-init on DOMContentLoaded
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Pulse.init());
  } else {
    queueMicrotask(() => Pulse.init());
  }
}

// UMD global
if (typeof window !== 'undefined') {
  (window as any).Pulse = Pulse;
}

export default Pulse;
export { Pulse };
export type {
  PulseConfig,
  ParsedRequest,
  ParsedBody,
  ParsedTarget,
  ParsedModifier,
  ParsedTrigger,
  ParsedTriggerEvent,
  TriggerModifiers,
  SwapBehavior,
  HttpMethod,
  PulseExtension,
  PulseInternalAPI,
  ResponseHandlingConfig,
} from './types';
