import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import type { BeneficiariesResponse, Beneficiary, CreateBeneficiaryRequest } from './types'

@Injectable({ providedIn: 'root' })
export class BeneficiariesApi {
  private readonly http = inject(HttpClient)

  list() {
    return this.http.get<BeneficiariesResponse>('/api/v1/beneficiaries')
  }

  create(body: CreateBeneficiaryRequest) {
    return this.http.post<Beneficiary>('/api/v1/beneficiaries', body)
  }

  remove(id: string) {
    return this.http.delete<void>(`/api/v1/beneficiaries/${id}`)
  }
}
