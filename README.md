# AngularMind Wallet

Carteira digital de estudo em **Angular 19** (standalone + signals + TypeScript) — Mind Wallet 2.0, mesmo contrato `/api/v1` da trilha VueMind.

## Como rodar

```bash
npm install
npm start
```

Abra `http://localhost:4200`.

**Login demo:** `demo@vuemind.dev` / `demo123`

```bash
npm test          # testes unitários (Karma + Jasmine)
npm run test:e2e  # smoke Playwright (MSW)
npm run build     # build de produção
```

## O que o app cobre

| Fluxo | Onde estudar |
|-------|----------------|
| Login + guard de rota | `src/app/core/auth/`, `src/app/app.routes.ts` |
| Saldo, bloqueado, limite diário, extrato paginado | `src/app/features/wallet/` |
| Onboarding | `src/app/features/onboarding/` |
| Favorecidos com `pixKeyType` | `src/app/features/beneficiaries/` |
| PIX (destino → valor → agendar → confirmar → comprovante + QR) | `src/app/features/transfers/` |
| Notificações + badge | `src/app/features/notifications/` |
| Tema claro/escuro + i18n pt-BR/en | `src/app/core/theme/`, `src/app/core/i18n/`, `src/app/features/settings/` |
| API mock (MSW via mind-shared) | `src/app/mocks/`, contrato `docs/contracts/` |
| HTTP + Bearer + correlation id | `src/app/core/http/api.interceptor.ts` |

## Guia rápido para entrevista

Leia: [docs/guides/entrevista-angular.md](docs/guides/entrevista-angular.md)

## Apontar para o Spring

Por padrão o MSW atende `/api/v1` no browser durante o desenvolvimento. Builds de produção já ignoram o MSW por meio de `isDevMode()` / `environment.enableMsw`. Para usar o backend Spring (`localhost:8080`) no ambiente de desenvolvimento:

1. Desabilite o MSW em `environment.development.ts` (`enableMsw: false`).
2. Configure proxy do dev server — exemplo em `proxy.conf.json`.
3. Suba com `ng serve --proxy-config proxy.conf.json`.

As features e services continuam chamando `/api/v1/*`; só troca quem responde (MSW → Spring). Contrato: `docs/contracts/vuemind-wallet-openapi.yaml`.
