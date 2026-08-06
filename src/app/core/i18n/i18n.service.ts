import { Injectable, computed, signal } from '@angular/core'
import en from './locales/en'
import ptBR from './locales/pt-BR'

export type Locale = 'pt-BR' | 'en'

type Dict = Record<string, unknown>

const STORAGE_KEY = 'angularmind.locale'
const messages: Record<Locale, Dict> = {
  'pt-BR': ptBR as unknown as Dict,
  en: en as unknown as Dict,
}

function lookup(dict: Dict, path: string): string | undefined {
  const parts = path.split('.')
  let current: unknown = dict
  for (const part of parts) {
    if (current === null || typeof current !== 'object') return undefined
    current = (current as Dict)[part]
  }
  return typeof current === 'string' ? current : undefined
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly locale = signal<Locale>(this.readInitial())
  readonly tick = computed(() => this.locale())

  t(key: string): string {
    this.tick()
    return lookup(messages[this.locale()], key) ?? lookup(messages['pt-BR'], key) ?? key
  }

  setLocale(locale: Locale): void {
    this.locale.set(locale)
    localStorage.setItem(STORAGE_KEY, locale)
  }

  private readInitial(): Locale {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'en' || stored === 'pt-BR' ? stored : 'pt-BR'
  }
}
