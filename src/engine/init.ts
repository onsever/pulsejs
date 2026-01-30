import type { PulseConfig } from '../types';
import { getConfig, setConfig, resetConfig, mergeMetaConfig } from './config';
import { processTree } from './process';
import { setupObserver } from './observer';
import { setupBoost } from '../boost/setup';
import { setupPopstateHandler } from '../history/manager';
import { emit } from '../events/emitter';

let initialized = false;
let boostCleanup: (() => void) | null = null;

export { getConfig, setConfig } from './config';

export function init(userConfig?: Partial<PulseConfig>): void {
  if (initialized) return;

  resetConfig();
  mergeMetaConfig();
  if (userConfig) setConfig(userConfig);

  const config = getConfig();

  processTree(document);
  setupObserver();
  boostCleanup = setupBoost();

  if (config.historyEnabled) {
    setupPopstateHandler(config);
  }

  initialized = true;
  emit(document, 'pulse:ready', { element: document.documentElement }, false);
}
