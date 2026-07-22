/** Dinheiro no contrato: CENTAVOS (integer). UI formata para o humano. */
export function formatCents(
  cents: number,
  locale = 'pt-BR',
  currency = 'BRL',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(cents / 100)
}

export function parseReaisToCents(input: string): number {
  const normalized = input.trim().replace(/\s/g, '').replace(',', '.')
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error('INVALID_MONEY')
  }
  const [reais, frac = ''] = normalized.split('.')
  return Number(reais) * 100 + Number(frac.padEnd(2, '0').slice(0, 2))
}
