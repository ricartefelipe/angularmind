import { isValidPixKey } from './pixKey';

describe('isValidPixKey', () => {
    it('valida e-mail', () => {
        expect(isValidPixKey('EMAIL', 'ana@email.com')).toBe(true);
        expect(isValidPixKey('EMAIL', 'invalido')).toBe(false);
    });

    it('valida CPF', () => {
        expect(isValidPixKey('CPF', '12345678901')).toBe(true);
        expect(isValidPixKey('CPF', '123')).toBe(false);
    });

    it('valida telefone', () => {
        expect(isValidPixKey('PHONE', '+5511999999999')).toBe(true);
        expect(isValidPixKey('PHONE', 'abc')).toBe(false);
    });

    it('valida chave aleatória', () => {
        expect(isValidPixKey('RANDOM', 'a'.repeat(32))).toBe(true);
        expect(isValidPixKey('RANDOM', 'curta')).toBe(false);
    });
});
