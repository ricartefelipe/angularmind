export type Beneficiary = { id: string; name: string; pixKey: string }
export type CreateBeneficiaryRequest = { name: string; pixKey: string }
export type BeneficiariesResponse = { items: Beneficiary[] }
