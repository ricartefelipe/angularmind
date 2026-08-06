import { toCents } from '@/shared/utils/money'
import type { Transaction, TransactionsPage, WalletBalance } from './types'

function toPositiveInt(value: unknown, fallback: number): number {
  const n = toCents(value, fallback)
  return n > 0 ? n : fallback
}

export function normalizeWalletBalance(raw: Partial<WalletBalance> | null | undefined): WalletBalance {
  return {
    availableCents: toCents(raw?.availableCents),
    blockedCents: toCents(raw?.blockedCents),
    dailyLimitCents: toCents(raw?.dailyLimitCents),
    dailySpentCents: toCents(raw?.dailySpentCents),
    currency:
      typeof raw?.currency === 'string' && raw.currency.trim() ? raw.currency : 'BRL',
  }
}

export function normalizeTransaction(raw: Partial<Transaction> | null | undefined): Transaction {
  return {
    id: String(raw?.id ?? ''),
    type: raw?.type === 'PIX_IN' || raw?.type === 'TED' || raw?.type === 'PIX_OUT' ? raw.type : 'PIX_OUT',
    amountCents: toCents(raw?.amountCents),
    description: String(raw?.description ?? ''),
    createdAt: String(raw?.createdAt ?? ''),
    counterparty: String(raw?.counterparty ?? ''),
  }
}

export function normalizeTransactionsPage(
  raw: Partial<TransactionsPage> | null | undefined,
  fallbackPage = 1,
  fallbackPageSize = 20,
): TransactionsPage {
  const items = Array.isArray(raw?.items) ? raw.items.map((item) => normalizeTransaction(item)) : []
  return {
    items,
    page: toPositiveInt(raw?.page, fallbackPage),
    pageSize: toPositiveInt(raw?.pageSize, fallbackPageSize),
    total: toCents(raw?.total, items.length),
  }
}
