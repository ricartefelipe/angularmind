export type CreatePixRequest = {
  beneficiaryId: string
  amountCents: number
}

export type Transfer = {
  id: string
  beneficiaryId: string
  amountCents: number
  status: 'COMPLETED'
  createdAt: string
}
