# MR ORÇAMENTOS

Sistema de gestão de serviços, orçamentos, materiais e documentos da **MR ELÉTRICA**.

PWA (Progressive Web App) **mobile first**, instalável pelo navegador do celular e também
utilizável no computador.

> Status: **v1.0.0 — todos os 23 checkpoints concluídos.** Roda em **modo
> demonstração** (dados no `localStorage`) até o Supabase ser configurado.
> Veja [`PROJECT_STATUS.md`](./PROJECT_STATUS.md) e [`CHECKPOINT.md`](./CHECKPOINT.md).

## O que o sistema faz

- **Clientes** — cadastro completo, busca e histórico (serviços, orçamentos, documentos).
- **Serviços** — descrição (com geração automática a partir de anotações),
  cálculo de mão de obra (técnicos × horas × valor/hora por tipo de hora),
  materiais com margem automática, notas fiscais (upload + leitura por texto → itens),
  fotos (antes / durante / depois).
- **Orçamentos** — composição do valor (materiais + margem + mão de obra +
  deslocamento + outros), numeração automática, status, PDF profissional, PIX
  (copia e cola + QR Code).
- **Documentos** — PDF de orçamento, ordem de serviço, relatório técnico (com
  fotos) e recibo; histórico.
- **Financeiro** — gasto em materiais, margem, mão de obra, faturamento.
- **Dashboard** — visão geral com dados reais.
- **Compartilhamento** — download, folha de compartilhamento do celular, WhatsApp.
- **PWA** — instalável pelo navegador; funciona no celular e no computador.

> Sem serviços pagos: OCR de imagem e IA de texto têm camadas modulares
> (`OCRService`, `AIService`) prontas para plugar um provedor via Edge Function.

## Tecnologias

| Camada        | Stack                                   |
| ------------- | --------------------------------------- |
| Frontend      | React 18 + Vite + TypeScript            |
| Estilização   | Tailwind CSS                            |
| Backend / BD  | Supabase (Auth, PostgreSQL, Storage)    |
| PWA           | vite-plugin-pwa (manifest + service worker) |
| Hospedagem    | Vercel                                  |

## Pré-requisitos

- **Node.js 18+** e npm (o ambiente atual **não** possui Node instalado — instale a partir de
  <https://nodejs.org>).

## Instalação

```bash
npm install
```

## Executar em desenvolvimento

```bash
npm run dev
```

App em `http://localhost:5173`. O layout se adapta automaticamente entre celular
(menu inferior + barra superior) e computador (menu lateral).

## Build de produção

```bash
npm run build
npm run preview
```

## Variáveis de ambiente

Copie `.env.example` para `.env`:

```bash
cp .env.example .env
```

| Variável                 | Descrição                                                   |
| ------------------------ | ---------------------------------------------------------- |
| `VITE_SUPABASE_URL`      | URL do projeto Supabase (Project Settings → API)          |
| `VITE_SUPABASE_ANON_KEY` | Chave pública `anon` do Supabase                          |

Enquanto essas variáveis não estiverem definidas, o app roda em **modo demonstração**
com dados fictícios (um aviso é exibido no topo das telas).

> Nunca faça commit do `.env` nem exponha chaves privadas (service_role) no frontend.

## Conectar ao Supabase

👉 **Passo a passo completo (do zero, sem pular nada):
[`SETUP_SUPABASE.md`](./SETUP_SUPABASE.md)**

Resumo:

1. Crie um projeto grátis em <https://supabase.com>.
2. Em **Project Settings → API**, copie `Project URL` e a chave `anon public` para o `.env`.
3. No **SQL Editor**, cole e rode [`supabase/setup-completo.sql`](./supabase/setup-completo.sql).
4. Em **Authentication → URL Configuration**, defina a Site URL e as Redirect URLs.
5. `npm run dev` — o aviso "modo demonstração" some.

O cliente Supabase já está preparado em [`src/lib/supabase.ts`](./src/lib/supabase.ts).

## Autenticação (Checkpoint 02)

O app tem dois modos:

| Modo | Quando | Comportamento |
| ---- | ------ | ------------- |
| **Produção** | `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` definidos | Login, cadastro, recuperação e redefinição de senha reais via Supabase Auth |
| **Demonstração** | variáveis ausentes | Login fictício `demo@mreletrica.com.br` / `123456` (só no navegador, nada é enviado a servidor) |

Rotas: `/login`, `/register`, `/forgot-password`, `/reset-password` (públicas);
todas as demais exigem login.

Configuração no painel do Supabase (**Authentication**):

1. **Providers → Email**: habilitado. Para testar sem caixa de e-mail, desative
   "Confirm email" (o login funciona logo após o cadastro).
2. **URL Configuration**:
   - *Site URL*: `http://localhost:5173` (dev) e a URL da Vercel (produção).
   - *Redirect URLs*: adicione `.../reset-password` para as duas URLs acima.

## Deploy na Vercel

1. Suba o repositório para o GitHub.
2. Em <https://vercel.com>, **New Project** → importe o repositório.
3. Framework preset: **Vite**. Build: `npm run build`. Output: `dist`.
4. Em **Settings → Environment Variables**, adicione `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY`.
5. Deploy. O arquivo [`vercel.json`](./vercel.json) já configura o roteamento SPA.

## PWA / instalação no celular

O projeto gera `manifest` e `service worker` no build. Após o deploy (HTTPS),
abra o site no Chrome do Android e use **"Adicionar à tela inicial"**.
Ícones em `public/icons/`.

## Estrutura de pastas

```
src/
  components/
    auth/       AuthLayout, ProtectedRoute, LogoutButton
    layout/     Sidebar, TopBar, BottomNav, AppLayout, DemoBanner
    ui/         Button, Card, Badge, StatCard, EmptyState, PageHeader, Logo,
                Alert, TextField, FullScreenLoader
  config/       navigation.tsx (itens de menu)
  contexts/     AuthContext.tsx (provider de autenticação)
  hooks/        useMediaQuery, useAuth
  lib/          supabase.ts
  pages/        Login, Register, ForgotPassword, ResetPassword, Dashboard,
                Clientes (+ form/detalhe), Servicos (+ form/detalhe/material/
                leitura-nota), Orcamentos (+ form/detalhe), Materiais,
                Documentos, Configuracoes, NotFound
  routes/       AppRoutes.tsx
  services/     authService, dashboardService, ocrService, aiService, mockData,
                db, storageService, clientesService, servicosService,
                orcamentosService, materiaisService, documentosService,
                configuracoesService, notasFiscaisService, fotosServicoService,
                demoStore, demoCrud, demoSeed
  types/        index.ts (domínio), database.ts (linhas do banco)
  utils/        format.ts, authErrors.ts, validation.ts

supabase/
  migrations/   schema SQL (tabelas + RLS)
  README.md     como aplicar
```

## Desenvolvimento por checkpoints

O projeto avança em etapas. Ao final de cada uma, `CHECKPOINT.md` e
`PROJECT_STATUS.md` são atualizados e o próximo checkpoint **só começa após
autorização**.
