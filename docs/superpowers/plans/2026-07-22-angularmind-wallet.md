# AngularMind Wallet (Angular 19) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir a SPA AngularMind Wallet (carteira digital de estudo) com Angular 19 standalone, signals, MSW e testes essenciais — pronta para plugar `vuemind-api` depois.

**Architecture:** SPA feature-first (`auth`, `wallet`, `transfers`, `beneficiaries`) falando com `/api/v1` via `HttpClient` + interceptor. Em dev/test, MSW atende o contrato; depois, proxy/`baseUrl` aponta para Spring. Estado com services + signals (sem NgRx). Sem i18n/tema elaborados.

**Tech Stack:** Angular 19, TypeScript, Angular Router, HttpClient, MSW 2, Jasmine/Karma (`ng test`), CSS variables, npm, Angular CLI.

## Global Constraints

- Package manager: **npm** (`package-lock.json`)
- Angular **19** standalone; TypeScript estrito
- Valores monetários no contrato em **centavos** (`integer`)
- Base path API: `/api/v1`
- Erros API: `{ code, message, correlationId }`
- Login mock: `demo@vuemind.dev` / `demo123`
- Token mock: `mock-jwt-demo` em `sessionStorage` (chave `angularmind.token`)
- PIX MVP: favorecido existente obrigatório
- Header `Idempotency-Key` só no confirm do PIX
- Sem Angular Material, sem NgRx, sem SSR, sem i18n/tema
- Comentários curtos só nos pontos de entrevista (signals, interceptor, guard, executePix)
- Sem rastros de IA em commits/código versionado
- Spec: `docs/superpowers/specs/2026-07-22-angularmind-wallet-design.md`
- Contrato fonte (copiar): `/home/frm/Documentos/wks-poc/vuemind/docs/contracts/vuemind-wallet-openapi.yaml`

---

## File Structure (mapa)

```
angularmind/
  package.json                    # gerado por ng new
  angular.json
  tsconfig.json
  tsconfig.app.json
  tsconfig.spec.json
  docs/
    contracts/vuemind-wallet-openapi.yaml
    guides/entrevista-angular.md
    superpowers/specs/...
    superpowers/plans/...
  public/
    mockServiceWorker.js          # msw init
  src/
    index.html
    main.ts
    styles.css
    app/
      app.config.ts
      app.routes.ts
      app.component.ts
      app.component.html
      core/
        auth/
          auth.service.ts
          auth.guard.ts
          token.storage.ts
        http/
          api.interceptor.ts
          api-error.ts
      shared/
        types/api.ts
        utils/money.ts
        utils/money.spec.ts
        utils/id.ts
        ui/
          app-button.component.ts
          app-input.component.ts
          app-shell.component.ts
          loading-block.component.ts
          error-banner.component.ts
          empty-state.component.ts
      features/
        auth/
          types.ts
          auth.api.ts
          login.page.ts
        wallet/
          types.ts
          wallet.api.ts
          wallet.service.ts
          dashboard.page.ts
          transactions.page.ts
        beneficiaries/
          types.ts
          beneficiaries.api.ts
          beneficiaries.service.ts
          beneficiaries.page.ts
        transfers/
          types.ts
          transfers.api.ts
          transfers.service.ts
          transfer-pix.page.ts
      mocks/
        browser.ts
        data/db.ts
        handlers/
          auth.handlers.ts
          wallet.handlers.ts
          beneficiaries.handlers.ts
          transfers.handlers.ts
          transfers.handlers.spec.ts
          index.ts
```

Path alias em `tsconfig.json` / `tsconfig.app.json`:

```json
"paths": { "@/*": ["src/app/*"] }
```

---

### Task 1: Scaffold Angular 19 + contrato + money utils (TDD)

**Files:**
- Create (via CLI): projeto Angular em `/home/frm/Documentos/wks-poc/angularmind` (repo já existe com `.git` e `docs/`)
- Create: `docs/contracts/vuemind-wallet-openapi.yaml` (cópia)
- Create: `src/app/shared/utils/money.ts`, `src/app/shared/utils/money.spec.ts`, `src/app/shared/utils/id.ts`, `src/app/shared/types/api.ts`
- Modify: `tsconfig.json` / `tsconfig.app.json` (paths `@/*`)
- Modify: `.gitignore` se o CLI sobrescrever — preservar `docs/`

**Interfaces:**
- Consumes: nada
- Produces: `formatCents(cents, locale?, currency?)`, `parseReaisToCents(input)`, `createCorrelationId()`, `createIdempotencyKey()`, `ApiErrorBody`

- [ ] **Step 1: Scaffold com Angular CLI sem destruir docs**

O diretório já tem `.git` e `docs/`. Gerar o app **no lugar** com:

```bash
cd /home/frm/Documentos/wks-poc/angularmind
npx -y @angular/cli@19 new angularmind-tmp \
  --directory=. \
  --routing=true \
  --style=css \
  --ssr=false \
  --skip-git=true \
  --skip-tests=false \
  --standalone=true \
  --package-manager=npm
```

Se o CLI recusar diretório não vazio, gerar em `/tmp/angularmind-scaffold`, copiar `package.json`, `angular.json`, `tsconfig*.json`, `src/`, `public/`, `.editorconfig`, `.gitignore` para o repo **sem apagar** `docs/`, depois `npm install` no repo.

Remover o app default gerado (welcome) depois — Task 3/4 substitui.

- [ ] **Step 2: Copiar OpenAPI**

```bash
mkdir -p docs/contracts
cp /home/frm/Documentos/wks-poc/vuemind/docs/contracts/vuemind-wallet-openapi.yaml \
  docs/contracts/vuemind-wallet-openapi.yaml
```

- [ ] **Step 3: Configurar path alias `@/*`**

Em `tsconfig.json` (ou `compilerOptions` compartilhado), garantir:

```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/app/*"]
    }
  }
}
```

- [ ] **Step 4: Escrever teste falhando de `money`**

Create `src/app/shared/utils/money.spec.ts`:

```typescript
import { formatCents, parseReaisToCents } from './money'

describe('money', () => {
  it('formatCents formata BRL a partir de centavos', () => {
    expect(formatCents(250_000, 'pt-BR')).toContain('2.500,00')
  })

  it('parseReaisToCents converte string pt-BR simples', () => {
    expect(parseReaisToCents('10,50')).toBe(1050)
    expect(parseReaisToCents('10')).toBe(1000)
  })

  it('parseReaisToCents rejeita entrada inválida', () => {
    expect(() => parseReaisToCents('abc')).toThrowError('INVALID_MONEY')
  })
})
```

- [ ] **Step 5: Rodar teste e ver falha**

```bash
cd /home/frm/Documentos/wks-poc/angularmind
npx ng test --no-watch --browsers=ChromeHeadless --include='**/money.spec.ts'
```

Expected: FAIL (módulo `./money` inexistente ou exports faltando).

- [ ] **Step 6: Implementar `money` + `id` + `ApiErrorBody`**

Create `src/app/shared/utils/money.ts`:

```typescript
/** Dinheiro no contrato: CENTAVOS (integer). UI formata para o humano. */
export function formatCents(
  cents: number,
  locale = 'pt-BR',
  currency = 'BRL',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(cents / 100)
}

export function parseReaisToCents(input: string): number {
  const normalized = input.trim().replace(/\s/g, '').replace(',', '.')
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error('INVALID_MONEY')
  }
  const [reais, frac = ''] = normalized.split('.')
  return Number(reais) * 100 + Number(frac.padEnd(2, '0').slice(0, 2))
}
```

