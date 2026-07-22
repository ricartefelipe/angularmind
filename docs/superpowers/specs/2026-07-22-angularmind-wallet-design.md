# AngularMind Wallet — Design Spec (Angular 19)

**Data:** 2026-07-22  
**Status:** aprovado para plano de implementação  
**Repositório:** `angularmind`  
**Produto:** carteira digital de estudo (login, saldo, extrato, PIX, favorecidos)  
**Profundidade:** meio-termo (escopo C da trilha) — fluxos principais sem tema/i18n elaborados

---

## 1. Contexto e objetivo

Parte da trilha de preparação técnica iniciada em `vuemind`. Reutiliza o **mesmo domínio** e o **mesmo contrato OpenAPI** (`/api/v1`). O Vue cobre o demo completo; o Angular cobre o que o CV precisa demonstrar na stack Angular, sem repetir o esforço didático do Vue (tema, i18n, cobertura ampla).

### Objetivos didáticos do Angular v1

1. Consolidar Angular moderno: standalone components, signals, functional router guards, `HttpClient` + interceptor.
2. Manter arquitetura feature-first alinhada ao Vue e ao contrato estável.
3. Simular rede com MSW até apontar para `vuemind-api` (Spring).
4. Deixar pitch de entrevista curto (README + guia) — tom professor só nos pontos que diferenciam Angular do Vue.

### Fora de escopo (Angular v1)

- i18n (pt-BR/en) e tema claro/escuro
- Angular Material / NgRx / SSR
- Deploy cloud, banco real, pagamentos reais
- Cobertura de testes alta; review loops elaborados
- Apps React / Ionic / RN / Flutter (outros repos)

---

## 2. Decisões travadas

| Tema | Decisão |
|------|---------|
| Domínio | Carteira digital (mesmo do Vue) |
| Escopo | Meio-termo: auth + saldo + extrato + PIX + favorecidos |
| Contrato | Cópia de `vuemind-wallet-openapi.yaml` em `docs/contracts/` |
| Mock de API | MSW (paths `/api/v1`) |
| Arquitetura | Feature-first |
| UI kit | Sem lib pesada; CSS variables + componentes próprios enxutos |
| Linguagem | TypeScript estrito |
| Framework | Angular 19 (standalone) |
| Estado | Signals + services por feature (sem NgRx) |
| HTTP | `HttpClient` + interceptor Bearer + correlation id |
| Rotas | `provideRouter` + functional `CanActivate` |
| Testes | Essencial: utils de dinheiro, auth service, regra PIX; no máximo 1–2 smokes de componente |
| Build / CLI | Angular CLI (`ng serve`, `ng test`, `ng build`) |
| Credenciais mock | `demo@vuemind.dev` / `demo123` |

---

## 3. Personas e fluxos principais

**Usuário de estudo:** operador da carteira (dados mock).

### Fluxos

1. **Login** — credenciais mock → token → redireciona ao dashboard.
2. **Dashboard** — exibe saldo e atalhos (PIX, extrato, favorecidos).
3. **Extrato** — lista transações com filtro por tipo; estados loading/error/empty.
4. **Transferência PIX** — escolhe/informa favorecido + valor → confirma → comprovante.
5. **Favorecidos** — listar / criar / remover.

Credenciais (iguais ao Vue/MSW/API):

- `demo@vuemind.dev` / `demo123`

---

## 4. Arquitetura

### 4.1 Visão geral

```
Browser (Angular SPA)
    │
    ▼
features/*  →  HttpClient (+ interceptor)  →  fetch/XHR
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
                 MSW (dev/test)          vuemind-api (Spring)
                    │
                    ▼
              fixtures in-memory
```

Features e services **não sabem** se a resposta veio do MSW ou do Spring. Troca futura = desligar MSW + proxy/`baseUrl`.

### 4.2 Estrutura de pastas

