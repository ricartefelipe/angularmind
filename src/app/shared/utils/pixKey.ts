import { assertValidPixKey, type PixKeyType } from '@ricartefelipe/mind-wallet-shared/pixKey'

export type { PixKeyType }

export function isValidPixKey(type: PixKeyType, key: string): boolean {
  try {
    assertValidPixKey(type, key)
    return true
  } catch {
    return false
  }
}

export { assertValidPixKey }