Create `src/app/shared/utils/id.ts`:

```typescript
export function createCorrelationId(): string {
  return crypto.randomUUID()
}

export function createIdempotencyKey(): string {
  return crypto.randomUUID()
}
```

Create `src/app/shared/types/api.ts`:

```typescript
export type ApiErrorBody = {
  code: string
  message: string
  correlationId: string
}
```

- [ ] **Step 7: Rodar testes money — PASS**

```bash
npx ng test --no-watch --browsers=ChromeHeadless --include='**/money.spec.ts'
```

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add docs/contracts package.json package-lock.json angular.json tsconfig*.json \
  src public .editorconfig .gitignore src/app/shared
git commit -m "$(cat <<'EOF'
chore: scaffold Angular 19 e utilitários money/id

Inclui contrato OpenAPI copiado da trilha e testes de centavos.
EOF
)"
```

---

### Task 2: MSW — db, handlers e `executePix` (TDD)

**Files:**
- Create: `src/app/mocks/data/db.ts`
- Create: `src/app/mocks/handlers/auth.handlers.ts`
- Create: `src/app/mocks/handlers/wallet.handlers.ts`
- Create: `src/app/mocks/handlers/beneficiaries.handlers.ts`
- Create: `src/app/mocks/handlers/transfers.handlers.ts`
- Create: `src/app/mocks/handlers/transfers.handlers.spec.ts`
- Create: `src/app/mocks/handlers/index.ts`
- Create: `src/app/mocks/browser.ts`
- Create: `public/mockServiceWorker.js` (via `npx msw init public/`)
- Modify: `package.json` (dep `msw`), `src/main.ts` (start worker antes do bootstrap)

**Interfaces:**
- Consumes: `ApiErrorBody`, `createCorrelationId`
- Produces: `getDb()`, `resetDb()`, `executePix(db, input)`, `handlers`, `worker`

- [ ] **Step 1: Instalar MSW e gerar worker**

```bash
npm install -D msw@2
npx msw init public/ --save
```

- [ ] **Step 2: Escrever teste falhando de `executePix`**

Create `src/app/mocks/handlers/transfers.handlers.spec.ts`:

```typescript
import { executePix } from './transfers.handlers'
import { getDb, resetDb } from '../data/db'

describe('executePix', () => {
  beforeEach(() => resetDb())

  it('debita saldo e registra PIX_OUT', () => {
    const db = getDb()
    const before = db.availableCents
    const transfer = executePix(db, {
      beneficiaryId: 'b1',
      amountCents: 1_000,
      idempotencyKey: 'k1',
    })
    expect(transfer.status).toBe('COMPLETED')
    expect(db.availableCents).toBe(before - 1_000)
    expect(db.transactions[0].type).toBe('PIX_OUT')
  })

  it('rejeita saldo insuficiente', () => {
    const db = getDb()
    expect(() =>
      executePix(db, {
        beneficiaryId: 'b1',
        amountCents: db.availableCents + 1,
        idempotencyKey: 'k2',
      }),
    ).toThrowError('INSUFFICIENT_FUNDS')
  })

  it('é idempotente para a mesma chave', () => {
    const db = getDb()
    const a = executePix(db, {
      beneficiaryId: 'b1',
      amountCents: 500,
      idempotencyKey: 'same',
    })
    const balance = db.availableCents
    const b = executePix(db, {
      beneficiaryId: 'b1',
      amountCents: 500,
      idempotencyKey: 'same',
    })
    expect(b.id).toBe(a.id)
    expect(db.availableCents).toBe(balance)
  })
})
```

- [ ] **Step 3: Rodar e ver falha**

```bash
npx ng test --no-watch --browsers=ChromeHeadless --include='**/transfers.handlers.spec.ts'
```

Expected: FAIL

- [ ] **Step 4: Implementar `db.ts`**

Create `src/app/mocks/data/db.ts`:

```typescript
export type MockUser = {
  id: string
  name: string
  email: string
  password: string
}

export type Beneficiary = {
  id: string
  name: string
  pixKey: string
}

export type Transaction = {
  id: string
  type: 'PIX_OUT' | 'PIX_IN' | 'TED'
  amountCents: number
  description: string
  createdAt: string
  counterparty: string
}

export type Transfer = {
  id: string
  beneficiaryId: string
  amountCents: number
  status: 'COMPLETED'
  createdAt: string
}

export type Db = {
  user: MockUser
  availableCents: number
  beneficiaries: Beneficiary[]
  transactions: Transaction[]
  transfers: Transfer[]
  idempotency: Map<string, Transfer>
}

const seed = (): Db => ({
  user: {
    id: 'u1',
    name: 'Marion Demo',
    email: 'demo@vuemind.dev',
    password: 'demo123',
  },
  availableCents: 250_000,
  beneficiaries: [
    { id: 'b1', name: 'Ana Silva', pixKey: 'ana@email.com' },
    { id: 'b2', name: 'Mercado Central', pixKey: '11222333000181' },
  ],
  transactions: [
    {
      id: 't1',
      type: 'PIX_IN',
      amountCents: 50_000,
      description: 'Recebido',
      createdAt: '2026-07-20T10:00:00.000Z',
      counterparty: 'Carlos',
    },
  ],
  transfers: [],
  idempotency: new Map(),
})

let db = seed()

export function getDb(): Db {
  return db
}

export function resetDb(): void {
  db = seed()
}
```

- [ ] **Step 5: Implementar handlers**

Create `src/app/mocks/handlers/transfers.handlers.ts`:

```typescript
/**
 * executePix = regra de negócio pura (testável sem rede).
 * O handler MSW só traduz HTTP ↔ domínio — espelha PixService + controller no Spring.
 */
import { http, HttpResponse } from 'msw'
import type { Db, Transfer } from '../data/db'
import { getDb } from '../data/db'
import { createCorrelationId } from '@/shared/utils/id'
import type { ApiErrorBody } from '@/shared/types/api'

export type ExecutePixInput = {
  beneficiaryId: string
  amountCents: number
  idempotencyKey: string
}

export function executePix(db: Db, input: ExecutePixInput): Transfer {
  const cached = db.idempotency.get(input.idempotencyKey)
  if (cached) return cached

  const beneficiary = db.beneficiaries.find((item) => item.id === input.beneficiaryId)
  if (!beneficiary) throw new Error('BENEFICIARY_NOT_FOUND')
  if (!Number.isInteger(input.amountCents) || input.amountCents <= 0) {
    throw new Error('INVALID_AMOUNT')
  }
  if (db.availableCents < input.amountCents) throw new Error('INSUFFICIENT_FUNDS')

  db.availableCents -= input.amountCents
  const transfer: Transfer = {
    id: crypto.randomUUID(),
    beneficiaryId: input.beneficiaryId,
    amountCents: input.amountCents,
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
  }
  db.transfers.push(transfer)
  db.transactions.unshift({
    id: crypto.randomUUID(),
    type: 'PIX_OUT',
    amountCents: input.amountCents,
    description: `PIX para ${beneficiary.name}`,
    createdAt: transfer.createdAt,
    counterparty: beneficiary.name,
  })
  db.idempotency.set(input.idempotencyKey, transfer)
  return transfer
}

const ERROR_STATUS: Record<string, number> = {
  BENEFICIARY_NOT_FOUND: 400,
  INVALID_AMOUNT: 400,
  INSUFFICIENT_FUNDS: 409,
}

const ERROR_MESSAGE: Record<string, string> = {
  BENEFICIARY_NOT_FOUND: 'Favorecido não encontrado.',
  INVALID_AMOUNT: 'O valor da transferência deve ser positivo.',
  INSUFFICIENT_FUNDS: 'Saldo insuficiente para completar essa transferência.',
}

