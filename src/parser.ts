import { match, P } from 'ts-pattern'
import type {
  BlockStatement,
  Expression,
  ExpressionStatement,
  FunctionStatement,
  Identifier,
  InfixExpression,
  LetStatement,
  Number,
  ParameterStatement,
  PrefixExpression,
  Program,
  ReturnStatement,
  Statement,
  String,
} from './ast'
import type { Lexer } from './lexer'
import { Prec, TOKEN_PREC_MAP, TokenType, type Token } from './token'

type ParsePrefixFn = () => Expression
type ParseInfixFn = (left: Expression) => Expression

export class Parser {
  private prefixParseFns: Record<string, ParsePrefixFn> = {}
  private infixParseFns: Record<string, ParseInfixFn> = {}
  // @ts-expect-error as this has be initialized in the next() call in the constructor
  private currentToken: Token
  // @ts-expect-error as this has been initialized in the next() call in the constructor
  private peekToken: Token

  constructor(private readonly lexer: Lexer) {
    this.nextToken()
    this.nextToken()

    this.registerPrefix(TokenType.NUMBER, this.parseNumber.bind(this))
    this.registerPrefix(TokenType.STRING, this.parseString.bind(this))
    this.registerPrefix(TokenType.IDENT, this.parseIdent.bind(this))
    this.registerPrefix(TokenType.MINUS, this.parsePrefix.bind(this))
    this.registerPrefix(TokenType.L_PAREN, this.parseGroupedExpression.bind(this))

    this.registerInfix(TokenType.PLUS, this.parseInfix.bind(this))
    this.registerInfix(TokenType.MINUS, this.parseInfix.bind(this))
    this.registerInfix(TokenType.ASTERISK, this.parseInfix.bind(this))
    this.registerInfix(TokenType.SLASH, this.parseInfix.bind(this))
    this.registerInfix(TokenType.PERCENT, this.parseInfix.bind(this))
    this.registerInfix(TokenType.CAP, this.parseInfix.bind(this))
  }

  parseProgram(): Program {
    const program: Program = { type: 'program', statements: [] }
    while (this.peekToken.tokenType != TokenType.EOF) {
      const statement = this.parseStatement()
      program.statements.push(statement)
      this.nextToken()
    }
    return program
  }

  private parseStatement(): Statement {
    const statement = match(this.currentToken)
      .returnType<Statement>()
      .with(P.union({ tokenType: TokenType.LET }, { tokenType: TokenType.CONST }, { tokenType: TokenType.VAR }), () =>
        this.parseLetExpression(),
      )
      .with({ tokenType: TokenType.RETURN }, () => this.parseReturnStatement())
      .with({ tokenType: TokenType.FUNC }, () => this.parseFunctionStatement())
      .otherwise(() => this.parseExpressionStatement())
    if (this.peekToken.tokenType === TokenType.SEMI) {
      this.nextToken()
    }
    return statement
  }

  private parseLetExpression(): LetStatement {
    const tokenType = this.currentToken.tokenType
    if (tokenType !== TokenType.LET && tokenType !== TokenType.CONST && tokenType !== TokenType.VAR) {
      throw new Error(`unexpected token. got = ${tokenType}`)
    }
    this.expectPeek(TokenType.IDENT)
    const identifier = this.parseIdent()
    this.expectPeek(TokenType.EQ)
    this.nextToken()
    const expression = this.parseExpression(Prec.LOWEST)
    return { type: 'statement', statementType: 'let', tokenType, identifier, expression }
  }

  private parseReturnStatement(): ReturnStatement {
    this.nextToken()
    return { type: 'statement', statementType: 'return', expression: this.parseExpression(Prec.LOWEST) }
  }

  private parseFunctionStatement(): FunctionStatement {
    this.expectPeek(TokenType.IDENT)
    const functionName = this.currentToken.literal
    this.expectPeek(TokenType.L_PAREN)
    const parameters = this.parseFunctionParams()
    this.expectPeek(TokenType.L_BRACE)
    const body = this.parseBlockStatement()
    return { type: 'statement', statementType: 'function', functionName, parameters, body }
  }

