import * as vscode from 'vscode';
import { findAllAttributes } from './utils';
import { parseRequest } from '../../src/parsers/request';
import { parseTrigger } from '../../src/parsers/trigger';
import { ParseError } from '../../src/parsers/scanner';

const KNOWN_MODIFIERS = new Set([
  'confirm', 'prompt', 'validate', 'disable', 'indicator',
  'sync', 'timeout', 'multipart', 'transition', 'scroll',
  'select', 'oob', 'preserve', 'swap', 'settle',
]);

const VALID_HISTORY = new Set(['push', 'replace', 'false']);
const VALID_BOOST = new Set(['true', 'false']);
const VALID_OOB = new Set(['true', 'replace', 'outer', 'append', 'prepend', 'before', 'after']);
const VALID_INHERIT_ATTRS = new Set(['false', 'p-request', 'p-trigger', 'p-on', 'p-history', 'p-boost', 'p-oob', 'p-inherit', 'p-ignore']);

const KNOWN_ON_EVENTS = new Set([
  'before', 'beforeSend', 'beforeSwap',
  'afterSwap', 'afterSettle', 'error', 'confirm',
  'pulse:before', 'pulse:beforeSend', 'pulse:beforeSwap',
  'pulse:afterSwap', 'pulse:afterSettle', 'pulse:error', 'pulse:confirm',
]);

interface ModifierRule {
  requiresValue: boolean;
  type?: 'number' | 'string' | 'enum';
  enum?: string[];
}

const MODIFIER_RULES: Record<string, ModifierRule> = {
  confirm: { requiresValue: true, type: 'string' },
  prompt: { requiresValue: true, type: 'string' },
  validate: { requiresValue: false },
  disable: { requiresValue: false },
  indicator: { requiresValue: true, type: 'string' },
  sync: { requiresValue: true, type: 'enum', enum: ['abort', 'drop', 'queue'] },
  timeout: { requiresValue: true, type: 'number' },
  multipart: { requiresValue: false },
  transition: { requiresValue: false },
  scroll: { requiresValue: false },
  select: { requiresValue: true, type: 'string' },
  oob: { requiresValue: false },
  preserve: { requiresValue: false },
  swap: { requiresValue: true, type: 'number' },
  settle: { requiresValue: true, type: 'number' },
};

export function setupDiagnostics(context: vscode.ExtensionContext): vscode.DiagnosticCollection {
  const collection = vscode.languages.createDiagnosticCollection('pulse');
  context.subscriptions.push(collection);

  let timeout: ReturnType<typeof setTimeout> | undefined;

  const update = (document: vscode.TextDocument) => {
    const supported = ['html', 'php', 'blade', 'ejs', 'erb', 'handlebars', 'twig', 'gohtml', 'go-template'];
    if (!supported.includes(document.languageId)) return;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => runDiagnostics(document, collection), 300);
  };

  // Run on open and change
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(e => update(e.document)),
    vscode.workspace.onDidOpenTextDocument(update),
    vscode.workspace.onDidCloseTextDocument(doc => collection.delete(doc.uri)),
  );

  // Run on already open documents
  vscode.workspace.textDocuments.forEach(update);

  return collection;
}

function runDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection) {
  const text = document.getText();
  const attrs = findAllAttributes(text);
  const diagnostics: vscode.Diagnostic[] = [];

  for (const attr of attrs) {
    const { attrName, value, valueStartOffset } = attr;
    if (!value.trim()) continue;

    try {
      if (attrName === 'p-request') {
        validateRequest(document, value, valueStartOffset, diagnostics);
      } else if (attrName === 'p-trigger') {
        parseTrigger(value);
      } else if (attrName === 'p-history') {
        validateEnum(document, value, valueStartOffset, VALID_HISTORY, 'p-history', 'push, replace, or false', diagnostics);
      } else if (attrName === 'p-boost') {
        validateEnum(document, value, valueStartOffset, VALID_BOOST, 'p-boost', 'true or false', diagnostics);
      } else if (attrName === 'p-oob') {
        validateEnum(document, value, valueStartOffset, VALID_OOB, 'p-oob', 'true, replace, outer, append, prepend, before, or after', diagnostics);
      } else if (attrName === 'p-on') {
        validateOn(document, value, valueStartOffset, diagnostics);
      } else if (attrName === 'p-inherit') {
        validateInherit(document, value, valueStartOffset, diagnostics);
      } else if (attrName === 'p-ignore') {
        if (value.trim()) {
          const start = document.positionAt(valueStartOffset);
          const end = document.positionAt(valueStartOffset + value.length);
          diagnostics.push(new vscode.Diagnostic(
            new vscode.Range(start, end),
            `p-ignore should not have a value. Use as a bare attribute: p-ignore`,
            vscode.DiagnosticSeverity.Warning,
          ));
        }
      }
    } catch (err) {
      if (err instanceof ParseError) {
        const start = document.positionAt(valueStartOffset + err.position);
        const end = document.positionAt(valueStartOffset + Math.min(err.position + 1, value.length));
        const diag = new vscode.Diagnostic(
          new vscode.Range(start, end),
          err.message,
          vscode.DiagnosticSeverity.Error,
        );
        if (err.hint) diag.message += ` (Hint: ${err.hint})`;
        diagnostics.push(diag);
      }
    }
  }

  collection.set(document.uri, diagnostics);
}

function validateEnum(
  document: vscode.TextDocument,
  value: string,
  valueStartOffset: number,
  validSet: Set<string>,
  attrName: string,
  expected: string,
  diagnostics: vscode.Diagnostic[],
) {
  if (!validSet.has(value.trim())) {
    const start = document.positionAt(valueStartOffset);
    const end = document.positionAt(valueStartOffset + value.length);
    diagnostics.push(new vscode.Diagnostic(
      new vscode.Range(start, end),
      `Invalid ${attrName} value: "${value.trim()}". Expected: ${expected}`,
      vscode.DiagnosticSeverity.Warning,
    ));
  }
}

function validateRequest(
  document: vscode.TextDocument,
  value: string,
  valueStartOffset: number,
  diagnostics: vscode.Diagnostic[],
) {
  const parsed = parseRequest(value);

  // Check for unknown modifiers
  const seenModifiers = new Set<string>();
  for (const mod of parsed.modifiers) {
    if (!KNOWN_MODIFIERS.has(mod.name)) {
      const modIdx = value.indexOf(':' + mod.name);
      if (modIdx !== -1) {
        const start = document.positionAt(valueStartOffset + modIdx + 1);
        const end = document.positionAt(valueStartOffset + modIdx + 1 + mod.name.length);
        diagnostics.push(new vscode.Diagnostic(
          new vscode.Range(start, end),
          `Unknown modifier: "${mod.name}"`,
          vscode.DiagnosticSeverity.Warning,
        ));
      }
    }

    // Check for duplicate modifiers
    if (seenModifiers.has(mod.name)) {
      const modIdx = value.lastIndexOf(':' + mod.name);
      if (modIdx !== -1) {
        const start = document.positionAt(valueStartOffset + modIdx + 1);
        const end = document.positionAt(valueStartOffset + modIdx + 1 + mod.name.length);
        diagnostics.push(new vscode.Diagnostic(
          new vscode.Range(start, end),
          `Duplicate modifier: "${mod.name}"`,
          vscode.DiagnosticSeverity.Warning,
        ));
      }
    }
    seenModifiers.add(mod.name);

    // Validate modifier values
    const rule = MODIFIER_RULES[mod.name];
    if (!rule) continue;

    if (rule.requiresValue && !mod.value) {
      const modIdx = value.indexOf(':' + mod.name);
      if (modIdx !== -1) {
        const start = document.positionAt(valueStartOffset + modIdx + 1);
        const end = document.positionAt(valueStartOffset + modIdx + 1 + mod.name.length);
        diagnostics.push(new vscode.Diagnostic(
          new vscode.Range(start, end),
          `Modifier "${mod.name}" requires a value: :${mod.name}(value)`,
          vscode.DiagnosticSeverity.Error,
        ));
      }
    }

    if (mod.value && rule.type === 'number' && !/^\d+$/.test(mod.value)) {
      const modIdx = value.indexOf(':' + mod.name);
      if (modIdx !== -1) {
        const start = document.positionAt(valueStartOffset + modIdx + 1);
        const end = document.positionAt(valueStartOffset + modIdx + 1 + mod.name.length + mod.value.length + 2);
        diagnostics.push(new vscode.Diagnostic(
          new vscode.Range(start, end),
          `Modifier "${mod.name}" expects a number, got "${mod.value}"`,
          vscode.DiagnosticSeverity.Error,
        ));
      }
    }

    if (mod.value && rule.type === 'enum' && rule.enum && !rule.enum.includes(mod.value)) {
      const modIdx = value.indexOf(':' + mod.name);
      if (modIdx !== -1) {
        const start = document.positionAt(valueStartOffset + modIdx + 1);
        const end = document.positionAt(valueStartOffset + modIdx + 1 + mod.name.length + mod.value.length + 2);
        diagnostics.push(new vscode.Diagnostic(
          new vscode.Range(start, end),
          `Invalid value for :${mod.name}. Expected: ${rule.enum.join(', ')}`,
          vscode.DiagnosticSeverity.Error,
        ));
      }
    }
  }
}

