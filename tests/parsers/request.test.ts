import { describe, it, expect } from 'vitest';
import { parseRequest } from '../../src/parsers/request';

describe('parseRequest', () => {
  // Minimal cases
  it('parses a simple URL', () => {
    const r = parseRequest('/users');
    expect(r.method).toBe('GET');
    expect(r.url).toBe('/users');
    expect(r.target.selector).toBe('this');
    expect(r.target.behavior).toBe('replace');
  });

  it('parses method + URL', () => {
    const r = parseRequest('POST /users');
    expect(r.method).toBe('POST');
    expect(r.url).toBe('/users');
  });

  it('parses all methods', () => {
    for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const) {
      const r = parseRequest(`${method} /api`);
      expect(r.method).toBe(method);
    }
  });

  // Target + behavior
  it('parses target selector', () => {
    const r = parseRequest('GET /users > #list');
    expect(r.target.selector).toBe('#list');
    expect(r.target.behavior).toBe('replace');
  });

  it('parses target with behavior', () => {
    const r = parseRequest('GET /users > #list.append');
    expect(r.target.selector).toBe('#list');
    expect(r.target.behavior).toBe('append');
  });

  it('parses all behaviors', () => {
    const behaviors = ['replace', 'outer', 'append', 'prepend', 'before', 'after', 'remove', 'none'] as const;
    for (const b of behaviors) {
      const r = parseRequest(`GET /api > #el.${b}`);
      expect(r.target.behavior).toBe(b);
    }
  });

  it('parses target with closest', () => {
    const r = parseRequest('DELETE /item/1 > closest tr.outer');
    expect(r.target.selector).toBe('closest tr');
    expect(r.target.behavior).toBe('outer');
  });

  // Headers
  it('parses headers', () => {
    const r = parseRequest("{'X-CSRF': 'token'} POST /users");
    expect(r.headers).toEqual({ 'X-CSRF': 'token' });
    expect(r.method).toBe('POST');
    expect(r.url).toBe('/users');
  });

  it('parses multiple headers', () => {
    const r = parseRequest("{'X-CSRF': 'token', 'Accept': 'text/html'} GET /api");
    expect(r.headers['X-CSRF']).toBe('token');
    expect(r.headers['Accept']).toBe('text/html');
  });

  // Body
  it('parses JSON body', () => {
    const r = parseRequest("POST /users {'name': 'John'}");
    expect(r.body).not.toBeNull();
    expect(r.body!.type).toBe('json');
    expect(r.body!.data).toEqual({ name: 'John' });
  });

  it('parses selector body', () => {
    const r = parseRequest('POST /users {#form1}');
    expect(r.body!.type).toBe('selectors');
    expect(r.body!.selectors).toEqual(['#form1']);
  });

  it('parses multiple selector body', () => {
    const r = parseRequest('POST /users {#form1, #form2}');
    expect(r.body!.type).toBe('selectors');
    expect(r.body!.selectors).toEqual(['#form1', '#form2']);
  });

  it('parses this body', () => {
    const r = parseRequest('POST /users {this}');
    expect(r.body!.type).toBe('selectors');
    expect(r.body!.selectors).toEqual(['this']);
  });

  it('parses only filter body', () => {
    const r = parseRequest('POST /users {only name, email}');
    expect(r.body!.type).toBe('filter');
    expect(r.body!.filter).toEqual({ mode: 'only', fields: ['name', 'email'] });
  });

  it('parses not filter body', () => {
    const r = parseRequest('POST /users {not password}');
    expect(r.body!.type).toBe('filter');
    expect(r.body!.filter).toEqual({ mode: 'not', fields: ['password'] });
  });

  // Modifiers
  it('parses single modifier', () => {
    const r = parseRequest("GET /api :confirm('Sure?')");
    expect(r.modifiers).toHaveLength(1);
    expect(r.modifiers[0].name).toBe('confirm');
    expect(r.modifiers[0].value).toBe("'Sure?'");
  });

  it('parses multiple modifiers', () => {
    const r = parseRequest('GET /api :confirm :sync(abort) :timeout(5000)');
    expect(r.modifiers).toHaveLength(3);
    expect(r.modifiers[0].name).toBe('confirm');
    expect(r.modifiers[1].name).toBe('sync');
    expect(r.modifiers[1].value).toBe('abort');
    expect(r.modifiers[2].name).toBe('timeout');
    expect(r.modifiers[2].value).toBe('5000');
  });

  // Full syntax
  it('parses full complex syntax', () => {
    const r = parseRequest("{'X-CSRF': 'token'} POST /users {'name': 'John'} > #list.append :confirm('Sure?') :sync(abort)");
    expect(r.headers).toEqual({ 'X-CSRF': 'token' });
    expect(r.method).toBe('POST');
    expect(r.url).toBe('/users');
    expect(r.body!.type).toBe('json');
    expect(r.body!.data).toEqual({ name: 'John' });
    expect(r.target.selector).toBe('#list');
    expect(r.target.behavior).toBe('append');
    expect(r.modifiers).toHaveLength(2);
  });

  // Edge cases
  it('handles URL with query params', () => {
    const r = parseRequest('GET /search?q=test');
    expect(r.url).toBe('/search?q=test');
  });

  it('throws on empty input', () => {
    expect(() => parseRequest('')).toThrow();
  });

  // Default method is GET
  it('defaults to GET method', () => {
    const r = parseRequest('/api/data > #result');
    expect(r.method).toBe('GET');
  });
});
