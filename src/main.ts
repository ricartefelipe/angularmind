import { bootstrapApplication } from '@angular/platform-browser'
import { appConfig } from './app/app.config'
import { AppComponent } from './app/app.component'

async function main(): Promise<void> {
  const { worker } = await import('./app/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
  await bootstrapApplication(AppComponent, appConfig)
}

main().catch(console.error)