function toApiError(code: string, correlationId: string): ApiErrorBody {
  return {
    code,
    message: ERROR_MESSAGE[code] ?? 'Erro ao processar a transferência.',
    correlationId,
  }
}

export const transfersHandlers = [
  http.post('*/api/v1/transfers/pix', async ({ request }) => {
    const db = getDb()
    const correlationId = request.headers.get('X-Correlation-Id') ?? createCorrelationId()
    const idempotencyKey = request.headers.get('Idempotency-Key') ?? crypto.randomUUID()
    const body = (await request.json()) as { beneficiaryId: string; amountCents: number }
    try {
      const transfer = executePix(db, { ...body, idempotencyKey })
      return HttpResponse.json(transfer, { status: 201 })
    } catch (error) {
      const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR'
      return HttpResponse.json(toApiError(code, correlationId), {
        status: ERROR_STATUS[code] ?? 400,
      })
    }
  }),

  http.get('*/api/v1/transfers/:id', ({ params }) => {
    const db = getDb()
    const transfer = db.transfers.find((item) => item.id === params['id'])
    if (!transfer) {
      return HttpResponse.json(toApiError('TRANSFER_NOT_FOUND', createCorrelationId()), {
        status: 404,
      })
    }
    return HttpResponse.json(transfer)
  }),
]
```

Create `src/app/mocks/handlers/auth.handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw'
import { getDb } from '../data/db'
import { createCorrelationId } from '@/shared/utils/id'
import type { ApiErrorBody } from '@/shared/types/api'

const MOCK_TOKEN = 'mock-jwt-demo'

export const authHandlers = [
  http.post('*/api/v1/auth/login', async ({ request }) => {
    const correlationId = request.headers.get('X-Correlation-Id') ?? createCorrelationId()
    const { email, password } = (await request.json()) as { email: string; password: string }
    const db = getDb()
    if (email !== db.user.email || password !== db.user.password) {
      const error: ApiErrorBody = {
        code: 'INVALID_CREDENTIALS',
        message: 'Email ou senha inválidos.',
        correlationId,
      }
      return HttpResponse.json(error, { status: 401 })
    }
    return HttpResponse.json({
      accessToken: MOCK_TOKEN,
      user: { id: db.user.id, name: db.user.name, email: db.user.email },
    })
  }),
]
```

Create `src/app/mocks/handlers/wallet.handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw'
import { getDb } from '../data/db'

export const walletHandlers = [
  http.get('*/api/v1/wallet/balance', () => {
    const db = getDb()
    return HttpResponse.json({ availableCents: db.availableCents, currency: 'BRL' })
  }),

  http.get('*/api/v1/wallet/transactions', ({ request }) => {
    const db = getDb()
    const url = new URL(request.url)
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    const type = url.searchParams.get('type')
    const items = db.transactions.filter((transaction) => {
      if (from && transaction.createdAt < from) return false
      if (to && transaction.createdAt > to) return false
      if (type && type !== 'ALL' && transaction.type !== type) return false
      return true
    })
    return HttpResponse.json({ items })
  }),
]
```

Create `src/app/mocks/handlers/beneficiaries.handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw'
import { getDb } from '../data/db'
import { createCorrelationId } from '@/shared/utils/id'
import type { ApiErrorBody } from '@/shared/types/api'

