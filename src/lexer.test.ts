import { expect, test } from 'bun:test'
import { Lexer } from './lexer'
import { TokenType, type Token } from './token'

test('Lexer generates tokens correctly', () => {
  const src = '1 + 3.     * 4.0_3'
  const lexer = new Lexer(src)
  const tokens: Token[] = [
    {
      tokenType: TokenType.NUMBER,
      literal: '1',
    },
    {
      tokenType: TokenType.PLUS,
      literal: '+',
    },
    {
      tokenType: TokenType.NUMBER,
      literal: '3.',
    },
    {
      tokenType: TokenType.ASTERISK,
      literal: '*',
    },
    {
      tokenType: TokenType.NUMBER,
      literal: '4.0_3',
    },
  ]
  for (const token of tokens) {
    const nextToken = lexer.next()
    expect(nextToken).toEqual(token)
  }
})

test('Lexer generates identifier tokens', () => {
  const input = 'foobar = 2.0 + 3.0 * Math.PI<2 + foo'
  const lexer = new Lexer(input)
  const tokens: Token[] = [
    {
      tokenType: TokenType.IDENT,
      literal: 'foobar',
    },
    {
      tokenType: TokenType.EQ,
      literal: '=',
    },
    {
      tokenType: TokenType.NUMBER,
      literal: '2.0',
    },
    {
      tokenType: TokenType.PLUS,
      literal: '+',
    },
    {
      tokenType: TokenType.NUMBER,
      literal: '3.0',
    },
    {
      tokenType: TokenType.ASTERISK,
      literal: '*',
    },
    {
      tokenType: TokenType.IDENT,
      literal: 'Math',
    },
    {
      tokenType: TokenType.DOT,
      literal: '.',
    },
    {
      tokenType: TokenType.IDENT,
      literal: 'PI',
    },
    {
      tokenType: TokenType.LT,
      literal: '<',
    },
    {
      tokenType: TokenType.NUMBER,
      literal: '2',
    },
    {
      tokenType: TokenType.PLUS,
      literal: '+',
    },
    {
      tokenType: TokenType.IDENT,
      literal: 'foo',
    },
  ]

  for (const token of tokens) {
    const nextToken = lexer.next()
    expect(nextToken).toEqual(token)
  }
})

test('Lexer generates string tokens correctly', () => {
  const input = 'foobar = "foo"\nbarFoo = \'bar\''
  const lexer = new Lexer(input)
  const tokens: Token[] = [
    { tokenType: TokenType.IDENT, literal: 'foobar' },
    { tokenType: TokenType.EQ, literal: '=' },
    { tokenType: TokenType.STRING, literal: 'foo' },
    { tokenType: TokenType.IDENT, literal: 'barFoo' },
    { tokenType: TokenType.EQ, literal: '=' },
    { tokenType: TokenType.STRING, literal: 'bar' },
  ]
  for (const token of tokens) {
    const nextToken = lexer.next()
    expect(nextToken).toEqual(token)
  }
})

test('Lexer generates tokens for a function correctly', () => {
  const input = `
function sum(a, b) {
  return a + b
}

// calculating the sum
let c = sum(2, 3)
/**
 * This is a multi line comment
 */
if (c >= 4) {
  console.log("sum is greater than 4");
} else {
  console.error('sum is less than 4');
}
// last comment
`

  const lexer = new Lexer(input)
  const tokens: Token[] = [
    { tokenType: TokenType.FUNC, literal: 'function' },
    { tokenType: TokenType.IDENT, literal: 'sum' },
    { tokenType: TokenType.L_PAREN, literal: '(' },
    { tokenType: TokenType.IDENT, literal: 'a' },
    { tokenType: TokenType.COMMA, literal: ',' },
    { tokenType: TokenType.IDENT, literal: 'b' },
    { tokenType: TokenType.R_PAREN, literal: ')' },
    { tokenType: TokenType.L_BRACE, literal: '{' },
    { tokenType: TokenType.RETURN, literal: 'return' },
    { tokenType: TokenType.IDENT, literal: 'a' },
    { tokenType: TokenType.PLUS, literal: '+' },
    { tokenType: TokenType.IDENT, literal: 'b' },
    { tokenType: TokenType.R_BRACE, literal: '}' },
    { tokenType: TokenType.LET, literal: 'let' },
    { tokenType: TokenType.IDENT, literal: 'c' },
    { tokenType: TokenType.EQ, literal: '=' },
    { tokenType: TokenType.IDENT, literal: 'sum' },
    { tokenType: TokenType.L_PAREN, literal: '(' },
    { tokenType: TokenType.NUMBER, literal: '2' },
    { tokenType: TokenType.COMMA, literal: ',' },
    { tokenType: TokenType.NUMBER, literal: '3' },
    { tokenType: TokenType.R_PAREN, literal: ')' },
    { tokenType: TokenType.IF, literal: 'if' },
    { tokenType: TokenType.L_PAREN, literal: '(' },
    { tokenType: TokenType.IDENT, literal: 'c' },
    { tokenType: TokenType.GT, literal: '>' },
    { tokenType: TokenType.EQ, literal: '=' },
    { tokenType: TokenType.NUMBER, literal: '4' },
    { tokenType: TokenType.R_PAREN, literal: ')' },
    { tokenType: TokenType.L_BRACE, literal: '{' },
    { tokenType: TokenType.IDENT, literal: 'console' },
    { tokenType: TokenType.DOT, literal: '.' },
    { tokenType: TokenType.IDENT, literal: 'log' },
    { tokenType: TokenType.L_PAREN, literal: '(' },
    { tokenType: TokenType.STRING, literal: 'sum is greater than 4' },
    { tokenType: TokenType.R_PAREN, literal: ')' },
    { tokenType: TokenType.SEMI, literal: ';' },
    { tokenType: TokenType.R_BRACE, literal: '}' },
    { tokenType: TokenType.ELSE, literal: 'else' },
    { tokenType: TokenType.L_BRACE, literal: '{' },
    { tokenType: TokenType.IDENT, literal: 'console' },
    { tokenType: TokenType.DOT, literal: '.' },
    { tokenType: TokenType.IDENT, literal: 'error' },
    { tokenType: TokenType.L_PAREN, literal: '(' },
    { tokenType: TokenType.STRING, literal: 'sum is less than 4' },
    { tokenType: TokenType.R_PAREN, literal: ')' },
    { tokenType: TokenType.SEMI, literal: ';' },
    { tokenType: TokenType.R_BRACE, literal: '}' },
    { tokenType: TokenType.EOF, literal: '' },
  ]

  for (const token of tokens) {
    const nextToken = lexer.next()
    expect(nextToken).toEqual(token)
  }
})
