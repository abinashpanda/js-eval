export enum TokenType {
  L_PAREN = '(',
  R_PAREN = ')',
  L_BRACE = '{',
  R_BRACE = '}',
  L_SQUARE = '[',
  R_SQUARE = ']',

  PLUS = '+',
  PLUS_PLUS = '++',
  MINUS = '-',
  MINUS_MINUS = '--',
  PERCENT = '%',
  SLASH = '/',
  ASTERISK = '*',
  CAP = '^',

  DOT = '.',
  DOT_DOT_DOT = '...',
  COMMA = ',',
  SEMI = ';',
  COLON = ':',

  STRING = 'STRING',
  NUMBER = 'NUMBER',
  IDENT = 'IDENT',

  EQ = '=',
  EQ_EQ = '==',
  EQ_EQ_EQ = '===',
  BANG = '!',
  NOT_EQ = '!=',
  NOT_EQ_EQ = '!==',
  LT = '<',
  GT = '>',

  CONST = 'const',
  LET = 'let',
  VAR = 'var',
  IF = 'if',
  ELSE = 'else',
  FUNC = 'func',
  RETURN = 'return',
  YIELD = 'yield',
  TRUE = 'true',
  FALSE = 'false',
  ASYNC = 'async',
  AWAIT = 'await',
  FOR = 'for',
  WHILE = 'while',
  DO = 'do',
  BREAK = 'break',
  CONTINUE = 'continue',

  SINGLE_LINE_COMMENT = '//',
  MULTI_LINE_COMMENT = '/*',

  EOF = 'EOF',
}

export interface Token {
  tokenType: TokenType
  literal: string
}

export const TOKEN_TYPE_IDENT_MAP: Record<string, TokenType> = {
  const: TokenType.CONST,
  let: TokenType.LET,
  var: TokenType.VAR,
  if: TokenType.IF,
  else: TokenType.ELSE,
  function: TokenType.FUNC,
  return: TokenType.RETURN,
  yield: TokenType.YIELD,
  true: TokenType.TRUE,
  false: TokenType.FALSE,
  async: TokenType.ASYNC,
  await: TokenType.AWAIT,
  for: TokenType.FOR,
  while: TokenType.WHILE,
  break: TokenType.BREAK,
  continue: TokenType.CONTINUE,
}

export enum Prec {
  LOWEST,
  LOGICAL,
  SUM,
  PRODUCT,
  PREFIX,
  CALL,
  PRIMARY,
}

export const TOKEN_PREC_MAP: Partial<Record<TokenType, number>> = {
  [TokenType.EQ_EQ]: Prec.LOGICAL,
  [TokenType.EQ_EQ_EQ]: Prec.LOGICAL,
  [TokenType.NOT_EQ]: Prec.LOGICAL,
  [TokenType.NOT_EQ_EQ]: Prec.LOGICAL,
  [TokenType.PLUS]: Prec.SUM,
  [TokenType.MINUS]: Prec.SUM,
  [TokenType.ASTERISK]: Prec.PRODUCT,
  [TokenType.SLASH]: Prec.PRODUCT,
  [TokenType.PERCENT]: Prec.PRODUCT,
  [TokenType.CAP]: Prec.PRODUCT,
  [TokenType.NUMBER]: Prec.PRIMARY,
  [TokenType.IDENT]: Prec.PRIMARY,
  [TokenType.STRING]: Prec.PRIMARY,
}
