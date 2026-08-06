export type PixKeyType = 'EMAIL' | 'CPF' | 'PHONE' | 'RANDOM'

export type Beneficiary = {
  id: string
  name: string
  pixKey: string
  pixKeyType: PixKeyType
}

export type CreateBeneficiaryRequest = {
  name: string
  pixKey: string
  pixKeyType: PixKeyType
}

export type BeneficiariesResponse = { items: Beneficiary[] }
