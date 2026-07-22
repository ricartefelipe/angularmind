export type Balance = { availableCents: number; currency: string }
export type TransactionType = 'PIX_OUT' | 'PIX_IN' | 'TED'
export type Transaction = {
  id: string
  type: TransactionType
  amountCents: number
  description: string
  createdAt: string
  counterparty: string
}
export type TransactionsResponse = { items: Transaction[] }
