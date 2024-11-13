import { test, expect } from 'bun:test'
import { Lexer } from './lexer'
import { Parser } from './parser'
import { print } from './ast'
import { TokenType } from './token'

test('Parser parses expression correctly', () => {
  const input = '2 + 3'
  const lexer = new Lexer(input)
  const parser = new Parser(lexer)
  const program = parser.parseProgram()
  expect(program.statements.length === 1)
  const statement = program.statements[0]
  expect(statement).toEqual({
    type: 'statement',
    statementType: 'expression',
    expression: {
      type: 'expression',
      expressionType: 'infix',
      operator: '+',
      left: {
        type: 'expression',
        expressionType: 'number',
        value: 2,
      },
      right: {
        type: 'expression',
        expressionType: 'number',
        value: 3,
      },
    },
  })
})

test('Parser parses precedence correctly', () => {
  const tests: { input: string; output: string }[] = [
    { input: '1 + 2 * 3', output: '(1 + (2 * 3))' },
    { input: '-1 * 3', output: '((-1) * 3)' },
    { input: '3 * -1', output: '(3 * (-1))' },
    { input: '1 + 2 * 3', output: '(1 + (2 * 3))' },
    { input: 'a + b / c %d - e', output: '((a + ((b / c) % d)) - e)' },
    { input: '(a + b) * c', output: '((a + b) * c)' },
    { input: 'a * (b + c) + (d + e)', output: '((a * (b + c)) + (d + e))' },
  ]
  for (const test of tests) {
    const lexer = new Lexer(test.input)
    const parser = new Parser(lexer)
    const program = parser.parseProgram()
    expect(program.statements.length === 1)
    expect(print(program.statements[0])).toEqual(test.output)
  }
})

test('Parser parses let statement correctly', () => {
  const input = `
const foo = 2;
let bar = "foobar";
`
  const lexer = new Lexer(input)
  const parser = new Parser(lexer)
  const program = parser.parseProgram()
  expect(program.statements).toEqual([
    {
      type: 'statement',
      statementType: 'let',
      tokenType: TokenType.CONST,
      identifier: {
        type: 'expression',
        expressionType: 'identifier',
        value: 'foo',
      },
      expression: {
        type: 'expression',
        expressionType: 'number',
        value: 2,
      },
    },
    {
      type: 'statement',
      statementType: 'let',
      tokenType: TokenType.LET,
      identifier: {
        type: 'expression',
        expressionType: 'identifier',
        value: 'bar',
      },
      expression: {
        type: 'expression',
        expressionType: 'string',
        value: 'foobar',
      },
    },
  ])
})

test('Parser parses return statements correctly', () => {
  const input = 'return 3 + "foobar";'
  const lexer = new Lexer(input)
  const parser = new Parser(lexer)
  const program = parser.parseProgram()
  expect(program.statements).toEqual([
    {
      type: 'statement',
      statementType: 'return',
      expression: {
        type: 'expression',
        expressionType: 'infix',
        operator: '+',
        left: {
          type: 'expression',
          expressionType: 'number',
          value: 3,
        },
        right: {
          type: 'expression',
          expressionType: 'string',
          value: 'foobar',
        },
      },
    },
  ])
})

test('Parser parses function statement correctly', () => {
  const input = `
function sum(a, b) {
  return a + b;
}

function product(a, b, multiplier = 1) {
  return a * b * multiplier
}

function consoleLog(prefix = "prefix", ...rest) {
}
`
  const lexer = new Lexer(input)
  const parser = new Parser(lexer)
  const program = parser.parseProgram()

  expect(program.statements).toEqual([
    {
      type: 'statement',
      statementType: 'function',
      functionName: 'sum',
      parameters: [
        {
          type: 'statement',
          statementType: 'param',
          identifier: {
            type: 'expression',
            expressionType: 'identifier',
            value: 'a',
          },
        },
        {
          type: 'statement',
          statementType: 'param',
          identifier: {
            type: 'expression',
            expressionType: 'identifier',
            value: 'b',
          },
        },
      ],
      body: {
        type: 'statement',
        statementType: 'block',
        statements: [
          {
            type: 'statement',
            statementType: 'return',
            expression: {
              type: 'expression',
              expressionType: 'infix',
              left: {
                type: 'expression',
                expressionType: 'identifier',
                value: 'a',
              },
              operator: '+',
              right: {
                type: 'expression',
                expressionType: 'identifier',
                value: 'b',
              },
            },
          },
        ],
      },
    },
    {
      type: 'statement',
      statementType: 'function',
      functionName: 'product',
      parameters: [
        {
          type: 'statement',
          statementType: 'param',
          identifier: {
            type: 'expression',
            expressionType: 'identifier',
            value: 'a',
          },
        },
        {
          type: 'statement',
          statementType: 'param',
          identifier: {
            type: 'expression',
            expressionType: 'identifier',
            value: 'b',
          },
        },
        {
          type: 'statement',
          statementType: 'param',
          identifier: {
            type: 'expression',
            expressionType: 'identifier',
            value: 'multiplier',
          },
          defaultValue: {
            type: 'expression',
            expressionType: 'number',
            value: 1,
          },
        },
      ],
      body: {
        type: 'statement',
        statementType: 'block',
        statements: [
          {
            type: 'statement',
            statementType: 'return',
            expression: {
              type: 'expression',
              expressionType: 'infix',
              operator: '*',
              left: {
                type: 'expression',
                expressionType: 'infix',
                operator: '*',
                left: {
                  type: 'expression',
                  expressionType: 'identifier',
                  value: 'a',
                },
                right: {
                  type: 'expression',
                  expressionType: 'identifier',
                  value: 'b',
                },
              },
              right: {
                type: 'expression',
                expressionType: 'identifier',
                value: 'multiplier',
              },
            },
          },
        ],
      },
    },
    {
      type: 'statement',
      statementType: 'function',
      functionName: 'consoleLog',
      parameters: [
        {
          type: 'statement',
          statementType: 'param',
          identifier: {
            type: 'expression',
            expressionType: 'identifier',
            value: 'prefix',
          },
          defaultValue: {
            type: 'expression',
            expressionType: 'string',
            value: 'prefix',
          },
        },
        {
          type: 'statement',
          statementType: 'param',
          identifier: {
            type: 'expression',
            expressionType: 'identifier',
            value: 'rest',
          },
          hasDotDotDot: true,
        },
      ],
      body: {
        type: 'statement',
        statementType: 'block',
        statements: [],
      },
    },
  ])
})