export const beneficiariesHandlers = [
  http.get('*/api/v1/beneficiaries', () => {
    return HttpResponse.json({ items: getDb().beneficiaries })
  }),

  http.post('*/api/v1/beneficiaries', async ({ request }) => {
    const db = getDb()
    const { name, pixKey } = (await request.json()) as { name: string; pixKey: string }
    if (!name?.trim() || !pixKey?.trim()) {
      const error: ApiErrorBody = {
        code: 'INVALID_BENEFICIARY',
        message: 'Nome e chave PIX são obrigatórios.',
        correlationId: request.headers.get('X-Correlation-Id') ?? createCorrelationId(),
      }
      return HttpResponse.json(error, { status: 400 })
    }
    const beneficiary = { id: crypto.randomUUID(), name, pixKey }
    db.beneficiaries.push(beneficiary)
    return HttpResponse.json(beneficiary, { status: 201 })
  }),

  http.delete('*/api/v1/beneficiaries/:id', ({ params }) => {
    const db = getDb()
    const index = db.beneficiaries.findIndex((item) => item.id === params['id'])
    if (index === -1) {
      const error: ApiErrorBody = {
        code: 'BENEFICIARY_NOT_FOUND',
        message: 'Favorecido não encontrado.',
        correlationId: createCorrelationId(),
      }
      return HttpResponse.json(error, { status: 404 })
    }
    db.beneficiaries.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
```

Create `src/app/mocks/handlers/index.ts`:

```typescript
import { authHandlers } from './auth.handlers'
import { walletHandlers } from './wallet.handlers'
import { beneficiariesHandlers } from './beneficiaries.handlers'
import { transfersHandlers } from './transfers.handlers'

export const handlers = [
  ...authHandlers,
  ...walletHandlers,
  ...beneficiariesHandlers,
  ...transfersHandlers,
]
```

Create `src/app/mocks/browser.ts`:

```typescript
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
```

- [ ] **Step 6: Bootstrap MSW em `main.ts`**

Replace `src/main.ts` with:

```typescript
import { bootstrapApplication } from '@angular/platform-browser'
import { appConfig } from './app/app.config'
import { AppComponent } from './app/app.component'

async function prepare(): Promise<void> {
  if (!isDevModeSafe()) return
  const { worker } = await import('./app/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

function isDevModeSafe(): boolean {
  // ng serve = development; evita MSW em produção
  return typeof ngDevMode !== 'undefined' ? !!ngDevMode : true
}

declare const ngDevMode: boolean | undefined

prepare()
  .then(() => bootstrapApplication(AppComponent, appConfig))
  .catch((err) => console.error(err))
```

Se `ngDevMode` complicar no ambiente, usar alternativa simples e documentada:

```typescript
async function prepare(): Promise<void> {
  if (!(globalThis as { ng?: unknown }).ng && location.hostname === 'localhost') {
    const { worker } = await import('./app/mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }
}
```

Preferir flag explícita se necessário: só iniciar MSW quando `!environment.production` — criar `src/app/core/env.ts` com `export const enableMsw = true` e desligar para apontar Spring.

Versão canônica para o plano (simples):

```typescript
import { bootstrapApplication } from '@angular/platform-browser'
import { appConfig } from './app/app.config'
import { AppComponent } from './app/app.component'

async function main(): Promise<void> {
  const { worker } = await import('./app/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
  await bootstrapApplication(AppComponent, appConfig)
}

main().catch(console.error)
```

(Documentar no README: comentar o `worker.start` para usar Spring.)

- [ ] **Step 7: Rodar testes executePix — PASS**

```bash
npx ng test --no-watch --browsers=ChromeHeadless --include='**/transfers.handlers.spec.ts'
```

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json public/mockServiceWorker.js src/main.ts src/app/mocks
git commit -m "$(cat <<'EOF'
feat: adiciona MSW e regra pura executePix

Handlers cobrem auth, wallet, favorecidos e PIX no contrato /api/v1.
EOF
)"
```

---

### Task 3: Core HTTP + Auth (service, guard, login) — TDD auth

**Files:**
- Create: `src/app/core/http/api-error.ts`, `src/app/core/http/api.interceptor.ts`
- Create: `src/app/core/auth/token.storage.ts`, `auth.service.ts`, `auth.service.spec.ts`, `auth.guard.ts`
- Create: `src/app/features/auth/types.ts`, `auth.api.ts`, `login.page.ts`
- Modify: `src/app/app.config.ts`, `src/app/app.routes.ts`, `src/app/app.component.*`

**Interfaces:**
- Consumes: handlers MSW, `ApiErrorBody`, `createCorrelationId`, `createIdempotencyKey`
- Produces:
  - `TokenStorage`: `get()`, `set(token)`, `clear()`
  - `AuthService`: `user` signal, `token` signal, `login(email, password)`, `logout()`, `isAuthenticated()`
  - `authGuard: CanActivateFn`
  - `AuthApi.login(body) => Promise/Observable LoginResponse`
  - `ApiError` class com `status`, `code`, `message`, `correlationId`

- [ ] **Step 1: Teste falhando do AuthService**

Create `src/app/core/auth/auth.service.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing'
import { AuthService } from './auth.service'
import { TokenStorage } from './token.storage'

describe('AuthService', () => {
  let service: AuthService
  let http: HttpTestingController
  let storage: TokenStorage

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AuthService, TokenStorage],
    })
    service = TestBed.inject(AuthService)
    http = TestBed.inject(HttpTestingController)
    storage = TestBed.inject(TokenStorage)
    storage.clear()
  })

  afterEach(() => http.verify())

  it('login grava token e user', () => {
    service.login('demo@vuemind.dev', 'demo123').subscribe()
    const req = http.expectOne('/api/v1/auth/login')
    req.flush({
      accessToken: 'mock-jwt-demo',
      user: { id: 'u1', name: 'Marion Demo', email: 'demo@vuemind.dev' },
    })
    expect(service.isAuthenticated()).toBe(true)
    expect(service.token()).toBe('mock-jwt-demo')
    expect(storage.get()).toBe('mock-jwt-demo')
  })

  it('logout limpa sessão', () => {
    storage.set('mock-jwt-demo')
    service.logout()
    expect(service.isAuthenticated()).toBe(false)
    expect(storage.get()).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar e ver falha**

```bash
npx ng test --no-watch --browsers=ChromeHeadless --include='**/auth.service.spec.ts'
```

Expected: FAIL

- [ ] **Step 3: Implementar core auth + HTTP**

Create `src/app/core/auth/token.storage.ts`:

```typescript
import { Injectable } from '@angular/core'

const KEY = 'angularmind.token'

@Injectable({ providedIn: 'root' })
export class TokenStorage {
  get(): string | null {
    return sessionStorage.getItem(KEY)
  }

  set(token: string): void {
    sessionStorage.setItem(KEY, token)
  }

  clear(): void {
    sessionStorage.removeItem(KEY)
  }
}
```

Create `src/app/core/http/api-error.ts`:

```typescript
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly correlationId: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
```

Create `src/app/core/http/api.interceptor.ts`:

```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http'
import { inject } from '@angular/core'
import { catchError, throwError } from 'rxjs'
import { TokenStorage } from '../auth/token.storage'
import { createCorrelationId } from '@/shared/utils/id'
import { ApiError } from './api-error'
import type { ApiErrorBody } from '@/shared/types/api'

/** Interceptor = equivalente ao shared/http do Vue: Bearer + correlation id. */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenStorage).get()
  const correlationId = createCorrelationId()
  let headers = req.headers.set('X-Correlation-Id', correlationId).set('Accept', 'application/json')
  if (token) headers = headers.set('Authorization', `Bearer ${token}`)

  return next(req.clone({ headers })).pipe(
    catchError((err: HttpErrorResponse) => {
      const body = err.error as ApiErrorBody | undefined
      return throwError(
        () =>
          new ApiError(
            err.status,
            body?.code ?? 'HTTP_ERROR',
            body?.message ?? err.statusText,
            body?.correlationId ?? correlationId,
          ),
      )
    }),
  )
}
```

Create `src/app/features/auth/types.ts`:

```typescript
export type User = { id: string; name: string; email: string }
export type LoginRequest = { email: string; password: string }
export type LoginResponse = { accessToken: string; user: User }
```

Create `src/app/features/auth/auth.api.ts`:

```typescript
import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import type { LoginRequest, LoginResponse } from './types'

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient)

  login(body: LoginRequest) {
    return this.http.post<LoginResponse>('/api/v1/auth/login', body)
  }
}
```

Create `src/app/core/auth/auth.service.ts`:

```typescript
import { Injectable, computed, inject, signal } from '@angular/core'
import { tap } from 'rxjs'
import { AuthApi } from '@/features/auth/auth.api'
import type { User } from '@/features/auth/types'
import { TokenStorage } from './token.storage'

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApi)
  private readonly storage = inject(TokenStorage)

  readonly token = signal<string | null>(this.storage.get())
  readonly user = signal<User | null>(null)
  readonly isAuthenticated = computed(() => !!this.token())

  login(email: string, password: string) {
    return this.api.login({ email, password }).pipe(
      tap((res) => {
        this.storage.set(res.accessToken)
        this.token.set(res.accessToken)
        this.user.set(res.user)
      }),
    )
  }

  logout(): void {
    this.storage.clear()
    this.token.set(null)
    this.user.set(null)
  }
}
```

Create `src/app/core/auth/auth.guard.ts`:

```typescript
import { inject } from '@angular/core'
import { CanActivateFn, Router } from '@angular/router'
import { AuthService } from './auth.service'

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService)
  const router = inject(Router)
  if (auth.isAuthenticated()) return true
  return router.createUrlTree(['/login'])
}
```

Create `src/app/features/auth/login.page.ts` (standalone component, inline template):

```typescript
import { Component, inject, signal } from '@angular/core'
import { Router } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { AuthService } from '@/core/auth/auth.service'
import { ApiError } from '@/core/http/api-error'

@Component({
  standalone: true,
  selector: 'app-login-page',
  imports: [FormsModule],
  template: `
    <section class="login">
      <h1>AngularMind</h1>
      <p>Carteira digital de estudo</p>
      <form (ngSubmit)="submit()">
        <label>Email <input name="email" [(ngModel)]="email" type="email" required /></label>
        <label>Senha <input name="password" [(ngModel)]="password" type="password" required /></label>
        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
        <button type="submit" [disabled]="loading()">Entrar</button>
      </form>
    </section>
  `,
  styles: [
    `
      .login { max-width: 360px; margin: 4rem auto; display: grid; gap: 1rem; }
      label { display: grid; gap: 0.25rem; }
      .error { color: #b00020; }
    `,
  ],
})
export class LoginPage {
  private readonly auth = inject(AuthService)
  private readonly router = inject(Router)

  email = 'demo@vuemind.dev'
  password = 'demo123'
  readonly loading = signal(false)
  readonly error = signal<string | null>(null)

  submit(): void {
    this.loading.set(true)
    this.error.set(null)
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading.set(false)
        void this.router.navigateByUrl('/dashboard')
      },
      error: (err: unknown) => {
        this.loading.set(false)
        this.error.set(err instanceof ApiError ? err.message : 'Falha no login')
      },
    })
  }
}
```

- [ ] **Step 4: Wire `app.config` e rotas mínimas**

`src/app/app.config.ts`:

```typescript
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core'
import { provideRouter } from '@angular/router'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { routes } from './app.routes'
import { apiInterceptor } from './core/http/api.interceptor'

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiInterceptor])),
  ],
}
```

`src/app/app.routes.ts` (rotas das features virão nas tasks seguintes; stub dashboard):

```typescript
import { Routes } from '@angular/router'
import { authGuard } from './core/auth/auth.guard'
import { LoginPage } from './features/auth/login.page'

