import type { PulseConfig } from '../types';
import { DEFAULT_CONFIG } from '../constants';

let config: PulseConfig = { ...DEFAULT_CONFIG };

export function getConfig(): PulseConfig {
  return config;
}

export function setConfig(overrides: Partial<PulseConfig>): void {
  Object.assign(config, overrides);
}

export function resetConfig(base?: Partial<PulseConfig>): void {
  config = { ...DEFAULT_CONFIG, ...base };
}

export function mergeMetaConfig(): void {
  const meta = document.querySelector('meta[name="pulse-config"]');
  if (!meta) return;
  const content = meta.getAttribute('content');
  if (!content) return;
  try {
    Object.assign(config, JSON.parse(content));
  } catch {
    console.warn('Pulse: Invalid meta config JSON');
  }
}
