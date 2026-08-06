export function toCents(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value)
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return Math.trunc(parsed)
  }
  return fallback
}

export function formatCents(
  cents: unknown,
  locale = 'pt-BR',
  currency = 'BRL',
): string {
  const amount = toCents(cents)
  const code = typeof currency === 'string' && currency.trim() ? currency : 'BRL'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
  }).format(amount / 100)
}

export function parseReaisToCents(input: string): number {
  const normalized = input.trim().replace(/\s/g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error('INVALID_MONEY')
  }
  const [reais, frac = ''] = normalized.split('.')
  return Number(reais) * 100 + Number(frac.padEnd(2, '0').slice(0, 2))
}
