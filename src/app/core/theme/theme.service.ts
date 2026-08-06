import { Injectable, signal } from '@angular/core'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'angularmind.theme'

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.readInitial())

  constructor() {
    this.apply(this.theme())
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme)
    localStorage.setItem(STORAGE_KEY, theme)
    this.apply(theme)
  }

  private apply(theme: Theme): void {
    document.documentElement.dataset['theme'] = theme
  }

  private readInitial(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'dark' || stored === 'light' ? stored : 'light'
  }
}
