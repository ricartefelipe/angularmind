import { formatCents, parseReaisToCents, toCents } from './money'

describe('money', () => {
  it('formatCents formata BRL a partir de centavos', () => {
    expect(formatCents(250_000, 'pt-BR')).toContain('2.500,00')
  })

  it('formatCents evita NaN para valores ausentes', () => {
    expect(formatCents(undefined, 'pt-BR')).toContain('0,00')
    expect(formatCents(null, 'pt-BR')).toContain('0,00')
    expect(formatCents(Number.NaN, 'pt-BR')).toContain('0,00')
    expect(formatCents('250000', 'pt-BR')).toContain('2.500,00')
  })

  it('toCents aplica fallback seguro', () => {
    expect(toCents(undefined)).toBe(0)
    expect(toCents('12.9')).toBe(12)
    expect(toCents('x', 7)).toBe(7)
  })

  it('parseReaisToCents converte string pt-BR simples', () => {
    expect(parseReaisToCents('10,50')).toBe(1050)
    expect(parseReaisToCents('10')).toBe(1000)
  })

  it('parseReaisToCents rejeita entrada inválida', () => {
    expect(() => parseReaisToCents('abc')).toThrowError('INVALID_MONEY')
  })

  it('parseReaisToCents rejeita valores negativos', () => {
    expect(() => parseReaisToCents('-0,50')).toThrowError('INVALID_MONEY')
    expect(() => parseReaisToCents('-10,50')).toThrowError('INVALID_MONEY')
  })
})
