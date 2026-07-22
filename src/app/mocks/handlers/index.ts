import { authHandlers } from './auth.handlers'
import { walletHandlers } from './wallet.handlers'
import { beneficiariesHandlers } from './beneficiaries.handlers'
import { transfersHandlers } from './transfers.handlers'

export const handlers = [
  ...authHandlers,
  ...walletHandlers,
  ...beneficiariesHandlers,
  ...transfersHandlers,
]