  private parseFunctionParams(): ParameterStatement[] {
    this.nextToken()
    const identifiers: ParameterStatement[] = []

    let hasEncounteredRestToken = false

    while (this.currentToken.tokenType !== TokenType.EOF && this.currentToken.tokenType !== TokenType.R_PAREN) {
      if (this.currentToken.tokenType === TokenType.DOT_DOT_DOT) {
        hasEncounteredRestToken = true
        this.nextToken()
        const ident = this.parseIdent()
        const parameter: ParameterStatement = {
          type: 'statement',
          statementType: 'param',
          identifier: ident,
          hasDotDotDot: hasEncounteredRestToken,
        }
        identifiers.push(parameter)
        if (this.peekToken.tokenType === TokenType.EQ) {
          throw new Error(`rest parameter may not have a default initializer`)
        }
        this.nextToken()
      } else if (this.currentToken.tokenType === TokenType.IDENT) {
        if (hasEncounteredRestToken) {
          throw new Error(`rest paramter must be last formal parameter`)
        }
        const ident = this.parseIdent()
        const parameter: ParameterStatement = {
          type: 'statement',
          statementType: 'param',
          identifier: ident,
        }
        if (this.peekToken.tokenType === TokenType.EQ) {
          // consume the = token
          this.nextToken()
          // move the currentToken to the start of the expression
          this.nextToken()
          parameter.defaultValue = this.parseExpression(Prec.LOWEST)
        }
        identifiers.push(parameter)
        this.nextToken()
      } else if (this.currentToken.tokenType === TokenType.COMMA) {
        this.nextToken()
      } else {
        throw new Error(`unexpected token. got = ${this.currentToken.tokenType}`)
      }
    }

    return identifiers
  }

  private parseBlockStatement(): BlockStatement {
    this.nextToken()
    const statement: BlockStatement = { type: 'statement', statementType: 'block', statements: [] }

    while (this.currentToken.tokenType !== TokenType.R_BRACE && this.currentToken.tokenType !== TokenType.EOF) {
      statement.statements.push(this.parseStatement())
      this.nextToken()
    }

    return statement
  }

  private parseExpressionStatement(): ExpressionStatement {
    const expression = this.parseExpression(Prec.LOWEST)
    if (this.peekToken.tokenType === TokenType.SEMI) {
      this.nextToken()
    }
    return { type: 'statement', statementType: 'expression', expression }
  }

  private parseExpression(precedence: number): Expression {
    const prefixFn = this.prefixParseFns[this.currentToken.tokenType]
    if (typeof prefixFn !== 'function') {
      throw new Error(`prefix function not found for tokenType = ${this.currentToken.tokenType}`)
    }
    let left = prefixFn()

    while (
      this.peekToken.tokenType !== TokenType.SEMI &&
      this.peekToken.tokenType !== TokenType.EOF &&
      precedence < this.peekPrecedence()
    ) {
      const infix = this.infixParseFns[this.peekToken.tokenType]
      if (typeof infix !== 'function') {
        return left
      }
      this.nextToken()
      left = infix(left)
    }

    return left
  }

  private parseNumber(): Number {
    return {
      type: 'expression',
      expressionType: 'number',
      value: Number.parseFloat(this.currentToken.literal.replaceAll('_', '')),
    }
  }

  private parseString(): String {
    return {
      type: 'expression',
      expressionType: 'string',
      value: this.currentToken.literal,
    }
  }

  private parseIdent(): Identifier {
    return {
      type: 'expression',
      expressionType: 'identifier',
      value: this.currentToken.literal,
    }
  }

  private parsePrefix(): PrefixExpression {
    const operator = this.currentToken.literal
    this.nextToken()
    const right = this.parseExpression(Prec.PREFIX)
    return {
      type: 'expression',
      expressionType: 'prefix',
      operator,
      right,
    }
  }

  private parseGroupedExpression(): Expression {
    this.nextToken()
    const expression = this.parseExpression(Prec.LOWEST)
    this.expectPeek(TokenType.R_PAREN)
    return expression
  }

  private parseInfix(left: Expression): InfixExpression {
    const operator = this.currentToken.literal
    const precedence = this.currentPrecedence()
    this.nextToken()
    const right = this.parseExpression(precedence)
    return {
      type: 'expression',
      expressionType: 'infix',
      operator,
      left,
      right,
    }
  }

  private registerPrefix(tokenType: TokenType, fn: ParsePrefixFn) {
    this.prefixParseFns[tokenType] = fn
  }

  private registerInfix(tokenType: TokenType, fn: ParseInfixFn) {
    this.infixParseFns[tokenType] = fn
  }
  private nextToken() {
    this.currentToken = this.peekToken
    this.peekToken = this.lexer.next()
  }

  private currentPrecedence(): number {
    return TOKEN_PREC_MAP[this.currentToken.tokenType] ?? Prec.LOWEST
  }

  private peekPrecedence(): number {
    return TOKEN_PREC_MAP[this.peekToken.tokenType] ?? Prec.LOWEST
  }

  private expectPeek(tokenType: TokenType) {
    if (this.peekToken.tokenType !== tokenType) {
      throw new Error(`unexpected token. expected = ${tokenType}. got = ${this.peekToken.tokenType}`)
    }
    this.nextToken()
  }
}
