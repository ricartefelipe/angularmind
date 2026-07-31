import { loginTotalRecall, totalRecallSession, totalRecallBaseUrl } from './totalrecall'

describe('totalRecallBaseUrl', () => {
  it('retorna URL HTTP ou HTTPS conforme o protocolo da página', () => {
    const url = totalRecallBaseUrl()
    expect(url === 'http://54.94.163.136:9087' || url === 'https://54.94.163.136.sslip.io').toBeTrue()
  })
})

describe('loginTotalRecall', () => {
  it('retorna null quando o fetch estoura o timeout', async () => {
    spyOn(window, 'fetch').and.callFake((_url: RequestInfo | URL, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal
        if (!signal) return
        if (signal.aborted) {
          reject(new DOMException('Aborted', 'AbortError'))
          return
        }
        signal.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'))
        })
      })
    })

    const result = await loginTotalRecall('a@b.com', 'x', 'angularmind', 30)
    expect(result).toBeNull()
  })

  it('retorna o JSON quando o TR responde', async () => {
    spyOn(window, 'fetch').and.returnValue(
      Promise.resolve({
        json: async () => ({ valid: false, reason: 'invalid_credentials' }),
      } as Response),
    )

    const result = await loginTotalRecall('demo@vuemind.dev', 'demo123', 'angularmind', 1000)
    expect(result).toEqual({ valid: false, reason: 'invalid_credentials' })
  })

  it('cria uma sessão local com os dados do perfil autorizado', () => {
    expect(
      totalRecallSession({
        valid: true,
        profile: { id: 'profile-1', name: 'Felipe', email: 'felipe@example.com' },
        system: { slug: 'angularmind', name: 'AngularMind' },
        systems: [],
        expiresAt: '2026-08-01T12:00:00.000Z',
      }),
    ).toEqual({
      accessToken: 'totalrecall:profile-1',
      user: { id: 'profile-1', name: 'Felipe', email: 'felipe@example.com' },
    })
  })
})