function validateOn(
  document: vscode.TextDocument,
  value: string,
  valueStartOffset: number,
  diagnostics: vscode.Diagnostic[],
) {
  // p-on syntax: "event: handler() | event: handler()"
  const pairs = value.split('|');
  for (const pair of pairs) {
    const trimmed = pair.trim();
    if (!trimmed) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) {
      // Missing colon — likely a bare event name without handler
      const pairStart = value.indexOf(trimmed);
      const start = document.positionAt(valueStartOffset + pairStart);
      const end = document.positionAt(valueStartOffset + pairStart + trimmed.length);
      diagnostics.push(new vscode.Diagnostic(
        new vscode.Range(start, end),
        `Expected "event: handler()" syntax`,
        vscode.DiagnosticSeverity.Warning,
      ));
      continue;
    }
    const eventName = trimmed.slice(0, colonIdx).trim();
    if (eventName && !KNOWN_ON_EVENTS.has(eventName)) {
      const pairStart = value.indexOf(trimmed);
      const start = document.positionAt(valueStartOffset + pairStart);
      const end = document.positionAt(valueStartOffset + pairStart + eventName.length);
      diagnostics.push(new vscode.Diagnostic(
        new vscode.Range(start, end),
        `Unknown event: "${eventName}". Known events: ${[...KNOWN_ON_EVENTS].join(', ')}`,
        vscode.DiagnosticSeverity.Warning,
      ));
    }
  }
}

function validateInherit(
  document: vscode.TextDocument,
  value: string,
  valueStartOffset: number,
  diagnostics: vscode.Diagnostic[],
) {
  const trimmed = value.trim();
  // "false" disables all inheritance
  if (trimmed === 'false') return;
  // Otherwise it should be a space-separated list of attribute names
  const parts = trimmed.split(/\s+/);
  for (const part of parts) {
    if (!VALID_INHERIT_ATTRS.has(part)) {
      const partIdx = value.indexOf(part);
      const start = document.positionAt(valueStartOffset + partIdx);
      const end = document.positionAt(valueStartOffset + partIdx + part.length);
      diagnostics.push(new vscode.Diagnostic(
        new vscode.Range(start, end),
        `Unknown attribute "${part}" in p-inherit. Expected: false or pulse attribute names (p-request, p-trigger, etc.)`,
        vscode.DiagnosticSeverity.Warning,
      ));
    }
  }
}
