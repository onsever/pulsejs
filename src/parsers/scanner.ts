export class ParseError extends Error {
  constructor(
    message: string,
    public input: string,
    public position: number,
    public hint?: string,
  ) {
    super(message);
    this.name = 'PulseParseError';
  }

  format(): string {
    const lines = [
      `Pulse Parse Error: ${this.message}`,
      `  ${this.input}`,
      `  ${' '.repeat(this.position)}^`,
    ];
    if (this.hint) lines.push(`  Hint: ${this.hint}`);
    return lines.join('\n');
  }
}

export class Scanner {
  private pos = 0;
  public readonly input: string;

  constructor(input: string) {
    this.input = input.trim();
  }

  peek(): string {
    return this.input[this.pos] ?? '';
  }

  advance(): string {
    return this.input[this.pos++] ?? '';
  }

  match(str: string): boolean {
    if (this.input.startsWith(str, this.pos)) {
      this.pos += str.length;
      return true;
    }
    return false;
  }

  matchWord(word: string): boolean {
    if (
      this.input.startsWith(word, this.pos) &&
      (this.pos + word.length >= this.input.length ||
        /[\s>{:.\[\]]/.test(this.input[this.pos + word.length]))
    ) {
      this.pos += word.length;
      return true;
    }
    return false;
  }

  skipWhitespace(): void {
    while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) {
      this.pos++;
    }
  }

  isAtEnd(): boolean {
    return this.pos >= this.input.length;
  }

  remaining(): string {
    return this.input.slice(this.pos);
  }

  position(): number {
    return this.pos;
  }

  setPosition(pos: number): void {
    this.pos = pos;
  }

  readUntil(chars: string): string {
    const start = this.pos;
    while (this.pos < this.input.length && !chars.includes(this.input[this.pos])) {
      this.pos++;
    }
    return this.input.slice(start, this.pos);
  }

  readWhile(predicate: (ch: string) => boolean): string {
    const start = this.pos;
    while (this.pos < this.input.length && predicate(this.input[this.pos])) {
      this.pos++;
    }
    return this.input.slice(start, this.pos);
  }

  readBalanced(open: string, close: string): string {
    if (this.peek() !== open) return '';
    this.advance(); // consume open
    let depth = 1;
    const start = this.pos;
    while (this.pos < this.input.length && depth > 0) {
      const ch = this.input[this.pos];
      if (ch === open) depth++;
      else if (ch === close) depth--;
      if (depth > 0) this.pos++;
    }
    const content = this.input.slice(start, this.pos);
    if (depth === 0) this.advance(); // consume close
    return content;
  }

  expect(str: string): void {
    if (!this.match(str)) {
      this.error(`Expected '${str}'`);
    }
  }

  error(message: string, hint?: string): never {
    throw new ParseError(message, this.input, this.pos, hint);
  }
}
