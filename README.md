# AngularMind Wallet

Carteira digital de estudo em **Angular 19** (standalone + signals + TypeScript) — mesmo contrato `/api/v1` da trilha VueMind.

## Como rodar

```bash
npm install
npm start
```

Abra `http://localhost:4200`.

**Login demo:** `demo@vuemind.dev` / `demo123`

```bash
npm test          # testes unitários (Karma + Jasmine)
npm run build     # build de produção
```

## O que o app cobre

| Fluxo | Onde estudar |
|-------|----------------|
| Login + guard de rota | `src/app/core/auth/`, `src/app/app.routes.ts` |
| Saldo + extrato com filtros | `src/app/features/wallet/` |
| Favorecidos (CRUD) | `src/app/features/beneficiaries/` |
| PIX (form → confirma → comprovante) | `src/app/features/transfers/` |
| API mock (MSW) | `src/app/mocks/`, contrato `docs/contracts/` |
| HTTP + Bearer + correlation id | `src/app/core/http/api.interceptor.ts` |

## Guia rápido para entrevista

Leia: [docs/guides/entrevista-angular.md](docs/guides/entrevista-angular.md)

## Apontar para o Spring

Por padrão o MSW atende `/api/v1` no browser. Para usar o backend Spring (`localhost:8080`):

1. Comente o bloco `worker.start` em `src/main.ts` (mantenha só o `bootstrapApplication`).
2. Configure proxy do dev server — exemplo em `proxy.conf.json`:

   ```json
   {
     "/api/v1": {
       "target": "http://localhost:8080",
       "secure": false,
       "changeOrigin": true
     }
   }
   ```

3. Suba com `ng serve --proxy-config proxy.conf.json`.

As features e services continuam chamando `/api/v1/*`; só troca quem responde (MSW → Spring). Contrato: `docs/contracts/vuemind-wallet-openapi.yaml`.
