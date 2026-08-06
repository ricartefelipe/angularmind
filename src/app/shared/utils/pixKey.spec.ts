import { isValidPixKey } from './pixKey'

describe('isValidPixKey', () => {
  it('valida e-mail', () => {
    expect(isValidPixKey('EMAIL', 'ana@email.com')).toBeTrue()
    expect(isValidPixKey('EMAIL', 'invalido')).toBeFalse()
  })

  it('valida CPF', () => {
    expect(isValidPixKey('CPF', '12345678901')).toBeTrue()
    expect(isValidPixKey('CPF', '123')).toBeFalse()
  })

  it('valida telefone', () => {
    expect(isValidPixKey('PHONE', '+5511999999999')).toBeTrue()
    expect(isValidPixKey('PHONE', 'abc')).toBeFalse()
  })

  it('valida chave aleatória', () => {
    expect(isValidPixKey('RANDOM', 'a'.repeat(32))).toBeTrue()
    expect(isValidPixKey('RANDOM', 'curta')).toBeFalse()
  })
})