export const routes: Routes = [
  { path: 'login', component: LoginPage },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/wallet/dashboard.page').then((m) => m.DashboardPage),
  },
]
```

`AppComponent` template: só `<router-outlet />`.

- [ ] **Step 5: Stub mínimo `DashboardPage`** para a rota compilar

Create `src/app/features/wallet/dashboard.page.ts`:

```typescript
import { Component } from '@angular/core'

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  template: `<p>Dashboard (Task 5)</p>`,
})
export class DashboardPage {}
```

- [ ] **Step 6: Testes auth PASS + login manual smoke**

```bash
npx ng test --no-watch --browsers=ChromeHeadless --include='**/auth.service.spec.ts'
npx ng serve --port 4200
```

Abrir login, entrar com demo — deve redirecionar ao stub dashboard (MSW ativo).

- [ ] **Step 7: Commit**

```bash
git add src/app/core src/app/features/auth src/app/features/wallet/dashboard.page.ts \
  src/app/app.config.ts src/app/app.routes.ts src/app/app.component.ts src/app/app.component.html
git commit -m "$(cat <<'EOF'
feat: auth com interceptor, signals e guard

Login mock grava token em sessionStorage e protege /dashboard.
EOF
)"
```

---

### Task 4: Shared UI + AppShell + estilos base

**Files:**
- Create: componentes em `src/app/shared/ui/*`
- Modify: `src/styles.css`, `app.component.*`, rotas com shell

**Interfaces:**
- Consumes: `AuthService.logout`
- Produces: `AppShellComponent` com nav + `<router-outlet />`; UI atoms usados pelas pages

- [ ] **Step 1: Estilos base**

`src/styles.css`:

```css
:root {
  --bg: #f6f7f9;
  --fg: #1a1d23;
  --accent: #0b6e4f;
  --danger: #b00020;
  --border: #d5d9e0;
  --radius: 8px;
  --font: "IBM Plex Sans", "Segoe UI", sans-serif;
}

* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: var(--font);
  background: linear-gradient(160deg, #eef3f0 0%, var(--bg) 40%, #e8eef8 100%);
  color: var(--fg);
  min-height: 100vh;
}
a { color: var(--accent); }
button, input, select {
  font: inherit;
}
```

- [ ] **Step 2: Componentes UI enxutos**

Create `src/app/shared/ui/app-button.component.ts`:

```typescript
import { Component, Input } from '@angular/core'

@Component({
  standalone: true,
  selector: 'app-button',
  template: `<button [type]="type" [disabled]="disabled"><ng-content /></button>`,
  styles: [
    `
      button {
        background: var(--accent);
        color: white;
        border: 0;
        border-radius: var(--radius);
        padding: 0.6rem 1rem;
        cursor: pointer;
      }
      button:disabled { opacity: 0.5; cursor: not-allowed; }
    `,
  ],
})
export class AppButtonComponent {
  @Input() type: 'button' | 'submit' = 'button'
  @Input() disabled = false
}
```

Create `src/app/shared/ui/app-input.component.ts` — wrapper simples com label + `ngModel` via `ControlValueAccessor` **ou** (YAGNI) apenas documentar que pages usam `<input>` nativo + styles. Preferir inputs nativos nas pages e só:

- `LoadingBlockComponent` — texto “Carregando…”
- `ErrorBannerComponent` — `@Input() message`
- `EmptyStateComponent` — `@Input() message`
- `AppShellComponent` — nav links

Create `src/app/shared/ui/loading-block.component.ts`:

```typescript
import { Component } from '@angular/core'

@Component({
  standalone: true,
  selector: 'app-loading-block',
  template: `<p class="loading">Carregando…</p>`,
  styles: [`.loading { opacity: 0.7; padding: 1rem 0; }`],
})
export class LoadingBlockComponent {}
```

Create `src/app/shared/ui/error-banner.component.ts`:

```typescript
import { Component, Input } from '@angular/core'

@Component({
  standalone: true,
  selector: 'app-error-banner',
  template: `@if (message) { <p class="error" role="alert">{{ message }}</p> }`,
  styles: [`.error { background: #fdecea; color: var(--danger); padding: 0.75rem; border-radius: var(--radius); }`],
})
export class ErrorBannerComponent {
  @Input() message: string | null = null
}
```

Create `src/app/shared/ui/empty-state.component.ts`:

```typescript
import { Component, Input } from '@angular/core'

@Component({
  standalone: true,
  selector: 'app-empty-state',
  template: `<p class="empty">{{ message }}</p>`,
  styles: [`.empty { opacity: 0.7; padding: 1.5rem 0; }`],
})
export class EmptyStateComponent {
  @Input() message = 'Nada por aqui.'
}
```

Create `src/app/shared/ui/app-shell.component.ts`:

```typescript
import { Component, inject } from '@angular/core'
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router'
import { AuthService } from '@/core/auth/auth.service'
import { Router } from '@angular/router'

@Component({
  standalone: true,
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <header>
        <strong>AngularMind</strong>
        <nav>
          <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/transactions" routerLinkActive="active">Extrato</a>
          <a routerLink="/beneficiaries" routerLinkActive="active">Favorecidos</a>
          <a routerLink="/transfers/pix" routerLinkActive="active">PIX</a>
          <button type="button" (click)="logout()">Sair</button>
        </nav>
      </header>
      <main><router-outlet /></main>
    </div>
  `,
  styles: [
    `
      .shell { max-width: 960px; margin: 0 auto; padding: 1rem; }
      header {
        display: flex; justify-content: space-between; align-items: center;
        gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;
      }
      nav { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
      a.active { font-weight: 700; }
      button {
        background: transparent; border: 1px solid var(--border);
        border-radius: var(--radius); padding: 0.35rem 0.75rem; cursor: pointer;
      }
    `,
  ],
})
export class AppShellComponent {
  private readonly auth = inject(AuthService)
  private readonly router = inject(Router)

  logout(): void {
    this.auth.logout()
    void this.router.navigateByUrl('/login')
  }
}
```

- [ ] **Step 3: Rotas com shell layout**

Atualizar `app.routes.ts`:

```typescript
import { Routes } from '@angular/router'
import { authGuard } from './core/auth/auth.guard'
import { LoginPage } from './features/auth/login.page'
import { AppShellComponent } from './shared/ui/app-shell.component'

export const routes: Routes = [
  { path: 'login', component: LoginPage },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/wallet/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./features/wallet/transactions.page').then((m) => m.TransactionsPage),
      },
      {
        path: 'beneficiaries',
        loadComponent: () =>
          import('./features/beneficiaries/beneficiaries.page').then((m) => m.BeneficiariesPage),
      },
      {
        path: 'transfers/pix',
        loadComponent: () =>
          import('./features/transfers/transfer-pix.page').then((m) => m.TransferPixPage),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
]
```

Criar stubs temporários `transactions.page.ts`, `beneficiaries.page.ts`, `transfer-pix.page.ts` com template `<!-- Task N -->` se ainda não existirem — substituídos nas tasks 5–7.

- [ ] **Step 4: Commit**

```bash
git add src/styles.css src/app/shared/ui src/app/app.routes.ts
git commit -m "$(cat <<'EOF'
feat: shell de navegação e componentes UI base

Nav autenticada com logout e estados loading/error/empty reutilizáveis.
EOF
)"
```

---

### Task 5: Feature wallet — saldo, dashboard, extrato

**Files:**
- Create: `src/app/features/wallet/types.ts`, `wallet.api.ts`, `wallet.service.ts`
- Modify: `dashboard.page.ts`, create `transactions.page.ts`

**Interfaces:**
- Consumes: `HttpClient`, UI shared
- Produces:
  - `WalletApi.getBalance()`, `getTransactions(filters?)`
  - `WalletService`: signals `balanceCents`, `transactions`, `loading`, `error`; métodos `loadBalance()`, `loadTransactions(type?)`

- [ ] **Step 1: Types + API + Service**

`types.ts`:

```typescript
export type Balance = { availableCents: number; currency: string }
export type TransactionType = 'PIX_OUT' | 'PIX_IN' | 'TED'
export type Transaction = {
  id: string
  type: TransactionType
  amountCents: number
  description: string
  createdAt: string
  counterparty: string
}
export type TransactionsResponse = { items: Transaction[] }
```

`wallet.api.ts`:

```typescript
import { Injectable, inject } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import type { Balance, TransactionsResponse, TransactionType } from './types'

@Injectable({ providedIn: 'root' })
export class WalletApi {
  private readonly http = inject(HttpClient)

  getBalance() {
    return this.http.get<Balance>('/api/v1/wallet/balance')
  }

  getTransactions(type?: TransactionType | 'ALL') {
    let params = new HttpParams()
    if (type && type !== 'ALL') params = params.set('type', type)
    return this.http.get<TransactionsResponse>('/api/v1/wallet/transactions', { params })
  }
}
```

`wallet.service.ts`:

```typescript
import { Injectable, inject, signal } from '@angular/core'
import { WalletApi } from './wallet.api'
import type { Transaction, TransactionType } from './types'
import { ApiError } from '@/core/http/api-error'

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly api = inject(WalletApi)

  readonly balanceCents = signal<number | null>(null)
  readonly transactions = signal<Transaction[]>([])
  readonly loading = signal(false)
  readonly error = signal<string | null>(null)

  loadBalance(): void {
    this.loading.set(true)
    this.error.set(null)
    this.api.getBalance().subscribe({
      next: (b) => {
        this.balanceCents.set(b.availableCents)
        this.loading.set(false)
      },
      error: (err: unknown) => {
        this.loading.set(false)
        this.error.set(err instanceof ApiError ? err.message : 'Erro ao carregar saldo')
      },
    })
  }

  loadTransactions(type: TransactionType | 'ALL' = 'ALL'): void {
    this.loading.set(true)
    this.error.set(null)
    this.api.getTransactions(type).subscribe({
      next: (res) => {
        this.transactions.set(res.items)
        this.loading.set(false)
      },
      error: (err: unknown) => {
        this.loading.set(false)
        this.error.set(err instanceof ApiError ? err.message : 'Erro ao carregar extrato')
      },
    })
  }
}
```

- [ ] **Step 2: Dashboard + Extrato pages**

`dashboard.page.ts`:

```typescript
import { Component, OnInit, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { WalletService } from './wallet.service'
import { formatCents } from '@/shared/utils/money'
import { LoadingBlockComponent } from '@/shared/ui/loading-block.component'
import { ErrorBannerComponent } from '@/shared/ui/error-banner.component'

@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  imports: [RouterLink, LoadingBlockComponent, ErrorBannerComponent],
  template: `
    <h1>Dashboard</h1>
    <app-error-banner [message]="wallet.error()" />
    @if (wallet.loading() && wallet.balanceCents() === null) {
      <app-loading-block />
    } @else if (wallet.balanceCents() !== null) {
      <p class="balance">Saldo: {{ format(wallet.balanceCents()!) }}</p>
    }
    <p>
      <a routerLink="/transfers/pix">Fazer PIX</a> ·
      <a routerLink="/transactions">Ver extrato</a> ·
      <a routerLink="/beneficiaries">Favorecidos</a>
    </p>
  `,
  styles: [`.balance { font-size: 1.75rem; font-weight: 700; }`],
})
export class DashboardPage implements OnInit {
  readonly wallet = inject(WalletService)
  format = formatCents

  ngOnInit(): void {
    this.wallet.loadBalance()
  }
}
```

`transactions.page.ts`:

```typescript
import { Component, OnInit, inject, signal } from '@angular/core'
import { WalletService } from './wallet.service'
import { formatCents } from '@/shared/utils/money'
import type { TransactionType } from './types'
import { LoadingBlockComponent } from '@/shared/ui/loading-block.component'
import { ErrorBannerComponent } from '@/shared/ui/error-banner.component'
import { EmptyStateComponent } from '@/shared/ui/empty-state.component'

@Component({
  standalone: true,
  selector: 'app-transactions-page',
  imports: [LoadingBlockComponent, ErrorBannerComponent, EmptyStateComponent],
  template: `
    <h1>Extrato</h1>
    <label>
      Tipo
      <select [value]="type()" (change)="onType($event)">
        <option value="ALL">Todos</option>
        <option value="PIX_OUT">PIX saída</option>
        <option value="PIX_IN">PIX entrada</option>
        <option value="TED">TED</option>
      </select>
    </label>
    <app-error-banner [message]="wallet.error()" />
    @if (wallet.loading()) {
      <app-loading-block />
    } @else if (wallet.transactions().length === 0) {
      <app-empty-state message="Nenhuma movimentação neste filtro." />
    } @else {
      <ul>
        @for (tx of wallet.transactions(); track tx.id) {
          <li>
            <strong>{{ tx.type }}</strong> — {{ format(tx.amountCents) }}
            <br />{{ tx.description }} · {{ tx.counterparty }}
          </li>
        }
      </ul>
    }
  `,
})
export class TransactionsPage implements OnInit {
  readonly wallet = inject(WalletService)
  readonly type = signal<TransactionType | 'ALL'>('ALL')
  format = formatCents

  ngOnInit(): void {
    this.wallet.loadTransactions(this.type())
  }

  onType(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as TransactionType | 'ALL'
    this.type.set(value)
    this.wallet.loadTransactions(value)
  }
}
```

- [ ] **Step 3: Verificar manualmente**

```bash
npx ng serve --port 4200
```

Login → dashboard mostra R$ 2.500,00 → Extrato lista PIX_IN seed → filtro PIX_OUT pode ficar vazio.

- [ ] **Step 4: Commit**

```bash
git add src/app/features/wallet
git commit -m "$(cat <<'EOF'
feat: wallet com saldo e extrato filtrável

Dashboard e lista de transações via WalletService com signals.
EOF
)"
```

---

### Task 6: Feature beneficiaries — listar / criar / remover

**Files:**
- Create: `types.ts`, `beneficiaries.api.ts`, `beneficiaries.service.ts`, `beneficiaries.page.ts`

**Interfaces:**
- Consumes: `HttpClient`, UI shared
- Produces: `BeneficiariesService` com `items`, `loading`, `error`, `load()`, `create(name, pixKey)`, `remove(id)`

- [ ] **Step 1: API + Service + Page**

`types.ts`:

```typescript
export type Beneficiary = { id: string; name: string; pixKey: string }
export type CreateBeneficiaryRequest = { name: string; pixKey: string }
export type BeneficiariesResponse = { items: Beneficiary[] }
```

`beneficiaries.api.ts`:

```typescript
import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import type { Beneficiary, BeneficiariesResponse, CreateBeneficiaryRequest } from './types'

@Injectable({ providedIn: 'root' })
export class BeneficiariesApi {
  private readonly http = inject(HttpClient)

  list() {
    return this.http.get<BeneficiariesResponse>('/api/v1/beneficiaries')
  }

  create(body: CreateBeneficiaryRequest) {
    return this.http.post<Beneficiary>('/api/v1/beneficiaries', body)
  }

  remove(id: string) {
    return this.http.delete<void>(`/api/v1/beneficiaries/${id}`)
  }
}
```

`beneficiaries.service.ts`:

```typescript
import { Injectable, inject, signal } from '@angular/core'
import { BeneficiariesApi } from './beneficiaries.api'
import type { Beneficiary } from './types'
import { ApiError } from '@/core/http/api-error'

@Injectable({ providedIn: 'root' })
export class BeneficiariesService {
  private readonly api = inject(BeneficiariesApi)
  readonly items = signal<Beneficiary[]>([])
  readonly loading = signal(false)
  readonly error = signal<string | null>(null)

  load(): void {
    this.loading.set(true)
    this.error.set(null)
    this.api.list().subscribe({
      next: (res) => {
        this.items.set(res.items)
        this.loading.set(false)
      },
      error: (err: unknown) => {
        this.loading.set(false)
        this.error.set(err instanceof ApiError ? err.message : 'Erro ao listar favorecidos')
      },
    })
  }

  create(name: string, pixKey: string): void {
    this.error.set(null)
    this.api.create({ name, pixKey }).subscribe({
      next: () => this.load(),
      error: (err: unknown) => {
        this.error.set(err instanceof ApiError ? err.message : 'Erro ao criar favorecido')
      },
    })
  }

  remove(id: string): void {
    this.error.set(null)
    this.api.remove(id).subscribe({
      next: () => this.load(),
      error: (err: unknown) => {
        this.error.set(err instanceof ApiError ? err.message : 'Erro ao remover favorecido')
      },
    })
  }
}
```

`beneficiaries.page.ts`: formulário nome + chave PIX; lista com botão Remover; usar `LoadingBlock`, `ErrorBanner`, `EmptyState`, `AppButton`.

```typescript
import { Component, OnInit, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BeneficiariesService } from './beneficiaries.service'
import { LoadingBlockComponent } from '@/shared/ui/loading-block.component'
import { ErrorBannerComponent } from '@/shared/ui/error-banner.component'
import { EmptyStateComponent } from '@/shared/ui/empty-state.component'
import { AppButtonComponent } from '@/shared/ui/app-button.component'

@Component({
  standalone: true,
  selector: 'app-beneficiaries-page',
  imports: [
    FormsModule,
    LoadingBlockComponent,
    ErrorBannerComponent,
    EmptyStateComponent,
    AppButtonComponent,
  ],
  template: `
    <h1>Favorecidos</h1>
    <app-error-banner [message]="svc.error()" />
    <form (ngSubmit)="add()" class="form">
      <input name="name" [(ngModel)]="name" placeholder="Nome" required />
      <input name="pixKey" [(ngModel)]="pixKey" placeholder="Chave PIX" required />
      <app-button type="submit">Adicionar</app-button>
    </form>
    @if (svc.loading()) {
      <app-loading-block />
    } @else if (svc.items().length === 0) {
      <app-empty-state message="Nenhum favorecido cadastrado." />
    } @else {
      <ul>
        @for (b of svc.items(); track b.id) {
          <li>
            {{ b.name }} — {{ b.pixKey }}
            <button type="button" (click)="svc.remove(b.id)">Remover</button>
          </li>
        }
      </ul>
    }
  `,
  styles: [
    `
      .form { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
      input { padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius); }
    `,
  ],
})
export class BeneficiariesPage implements OnInit {
  readonly svc = inject(BeneficiariesService)
  name = ''
  pixKey = ''

  ngOnInit(): void {
    this.svc.load()
  }

  add(): void {
    this.svc.create(this.name, this.pixKey)
    this.name = ''
    this.pixKey = ''
  }
}
```

- [ ] **Step 2: Smoke manual** — criar e remover favorecido

- [ ] **Step 3: Commit**

```bash
git add src/app/features/beneficiaries
git commit -m "$(cat <<'EOF'
feat: CRUD de favorecidos

Lista, cria e remove favorecidos contra o mock MSW.
EOF
)"
```

---

### Task 7: Feature transfers — fluxo PIX (form → confirma → comprovante)

**Files:**
- Create: `types.ts`, `transfers.api.ts`, `transfers.service.ts`, `transfer-pix.page.ts`

**Interfaces:**
- Consumes: `BeneficiariesService` (ou `BeneficiariesApi.list`), `WalletService.loadBalance`, `createIdempotencyKey`
- Produces: `TransfersService.confirmPix(beneficiaryId, amountCents)` enviando `Idempotency-Key` **só no confirm**

- [ ] **Step 1: API + Service**

`types.ts`:

```typescript
export type CreatePixRequest = { beneficiaryId: string; amountCents: number }
export type Transfer = {
  id: string
  beneficiaryId: string
  amountCents: number
  status: 'COMPLETED'
  createdAt: string
}
```

`transfers.api.ts`:

```typescript
import { Injectable, inject } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import type { CreatePixRequest, Transfer } from './types'

@Injectable({ providedIn: 'root' })
export class TransfersApi {
  private readonly http = inject(HttpClient)

  pix(body: CreatePixRequest, idempotencyKey: string) {
    const headers = new HttpHeaders({ 'Idempotency-Key': idempotencyKey })
    return this.http.post<Transfer>('/api/v1/transfers/pix', body, { headers })
  }
}
```

`transfers.service.ts`:

```typescript
import { Injectable, inject, signal } from '@angular/core'
import { TransfersApi } from './transfers.api'
import type { Transfer } from './types'
import { createIdempotencyKey } from '@/shared/utils/id'
import { ApiError } from '@/core/http/api-error'

@Injectable({ providedIn: 'root' })
export class TransfersService {
  private readonly api = inject(TransfersApi)
  readonly lastTransfer = signal<Transfer | null>(null)
  readonly loading = signal(false)
  readonly error = signal<string | null>(null)
  private idempotencyKey: string | null = null

  /** Gera a chave uma vez ao entrar no step de confirmação — não a cada keystroke. */
  beginConfirm(): void {
    this.idempotencyKey = createIdempotencyKey()
    this.error.set(null)
  }

  confirmPix(beneficiaryId: string, amountCents: number, onDone?: () => void): void {
    if (!this.idempotencyKey) this.beginConfirm()
    this.loading.set(true)
    this.error.set(null)
    this.api.pix({ beneficiaryId, amountCents }, this.idempotencyKey!).subscribe({
      next: (transfer) => {
        this.lastTransfer.set(transfer)
        this.loading.set(false)
        this.idempotencyKey = null
        onDone?.()
      },
      error: (err: unknown) => {
        this.loading.set(false)
        this.error.set(err instanceof ApiError ? err.message : 'Erro no PIX')
      },
    })
  }

  reset(): void {
    this.lastTransfer.set(null)
    this.error.set(null)
    this.idempotencyKey = null
  }
}
```

- [ ] **Step 2: Page com 3 steps**

Create `src/app/features/transfers/transfer-pix.page.ts`:

```typescript
import { Component, OnInit, inject, signal } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { BeneficiariesService } from '@/features/beneficiaries/beneficiaries.service'
import { WalletService } from '@/features/wallet/wallet.service'
import { TransfersService } from './transfers.service'
import { formatCents, parseReaisToCents } from '@/shared/utils/money'
import { LoadingBlockComponent } from '@/shared/ui/loading-block.component'
import { ErrorBannerComponent } from '@/shared/ui/error-banner.component'
import { AppButtonComponent } from '@/shared/ui/app-button.component'

