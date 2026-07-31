export type TotalRecallLoginResult =
  | {
      valid: true
      profile: { id: string; name: string; email: string }
      system: { slug: string; name: string }
      expiresAt: string
    }
  | { valid: false; reason?: string }

const DEFAULT_HTTP = 'http://54.94.163.136:9087'
const DEFAULT_HTTPS = 'https://54.94.163.136.sslip.io'
export const TOTALRECALL_LOGIN_TIMEOUT_MS = 4_000

function pageProtocol(): string {
  if (typeof window !== 'undefined' && window.location?.protocol) {
    return window.location.protocol
  }
  if (typeof self !== 'undefined' && 'location' in self && self.location?.protocol) {
    return self.location.protocol
  }
  return 'http:'
}

export function totalRecallBaseUrl(): string {
  const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env
  const fromEnv = env?.['NG_APP_TOTALRECALL_URL']
  if (fromEnv?.trim()) return fromEnv.trim().replace(/\/$/, '')
  if (pageProtocol() === 'https:') {
    return DEFAULT_HTTPS
  }
  return DEFAULT_HTTP
}

export async function loginTotalRecall(
  email: string,
  password: string,
  system: string,
  timeoutMs: number = TOTALRECALL_LOGIN_TIMEOUT_MS,
): Promise<TotalRecallLoginResult | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await Promise.race([
      fetch(`${totalRecallBaseUrl()}/api/v1/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, system }),
        signal: controller.signal,
      }),
      new Promise<never>((_resolve, reject) => {
        const onAbort = (): void => {
          reject(new DOMException('TotalRecall login timed out', 'AbortError'))
        }
        if (controller.signal.aborted) {
          onAbort()
          return
        }
        controller.signal.addEventListener('abort', onAbort, { once: true })
      }),
    ])
    return (await response.json()) as TotalRecallLoginResult
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
