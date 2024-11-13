import { TOKEN_TYPE_IDENT_MAP, TokenType, type Token } from './token'
import { match } from 'ts-pattern'

export class Lexer {
  constructor(private src: string) {}

  next(): Token {
    this.src = this.src.trimStart()

    if (this.src.length === 0) {
      return { tokenType: TokenType.EOF, literal: '' }
    }

    const token = match(this.src[0])
      .returnType<Token>()
      .with(',', () => ({
        tokenType: TokenType.COMMA,
        literal: this.slice(1),
      }))
      .with('(', () => ({
        tokenType: TokenType.L_PAREN,
        literal: this.slice(1),
      }))
      .with(')', () => ({
        tokenType: TokenType.R_PAREN,
        literal: this.slice(1),
      }))
      .with('{', () => ({
        tokenType: TokenType.L_BRACE,
        literal: this.slice(1),
      }))
      .with('}', () => ({
        tokenType: TokenType.R_BRACE,
        literal: this.slice(1),
      }))
      .with('[', () => ({
        tokenType: TokenType.L_SQUARE,
        literal: this.slice(1),
      }))
      .with(']', () => ({
        tokenType: TokenType.R_SQUARE,
        literal: this.slice(1),
      }))
      .with('+', () => {
        if (this.src[1] === '+') {
          return {
            tokenType: TokenType.PLUS_PLUS,
            literal: this.slice(2),
          }
        }
        return {
          tokenType: TokenType.PLUS,
          literal: this.slice(1),
        }
      })
      .with('-', () => {
        if (this.src[1] === '-') {
          return {
            tokenType: TokenType.MINUS_MINUS,
            literal: this.slice(2),
          }
        }
        return {
          tokenType: TokenType.MINUS,
          literal: this.slice(1),
        }
      })
      .with('*', () => ({
        tokenType: TokenType.ASTERISK,
        literal: this.slice(1),
      }))
      .with('/', () => {
        if (this.src[1] === '/') {
          // single line comment
          for (let i = 2; i <= this.src.length; i++) {
            // consume the tokens until the end of the line or the end of the input
            if (this.src[i] === '\n' || i === this.src.length) {
              this.slice(i + 1)
              return this.next()
            }
          }
        } else if (this.src[1] === '*') {
          // multi line comment
          for (let i = 2; i <= this.src.length; i++) {
            // consume the tokens until the end of the comment or the end of the input
            if (this.src[i] === '*' && this.src[i + 1] === '/') {
              this.slice(i + 2)
              return this.next()
            }
          }
        }
        return {
          tokenType: TokenType.SLASH,
          literal: this.slice(1),
        }
      })
      .with('%', () => ({
        tokenType: TokenType.PERCENT,
        literal: this.slice(1),
      }))
      .with('.', () => {
        if (this.src[1] === '.' && this.src[2] === '.') {
          return {
            tokenType: TokenType.DOT_DOT_DOT,
            literal: this.slice(3),
          }
        }
        return {
          tokenType: TokenType.DOT,
          literal: this.slice(1),
        }
      })
      .with('=', () => {
        if (this.src[1] === '=') {
          if (this.src[2] === '=') {
            return {
              tokenType: TokenType.EQ_EQ_EQ,
              literal: this.slice(3),
            }
          }
          return {
            tokenType: TokenType.EQ_EQ,
            literal: this.slice(2),
          }
        }
        return {
          tokenType: TokenType.EQ,
          literal: this.slice(1),
        }
      })
      .with('!', () => {
        if (this.src[1] === '=') {
          if (this.src[2] === '=') {
            return {
              tokenType: TokenType.NOT_EQ_EQ,
              literal: this.slice(3),
            }
          }
          return {
            tokenType: TokenType.NOT_EQ,
            literal: this.slice(2),
          }
        }
        return {
          tokenType: TokenType.BANG,
          literal: this.slice(1),
        }
      })
      .with('<', () => ({
        tokenType: TokenType.LT,
        literal: this.slice(1),
      }))
      .with('>', () => ({
        tokenType: TokenType.GT,
        literal: this.slice(1),
      }))
      .with(':', () => ({
        tokenType: TokenType.COLON,
        literal: this.slice(1),
      }))
      .with(';', () => ({
        tokenType: TokenType.SEMI,
        literal: this.slice(1),
      }))
      .otherwise(() => {
        const ch = this.src[0]
        if (this.isDigit(ch)) {
          return this.number()
        } else if (ch === '"' || ch === "'") {
          // consume the first token
          this.slice(1)
          return this.string(ch)
        } else if (this.isValidIdentifier(ch)) {
          return this.identifier()
        }

        throw new Error(`Unknown token ${this.src[0]}`)
      })
    return token
  }

  private slice(len: number): string {
    const s = this.src.slice(0, len)
    this.src = this.src.slice(len)
    return s
  }

  private isDigit(ch: string) {
    return '0' <= ch && ch <= '9'
  }

  private isNumber(str: string) {
    return /^[0-9][0-9_]*\.?[0-9_]*$/.test(str)
  }

  private isValidIdentifier(ch: string) {
    return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(ch)
  }

  private isWhitespace(ch: string) {
    return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r'
  }

  private number(): Token {
    for (let i = 1; i <= this.src.length; i++) {
      if (!this.isNumber(this.src.slice(0, i))) {
        const literal = this.slice(i - 1)
        return {
          tokenType: TokenType.NUMBER,
          literal,
        }
      }
      if (this.isWhitespace(this.src[i]) || i === this.src.length) {
        return {
          tokenType: TokenType.NUMBER,
          literal: this.slice(i),
        }
      }
    }
    throw new Error(`Unknown token ${this.src[this.src.length - 1]}`)
  }

  private identifier(): Token {
    let ident = ''
    for (let i = 1; i <= this.src.length; i++) {
      if (!this.isValidIdentifier(this.src.slice(0, i))) {
        ident = this.slice(i - 1)
        break
      }
    }
    if (!ident) {
      ident = this.slice(this.src.length)
    }
    const tokenType = TOKEN_TYPE_IDENT_MAP[ident]
    if (tokenType) {
      return {
        tokenType,
        literal: ident,
      }
    }
    return {
      tokenType: TokenType.IDENT,
      literal: ident,
    }
  }

  private string(quote: string): Token {
    for (let i = 0; i <= this.src.length; i++) {
      if (this.src[i] === quote) {
        const str = this.slice(i)
        // consume the last quote
        this.slice(1)
        return {
          tokenType: TokenType.STRING,
          literal: str,
        }
      }
    }
    throw new Error(`non terminated string. Expected (${quote})`)
  }
}