type Step = 'form' | 'confirm' | 'receipt'

@Component({
  standalone: true,
  selector: 'app-transfer-pix-page',
  imports: [FormsModule, LoadingBlockComponent, ErrorBannerComponent, AppButtonComponent],
  template: `
    <h1>PIX</h1>
    <app-error-banner [message]="formError() || transfers.error()" />

    @if (step() === 'form') {
      <form (ngSubmit)="goConfirm()" class="stack">
        <label>
          Favorecido
          <select name="beneficiaryId" [(ngModel)]="beneficiaryId" required>
            <option value="">Selecione…</option>
            @for (b of beneficiaries.items(); track b.id) {
              <option [value]="b.id">{{ b.name }} — {{ b.pixKey }}</option>
            }
          </select>
        </label>
        <label>
          Valor (R$)
          <input name="amount" [(ngModel)]="amountReais" placeholder="10,50" required />
        </label>
        <app-button type="submit">Continuar</app-button>
      </form>
    }

    @if (step() === 'confirm') {
      <div class="stack">
        <p>Confirmar PIX de <strong>{{ format(amountCents) }}</strong></p>
        <p>para {{ selectedName() }}</p>
        @if (transfers.loading()) {
          <app-loading-block />
        } @else {
          <app-button type="button" (click)="confirm()">Confirmar</app-button>
          <button type="button" (click)="step.set('form')">Voltar</button>
        }
      </div>
    }

    @if (step() === 'receipt' && transfers.lastTransfer(); as t) {
      <div class="stack">
        <h2>Comprovante</h2>
        <p>ID: {{ t.id }}</p>
        <p>Valor: {{ format(t.amountCents) }}</p>
        <p>Status: {{ t.status }}</p>
        <p>Em: {{ t.createdAt }}</p>
        <app-button type="button" (click)="again()">Nova transferência</app-button>
      </div>
    }
  `,
  styles: [
    `
      .stack { display: grid; gap: 0.75rem; max-width: 420px; }
      label { display: grid; gap: 0.25rem; }
      input, select {
        padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius);
      }
    `,
  ],
})
export class TransferPixPage implements OnInit {
  readonly beneficiaries = inject(BeneficiariesService)
  readonly wallet = inject(WalletService)
  readonly transfers = inject(TransfersService)

