import { match } from 'ts-pattern'
import type { TokenType } from './token'

type BaseExpression = {
  type: 'expression'
}

export type Identifier = BaseExpression & {
  expressionType: 'identifier'
  value: string
}
export type Number = BaseExpression & {
  expressionType: 'number'
  value: number
}
export type String = BaseExpression & {
  expressionType: 'string'
  value: string
}
export type PrefixExpression = BaseExpression & {
  expressionType: 'prefix'
  operator: string
  right: Expression
}
export type InfixExpression = BaseExpression & {
  expressionType: 'infix'
  left: Expression
  operator: string
  right: Expression
}
export type FunctionExpression = BaseExpression & {
  expressionType: 'function'
  functionName?: string
  parameters: Identifier[]
  body: BlockStatement
}
export type Expression = Identifier | Number | String | PrefixExpression | InfixExpression

type BaseStatement = {
  type: 'statement'
}

export type ExpressionStatement = BaseStatement & {
  statementType: 'expression'
  expression: Expression
}
export type LetStatement = BaseStatement & {
  statementType: 'let'
  tokenType: TokenType.LET | TokenType.VAR | TokenType.CONST
  identifier: Identifier
  expression: Expression
}
export type ReturnStatement = BaseStatement & {
  statementType: 'return'
  expression: Expression
}
export type BlockStatement = BaseStatement & {
  statementType: 'block'
  statements: Statement[]
}
export type FunctionStatement = BaseStatement & {
  statementType: 'function'
  functionName: string
  parameters: ParameterStatement[]
  body: BlockStatement
}
export type ParameterStatement = BaseStatement & {
  statementType: 'param'
  identifier: Identifier
  defaultValue?: Expression
  hasDotDotDot?: boolean
}
export type Statement =
  | ExpressionStatement
  | LetStatement
  | ReturnStatement
  | BlockStatement
  | FunctionStatement
  | ParameterStatement

export type Program = {
  type: 'program'
  statements: Statement[]
}

export type Node = Expression | Statement

export function print(node: Node): string {
  return match(node)
    .returnType<string>()
    .with({ type: 'statement' }, (statement) => printStatement(statement))
    .with({ type: 'expression' }, (expression) => printExpression(expression))
    .exhaustive()
}

function printStatement(statment: Statement): string {
  return match(statment)
    .returnType<string>()
    .with({ statementType: 'expression' }, ({ expression }) => printExpression(expression))
    .otherwise(() => '')
}

function printExpression(expression: Expression): string {
  return match(expression)
    .returnType<string>()
    .with({ expressionType: 'number' }, ({ value }) => `${value}`)
    .with({ expressionType: 'string' }, ({ value }) => value)
    .with({ expressionType: 'identifier' }, ({ value }) => value)
    .with({ expressionType: 'prefix' }, ({ operator, right }) => `(${operator}${printExpression(right)})`)
    .with(
      { expressionType: 'infix' },
      ({ operator, right, left }) => `(${printExpression(left)} ${operator} ${printExpression(right)})`,
    )
    .otherwise(() => '')
}
