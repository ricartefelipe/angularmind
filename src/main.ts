import { isDevMode } from '@angular/core'
import { bootstrapApplication } from '@angular/platform-browser'
import { appConfig } from './app/app.config'
import { AppComponent } from './app/app.component'
import { environment } from './environments/environment'

async function main(): Promise<void> {
  const enableMsw = isDevMode() || environment.enableMsw
  if (enableMsw) {
    const { worker } = await import('./app/mocks/browser')
    const base = document.querySelector('base')?.getAttribute('href') ?? '/'
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: `${base}mockServiceWorker.js`,
      },
    })
  }

  await bootstrapApplication(AppComponent, appConfig)
}

main().catch(console.error)