  readonly step = signal<Step>('form')
  readonly formError = signal<string | null>(null)
  readonly amountCents = signal(0)

  beneficiaryId = ''
  amountReais = ''
  format = formatCents

  ngOnInit(): void {
    this.beneficiaries.load()
  }

  selectedName(): string {
    return this.beneficiaries.items().find((b) => b.id === this.beneficiaryId)?.name ?? ''
  }

  goConfirm(): void {
    this.formError.set(null)
    try {
      const cents = parseReaisToCents(this.amountReais)
      if (!this.beneficiaryId) {
        this.formError.set('Selecione um favorecido.')
        return
      }
      this.amountCents.set(cents)
      this.transfers.beginConfirm()
      this.step.set('confirm')
    } catch {
      this.formError.set('Valor inválido. Use formato como 10,50.')
    }
  }

  confirm(): void {
    this.transfers.confirmPix(this.beneficiaryId, this.amountCents(), () => {
      this.wallet.loadBalance()
      this.step.set('receipt')
    })
  }

  again(): void {
    this.transfers.reset()
    this.amountReais = ''
    this.beneficiaryId = ''
    this.step.set('form')
  }
}
```

- [ ] **Step 3: Demo completa**

Fluxo: login → dashboard → favorecido novo → PIX → comprovante → extrato mostra PIX_OUT → saldo caiu.

Testar também saldo insuficiente (valor > saldo) → banner com mensagem do contrato.

- [ ] **Step 4: Commit**

```bash
git add src/app/features/transfers
git commit -m "$(cat <<'EOF'
feat: fluxo PIX com confirmação e idempotency key

