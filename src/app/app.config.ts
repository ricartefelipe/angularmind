import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core'
import { provideRouter, withHashLocation } from '@angular/router'
import { apiInterceptor } from './core/http/api.interceptor'
import { routes } from './app.routes'

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(withInterceptors([apiInterceptor])),
  ],
}
