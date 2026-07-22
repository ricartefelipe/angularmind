# AngularMind — o que estudar na entrevista (rápido)

## Como falar do projeto em 60s

> “Montei uma carteira digital em Angular 19 + TypeScript: login com guard, saldo/extrato, favorecidos e PIX. A API é mockada com MSW no mesmo contrato `/api/v1` que depois pluga no Spring. Usei standalone components, signals nos services, `HttpInterceptorFn` para Bearer e correlation id, e testes Karma/Jasmine.”

## Conceitos que costumam cair

1. **Standalone components** — sem `NgModule`; cada page importa o que precisa; lazy load via `loadComponent` nas rotas.
2. **Signals vs Pinia** — estado reativo com `signal`/`computed` nos services (`AuthService`, `WalletService`); sem NgRx; injeção com `inject()`.
3. **`CanActivateFn`** — guard funcional (`authGuard`) lê `AuthService.isAuthenticated()` e redireciona para `/login`.
4. **Interceptor vs client fetch** — um `apiInterceptor` centraliza Bearer, `X-Correlation-Id` e mapeamento de `ApiError`; APIs por feature só chamam `HttpClient`.
5. **MSW** — intercepta requests no browser; regra de PIX pura (`executePix`) testável sem rede.
6. **Dinheiro em centavos** — evita float; formata na UI com `Intl`.
7. **Idempotency-Key** — no confirm do PIX (não a cada keystroke); gerada em `beginConfirm()` e reutilizada em retry.
8. **Estados de UI** — loading / error / empty / success (extrato, favorecidos, PIX).

## Fluxo demo ao vivo (2–3 min)

1. Login com `demo@vuemind.dev` / `demo123`
2. Ver saldo no dashboard
3. Abrir Extrato (filtrar tipo)
4. Favorecidos → adicionar um
5. PIX → escolher favorecido → valor → confirmar → comprovante
6. Voltar ao Extrato / saldo (saldo caiu)

## Perguntas prontas (respostas curtas)

**Por que MSW e não json-server?**  
Mesma camada `HttpClient` que a API real; handlers no mesmo repo; fácil nos testes.

**Por que feature-first?**  
Cada domínio (auth, wallet, transfers) fica isolado — espelha microsserviços e facilita Vue/React no mesmo contrato.

**Como liga o Spring depois?**  
Comenta `worker.start` em `main.ts`, usa proxy `/api/v1` → `http://localhost:8080` no `ng serve`, mantém OpenAPI.

**O que testa?**  
Utils de dinheiro, auth service, regra `executePix` (saldo insuficiente) e fluxo da página PIX.

## Arquivos “abra na entrevista”

- `src/app/core/http/api.interceptor.ts`
- `src/app/core/auth/auth.service.ts`
- `src/app/core/auth/auth.guard.ts`
- `src/app/mocks/handlers/transfers.handlers.ts` (`executePix`)
- `src/app/features/transfers/transfer-pix.page.ts`