Form, confirmação e comprovante; chave só no step de confirm.
EOF
)"
```

---

### Task 8: README, guia de entrevista, build final

**Files:**
- Create: `README.md`, `docs/guides/entrevista-angular.md`
- Modify: limpar stubs/welcome do CLI; garantir `ng build` e `ng test` verdes

**Interfaces:**
- Consumes: app completo
- Produces: docs de demo

- [ ] **Step 1: README**

```markdown
# AngularMind Wallet

Carteira digital de estudo em **Angular 19** (standalone + signals) — mesmo domínio/contrato da trilha VueMind.

## Como rodar

\`\`\`bash
npm install
npm start
\`\`\`

Abra `http://localhost:4200`.

**Login demo:** `demo@vuemind.dev` / `demo123`

\`\`\`bash
npm test
npm run build
\`\`\`

## O que o app cobre

| Fluxo | Onde estudar |
|-------|----------------|
| Login + guard | `src/app/core/auth/`, `features/auth/` |
| Saldo + extrato | `src/app/features/wallet/` |
| Favorecidos | `src/app/features/beneficiaries/` |
| PIX | `src/app/features/transfers/` |
| MSW | `src/app/mocks/` |
| HTTP + Bearer | `src/app/core/http/api.interceptor.ts` |

## Entrevista

Leia: [docs/guides/entrevista-angular.md](docs/guides/entrevista-angular.md)

## Apontar para Spring (`vuemind-api`)

1. Comentar `worker.start` em `src/main.ts`
2. Em `angular.json` → `serve.options.proxyConfig` apontando `/api/v1` → `http://localhost:8080`
\`\`\`
```

- [ ] **Step 2: Guia `docs/guides/entrevista-angular.md`**

Conteúdo obrigatório:

1. Pitch 60s (Angular 19, signals, interceptor, MSW, mesmo OpenAPI do Vue)
2. Conceitos: standalone, signals vs Pinia, `CanActivateFn`, interceptor vs client fetch, centavos, Idempotency-Key
3. Fluxo demo 2–3 min
4. Arquivos para abrir: `api.interceptor.ts`, `auth.service.ts`, `auth.guard.ts`, `transfers.handlers.ts` (`executePix`), `transfer-pix.page.ts`
5. Como liga Spring

- [ ] **Step 3: Verificação final**

```bash
npx ng test --no-watch --browsers=ChromeHeadless
npx ng build
```

Expected: todos os testes essenciais PASS; build sem erro.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/guides src
git commit -m "$(cat <<'EOF'
docs: README e guia de entrevista Angular

Fecha a entrega interview-ready do AngularMind Wallet.
EOF
)"
```

---

## Self-review do plano (cobertura da spec)

| Requisito da spec | Task |
|-------------------|------|
| Login + guard | 3 |
| Dashboard saldo | 5 |
| Extrato + filtro tipo | 5 |
| Favorecidos CRUD | 6 |
| PIX form→confirm→recibo + Idempotency-Key | 7 |
| MSW + OpenAPI | 1–2 |
| HttpClient + Bearer + correlation id | 3 |
| Dinheiro em centavos | 1, 5, 7 |
| Signals + services (sem NgRx) | 3–7 |
| Sem i18n/tema/Material | respeitado globalmente |
| Testes essenciais (money, auth, executePix) | 1, 2, 3 |
| README + guia entrevista | 8 |
| Ligação Spring documentada | 8 |

**Placeholders:** nenhum TBD funcional; stubs de page só como ponte entre tasks 3–4 e 5–7.  
**Tipos:** `Beneficiary`, `Transfer`, `Transaction`, `ApiErrorBody` alinhados ao OpenAPI e ao Vue.
