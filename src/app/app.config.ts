import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { APP_INITIALIZER, ApplicationConfig, inject, provideZoneChangeDetection } from '@angular/core'
import { provideRouter, withHashLocation } from '@angular/router'
import { ThemeService } from './core/theme/theme.service'
import { apiInterceptor } from './core/http/api.interceptor'
import { routes } from './app.routes'

function initTheme(): () => void {
  inject(ThemeService)
  return () => undefined
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(withInterceptors([apiInterceptor])),
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: initTheme,
    },
  ],
}
