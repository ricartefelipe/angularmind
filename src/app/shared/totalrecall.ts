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

export function totalRecallBaseUrl(): string {
  const fromEnv = (import.meta as ImportMeta & { env?: Record<string, string> }).env
    ?.NG_APP_TOTALRECALL_URL
  if (fromEnv?.trim()) return fromEnv.trim().replace(/\/$/, '')
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return DEFAULT_HTTPS
  }
  return DEFAULT_HTTP
}

export async function loginTotalRecall(
  email: string,
  password: string,
  system: string,
): Promise<TotalRecallLoginResult | null> {
  try {
    const response = await fetch(`${totalRecallBaseUrl()}/api/v1/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, system }),
    })
    return (await response.json()) as TotalRecallLoginResult
  } catch {
    return null
  }
}
