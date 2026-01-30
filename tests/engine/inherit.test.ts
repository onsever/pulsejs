import { describe, it, expect, beforeEach } from 'vitest';
import { resolveInheritance } from '../../src/engine/inherit';

describe('resolveInheritance', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns empty headers and null boost for element with no ancestors', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    const result = resolveInheritance(el);
    expect(result.headers).toEqual({});
    expect(result.boost).toBeNull();
  });

  it('inherits headers from ancestor p-request', () => {
    document.body.innerHTML = `
      <div p-request="{'X-Token': '123'} GET /api">
        <button id="child" p-request="GET /items"></button>
      </div>
    `;
    const child = document.getElementById('child')!;
    const result = resolveInheritance(child);

    expect(result.headers).toEqual({ 'X-Token': '123' });
  });

  it('closer ancestor headers override farther ones', () => {
    document.body.innerHTML = `
      <div p-request="{'X-Token': 'outer'} GET /api">
        <div p-request="{'X-Token': 'inner'} GET /api">
          <button id="child" p-request="GET /items"></button>
        </div>
      </div>
    `;
    const child = document.getElementById('child')!;
    const result = resolveInheritance(child);

    expect(result.headers['X-Token']).toBe('inner');
  });

  it('stops at p-inherit="false" boundary', () => {
    document.body.innerHTML = `
      <div p-request="{'X-Token': '123'} GET /api">
        <div p-inherit="false">
          <button id="child" p-request="GET /items"></button>
        </div>
      </div>
    `;
    const child = document.getElementById('child')!;
    const result = resolveInheritance(child);

    expect(result.headers).toEqual({});
  });

  it('respects p-inherit allow-list', () => {
    document.body.innerHTML = `
      <div p-request="{'X-Token': '123'} GET /api" p-boost>
        <div p-inherit="p-request">
          <button id="child" p-request="GET /items"></button>
        </div>
      </div>
    `;
    const child = document.getElementById('child')!;
    const result = resolveInheritance(child);

    // p-request is allowed, so headers should pass through
    expect(result.headers).toEqual({ 'X-Token': '123' });
  });

  it('inherits p-boost from ancestor', () => {
    document.body.innerHTML = `
      <div p-boost>
        <button id="child" p-request="GET /items"></button>
      </div>
    `;
    const child = document.getElementById('child')!;
    const result = resolveInheritance(child);

    expect(result.boost).toBe(true);
  });

  it('p-boost="false" sets boost to false', () => {
    document.body.innerHTML = `
      <div p-boost="false">
        <button id="child" p-request="GET /items"></button>
      </div>
    `;
    const child = document.getElementById('child')!;
    const result = resolveInheritance(child);

    expect(result.boost).toBe(false);
  });

  it('merges headers from multiple ancestors', () => {
    document.body.innerHTML = `
      <div p-request="{'X-A': '1'} GET /api">
        <div p-request="{'X-B': '2'} GET /api">
          <button id="child" p-request="GET /items"></button>
        </div>
      </div>
    `;
    const child = document.getElementById('child')!;
    const result = resolveInheritance(child);

    expect(result.headers).toEqual({ 'X-A': '1', 'X-B': '2' });
  });
});