```
angularmind/
  docs/
    contracts/                 # OpenAPI (cópia canônica)
    guides/                    # entrevista-angular.md
    superpowers/specs/         # este design
    superpowers/plans/         # plano de implementação
  src/
    app/
      app.config.ts
      app.routes.ts
      app.component.ts
      core/
        auth/                  # guard, token storage
        http/                  # interceptor Bearer + correlation id
      shared/
        ui/                    # button, input, shell, loading, error, empty
        utils/                 # money, id
        types/                 # ApiError, Money, etc.
      features/
        auth/
        wallet/
        beneficiaries/
        transfers/
      mocks/
        browser.ts
        handlers/
        data/
    styles.css
  public/
```

Cada feature tipicamente contém:

- `*.api.ts` — chamadas `HttpClient`
- `*.service.ts` — estado com signals + orquestração
- componentes / páginas roteadas
- `types.ts` — tipos do domínio da feature

### 4.3 Fronteiras e responsabilidades

| Unidade | Faz | Depende de |
|---------|-----|------------|
| `core/http` | interceptor Authorization, correlation id, parse de erro | nada de feature |
| `features/*/api` | endpoints e DTOs | `HttpClient`, types |
| `features/*/service` | estado (signals) + cache leve de tela | api da feature |
| páginas | composição de UI | service + shared/ui |
| `mocks` | handlers MSW + fixtures | contrato OpenAPI |

Regra: **páginas não injetam `HttpClient` direto**; passam por api/service.

### 4.4 Mapeamento Vue → Angular (para entrevista)

| Vue | Angular |
|-----|---------|
| Pinia store | service com signals |
| Vue Router + `meta.requiresAuth` | `CanActivateFn` |
| `shared/http` client | `HttpClient` + interceptor |
| composables | métodos do service / helpers |
| MSW handlers | mesmos paths/contratos |

---

## 5. Contrato e dados

- Fonte: cópia de `vuemind/docs/contracts/vuemind-wallet-openapi.yaml`.
- Endpoints usados: `POST /auth/login`, `GET /wallet/balance`, `GET /wallet/transactions`, CRUD favorecidos, `POST /transfers/pix`.
- Dinheiro sempre em **centavos** (inteiro); formatação na UI com `Intl.NumberFormat` (`pt-BR`).
- PIX envia `Idempotency-Key` **apenas no confirm**, não a cada keystroke.
- Token opaco mock persistido em `sessionStorage` (ou `localStorage` se facilitar o demo — preferir `sessionStorage`).

---

## 6. UI e estados

- Shell simples com nav (Dashboard, Extrato, Favorecidos, PIX, Sair).
- Componentes shared mínimos: botão, input, loading block, error banner, empty state.
- Cada lista/form trata: loading / error / empty / success.
- Login 401 → mensagem clara; PIX saldo insuficiente → erro de negócio visível.
- Sem cards decorativos desnecessários; layout limpo, CSS variables para cor/espacamento.

---

## 7. Testes

Cobertura **essencial**, não ampla:

1. `money` utils (parse/format/centavos).
2. `AuthService` (login sucesso/falha; guard redireciona sem token).
3. Regra de domínio do PIX (saldo insuficiente) — extrair função pura nos handlers ou shared, testável sem rede.

Opcional se sobrar tempo: 1 smoke do `LoginComponent`.

Não bloquear entrega por cobertura de componentes.

---

## 8. Documentação de entrega

- `README.md` — como rodar, credenciais, bullets “o que dizer na entrevista”.
- `docs/guides/entrevista-angular.md` — pitch 60s, conceitos (signals, interceptor, guard), fluxo demo, arquivos para abrir.
- Spec e plano em `docs/superpowers/`.

---

## 9. Critério de pronto

1. `ng serve` sobe; login com credenciais demo funciona.
2. Demo &lt; 5 min: login → saldo → extrato → criar favorecido → PIX → comprovante (saldo atualiza).
3. `ng test` passa no essencial; `ng build` sem erro.
4. README + guia de entrevista presentes.
5. Features isoladas do mock: apontar para Spring não exige reescrever pages/services de domínio.

---

## 10. Ligação futura ao Spring (`vuemind-api`)

1. Não iniciar MSW em dev (flag ou remoção do bootstrap).
2. Proxy do `ng serve` (`/api/v1` → `http://localhost:8080`) **ou** `baseUrl` absoluto com CORS.
3. Manter OpenAPI; não mudar contratos nas features.
