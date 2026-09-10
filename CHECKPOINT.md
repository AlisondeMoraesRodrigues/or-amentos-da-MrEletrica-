# CHECKPOINT 01 — Criação da estrutura do projeto

- **Número do checkpoint:** 01
- **Data:** 2026-09-06
- **Título:** Estrutura inicial, layout responsivo, rotas, preparação para Supabase e PWA

---

## Funcionalidades concluídas

- Projeto React 18 + Vite + TypeScript configurado.
- Tailwind CSS configurado com identidade visual da MR ELÉTRICA (paleta `brand`,
  `energy`, `ink`; componentes utilitários `.btn`, `.card`, `.input`).
- Layout **mobile first** e responsivo:
  - Celular: barra superior (`TopBar`) com menu de itens secundários + menu inferior
    (`BottomNav`) com os 4 itens principais.
  - Computador: menu lateral (`Sidebar`).
- Roteamento com `react-router-dom` (rotas aninhadas sob um layout comum).
- Páginas criadas com conteúdo básico/interface:
  `/login`, `/dashboard`, `/clientes`, `/orcamentos`, `/servicos`, `/materiais`,
  `/documentos`, `/configuracoes` + página 404.
- Dashboard com cartões (Orçamentos do mês, Serviços realizados, Valor faturado,
  Materiais utilizados) e botões **+ Novo orçamento** / **+ Novo serviço**, usando
  dados fictícios via camada de serviço.
- Camada de serviços preparada:
  - `dashboardService` (mock, trocará para Supabase no CP20).
  - `ocrService` — arquitetura modular com interface `OCRProvider` (troca de
    fornecedor sem alterar o app).
  - `aiService` — arquitetura modular com interface `AIProvider`.
- `src/lib/supabase.ts` com cliente Supabase e flag `isSupabaseConfigured`
  (modo demonstração quando não configurado, com aviso visual `DemoBanner`).
- PWA preparado via `vite-plugin-pwa`: `manifest`, ícones (`public/icons/`),
  service worker (`registerType: 'autoUpdate'`). O app continua funcionando como
  site normal.
- Tipos de domínio em `src/types/index.ts`.
- Utilitários de formatação e cálculo em `src/utils/format.ts`
  (`formatCurrency`, `formatDate`, `aplicarMargem`, `calcularMaoDeObra`).
- Documentação: `README.md`, `.env.example`, `vercel.json`, `.gitignore`,
  configuração ESLint.

## Arquivos criados

```
package.json
index.html
vite.config.ts
tsconfig.json
tsconfig.node.json
postcss.config.js
tailwind.config.js
vercel.json
.gitignore
.env.example
.eslintrc.cjs
README.md
CHECKPOINT.md
PROJECT_STATUS.md
public/icons/icon.svg
public/icons/icon-192.png
public/icons/icon-512.png
src/main.tsx
src/App.tsx
src/index.css
src/vite-env.d.ts
src/config/navigation.tsx
src/lib/supabase.ts
src/routes/AppRoutes.tsx
src/types/index.ts
src/utils/format.ts
src/hooks/useMediaQuery.ts
src/services/mockData.ts
src/services/dashboardService.ts
src/services/ocrService.ts
src/services/aiService.ts
src/components/layout/AppLayout.tsx
src/components/layout/Sidebar.tsx
src/components/layout/TopBar.tsx
src/components/layout/BottomNav.tsx
src/components/layout/DemoBanner.tsx
src/components/ui/Button.tsx
src/components/ui/Card.tsx
src/components/ui/Badge.tsx
src/components/ui/StatCard.tsx
src/components/ui/EmptyState.tsx
src/components/ui/PageHeader.tsx
src/components/ui/Logo.tsx
src/pages/LoginPage.tsx
src/pages/DashboardPage.tsx
src/pages/ClientesPage.tsx
src/pages/OrcamentosPage.tsx
src/pages/ServicosPage.tsx
src/pages/MateriaisPage.tsx
src/pages/DocumentosPage.tsx
src/pages/ConfiguracoesPage.tsx
src/pages/NotFoundPage.tsx
```

## Arquivos modificados

- Nenhum (projeto novo).

## Estrutura atual do projeto

Ver seção "Estrutura de pastas" no `README.md`.

## Banco de dados criado

- Nenhum. A modelagem começa no **Checkpoint 03**. Interface do Supabase já
  preparada em `src/lib/supabase.ts`.

## Próximos passos (Checkpoint 02)

- Sistema de login e usuários com **Supabase Authentication**.
- Proteção de rotas (redirecionar para `/login` quando não autenticado).
- Contexto/hook de sessão (`useAuth`).
- Logout.

## Problemas conhecidos

- **Node.js não está instalado no ambiente atual** — é necessário instalar Node 18+
  e rodar `npm install` antes de `npm run dev`. O código não pôde ser executado/
  compilado aqui; a estrutura segue os padrões do Vite + React + TS.
- Ícones PWA são placeholders gerados automaticamente (raio amarelo sobre fundo
  escuro). Substituir pela arte oficial da MR ELÉTRICA quando disponível.
- Login não autentica de verdade (apenas navega ao dashboard) — previsto para o CP02.

## Pendências

- Instalar dependências (`npm install`) e validar `npm run dev` / `npm run build`.
- Criar projeto no Supabase e preencher `.env`.
- Substituir ícones/logo pela identidade visual oficial.

---

# VALIDAÇÃO DO CHECKPOINT 01

**Data da validação:** 2026-09-06

## O que foi testado

Revisão estática (leitura e conferência de todos os arquivos), pois o ambiente
**não possui Node.js/npm instalados** (confirmado via `where.exe node/npm/npx` e
ausência de `C:\Program Files\nodejs`). Não foi possível executar `npm install`,
`npm run build` ou `npm run dev`.

Itens conferidos manualmente:

1. **Dependências (`package.json`)** — todas as obrigatórias presentes e nas versões
   compatíveis entre si:
   - `react` ^18.3.1, `react-dom` ^18.3.1
   - `vite` ^5.4.5, `@vitejs/plugin-react` ^4.3.1
   - `typescript` ^5.5.4
   - `tailwindcss` ^3.4.11 + `postcss` + `autoprefixer`
   - `react-router-dom` ^6.26.2
   - `@supabase/supabase-js` ^2.45.4
   - `vite-plugin-pwa` ^0.20.5
   - Nenhuma dependência supérflua. Adicionado apenas `@types/node` (necessário para
     tipar `vite.config.ts`).
2. **Imports / caminhos** — alias `@/` conferido em todos os arquivos; todos os
   componentes e páginas importados existem.
3. **TypeScript** — `strict`, `noUnusedLocals`, `noUnusedParameters` revisados
   arquivo a arquivo; imports de tipo com `import type`; sem `any`.
4. **Rotas** — todas as 8 rotas + 404 declaradas em `src/routes/AppRoutes.tsx`.
5. **Tailwind** — `content` cobre `index.html` e `src/**/*.{ts,tsx}`; paleta e
   utilitários (`.btn`, `.card`, `.input`) válidos.
6. **Vite** — config ESM válida; alias via `fileURLToPath(new URL(...))` (sem uso de
   `__dirname`, que não existe em ESM).
7. **PWA** — `VitePWA` com `manifest`, `registerType: 'autoUpdate'`, ícones
   referenciados (`/icons/icon-192.png`, `/icons/icon-512.png`, `icon.svg` — todos
   presentes em `public/icons/`).
8. **Supabase** — `src/lib/supabase.ts` usa `VITE_SUPABASE_URL` /
   `VITE_SUPABASE_ANON_KEY`; nenhuma chave secreta no código; `isSupabaseConfigured`
   + `DemoBanner` garantem funcionamento em modo demonstração.
9. **Responsividade** — layout mobile first: `BottomNav` (`lg:hidden`), `TopBar`
   (`lg:hidden`), `Sidebar` (`hidden lg:flex`); `main` com `max-w-5xl` e padding
   inferior para não sobrepor o menu; listas em cartões (sem tabelas largas).

## Erros encontrados

| # | Arquivo | Problema |
| - | ------- | -------- |
| 1 | `vite.config.ts` | Uso de `__dirname` (indefinido em módulo ESM) para o alias `@`. |
| 2 | `package.json` / `tsconfig*.json` | Script de build usava `tsc -b` (build mode) com `noEmit`, combinação que falha em TypeScript < 5.6; `tsconfig.node.json` com `composite` sem necessidade. |
| 3 | `vite.config.ts` | Tipos do Node (`node:url`) sem `@types/node` declarado. |

## Erros corrigidos

1. Alias `@` agora usa `fileURLToPath(new URL('./src', import.meta.url))`.
2. Build alterado para `tsc -p tsconfig.json && vite build` (project mode, sem
   `-b`); adicionado script `typecheck`; `tsconfig.json` sem `references`;
   `tsconfig.node.json` sem `composite`, com `"types": ["node"]` e `"noEmit": true`.
3. Adicionado `@types/node` em `devDependencies`.

Nenhuma funcionalidade do Checkpoint 01 foi removida ou alterada em comportamento.

## Ambiente

- Node.js **não estava instalado**. Foi instalado via `winget install OpenJS.NodeJS.LTS`
  (Node **v24.19.0**, npm **11.17.0**, escopo de usuário). É necessário **abrir um novo
  terminal** para o `PATH` reconhecer o comando `node`.
- O projeto está dentro de uma pasta sincronizada pelo **OneDrive**
  (`OneDrive\Área de Trabalho\...`). A 1ª tentativa de `npm install` falhou com
  `EPERM` (arquivos travados pelo OneDrive) + `ECONNRESET` (rede). A 2ª tentativa
  concluiu. **Recomendação:** pausar a sincronização do OneDrive durante
  `npm install`, ou mover o projeto para fora do OneDrive (ex.: `C:\dev\mr-orcamentos`).
- O `postinstall` do `esbuild` não roda automaticamente neste ambiente; foi executado
  manualmente (`node node_modules/esbuild/install.js`). Em máquina normal isso é
  automático.

## Comandos executados

| Comando | Resultado |
| ------- | --------- |
| `winget install OpenJS.NodeJS.LTS` | ✅ Node v24.19.0 instalado |
| `npm install` | ✅ 527 pacotes adicionados (na 2ª tentativa) |
| `node node_modules/esbuild/install.js` | ✅ esbuild 0.21.5 ok |
| `npm run build` (`tsc -p tsconfig.json && vite build`) | ✅ **sucesso** |
| `npm run dev` (vite) | ✅ sobe em ~0,5s, `GET /` responde **HTTP 200** |

## Resultado do build

```
vite v5.4.21 building for production...
✓ 104 modules transformed.
dist/index.html                   0.84 kB
dist/assets/index-*.css          16.98 kB │ gzip:  3.68 kB
dist/assets/index-*.js          412.74 kB │ gzip: 118.91 kB
✓ built in 10.66s

PWA v0.20.5 — mode generateSW — precache 11 entries (429.48 KiB)
files generated: dist/sw.js, dist/workbox-*.js, dist/manifest.webmanifest
```

- `tsc` (typecheck): **0 erros**.
- `vite build`: **0 erros / 0 warnings**.
- PWA: `sw.js` + `manifest.webmanifest` gerados corretamente.

## Resultado dos testes

Sem testes automatizados neste checkpoint. Smoke test do servidor de desenvolvimento
executado: Vite inicia e a rota `/` retorna HTTP 200. Revisão manual do código
concluída sem pendências.

## Conclusão da validação

🟢 **CHECKPOINT 01 VALIDADO** — build de produção e servidor de desenvolvimento
funcionando sem erros. Pronto para o Checkpoint 02 mediante autorização.

---

# CHECKPOINT 02 — AUTENTICAÇÃO E USUÁRIOS

- **Número do checkpoint:** 02
- **Data:** 2026-09-06
- **Título:** Sistema completo de autenticação (Supabase Auth) + modo demonstração

## Funcionalidades criadas

- **Contexto de autenticação** (`AuthContext` + `useAuth`): `user`, `session`,
  `loading`, `isDemo`, `signIn`, `signUp`, `signOut`, `resetPassword`,
  `updatePassword`.
- **Camada de serviço** `authService`: isola o Supabase e o modo demonstração;
  usa `getSession()`, `onAuthStateChange()`, `signInWithPassword()`, `signUp()`,
  `resetPasswordForEmail()`, `updateUser()`, `signOut()`.
- **Login** (`/login`): e-mail, senha, "Manter conectado", "Esqueci minha senha",
  "Criar conta". Redireciona para a rota de origem ou `/dashboard`.
- **Cadastro** (`/register`): nome, e-mail, senha, confirmar senha, com validação
  (nome obrigatório, e-mail válido, senha ≥ 6, senhas iguais). Mensagem de
  confirmação por e-mail quando aplicável.
- **Esqueci minha senha** (`/forgot-password`): envia link via Supabase; mensagem
  neutra que não revela se o e-mail existe.
- **Redefinir senha** (`/reset-password`): nova senha + confirmação; detecta
  ausência de sessão de recuperação (link inválido/expirado); após alterar, faz
  `signOut` e redireciona para `/login` com aviso "Senha alterada com sucesso".
- **Proteção de rotas** (`ProtectedRoute`): mostra "Verificando sessão…" durante o
  carregamento; sem usuário → redireciona para `/login` guardando a origem.
- **Logout** (`LogoutButton`): confirmação → `signOut` → limpa estado → `/login`.
  Presente na Sidebar (desktop) e no menu da TopBar (celular).
- **Persistência de sessão**: gerenciamento padrão do Supabase + storage
  comutável (localStorage quando "Manter conectado"; sessionStorage quando não).
  `onAuthStateChange` mantém o contexto sincronizado (inclusive entre abas).
- **MODO DEMONSTRAÇÃO** (Supabase não configurado): login fictício
  `demo@mreletrica.com.br` / `123456`, credenciais exibidas na tela com botão
  "Preencher"; cria usuário fictício em `localStorage`, sem enviar nada a
  servidor. Cadastro/recuperação/redefinição exibem aviso de indisponibilidade.
- **Tratamento de erros** (`translateAuthError`): mensagens claras em português
  para credenciais inválidas, e-mail não confirmado, e-mail já cadastrado, senha
  curta, e-mail inválido, excesso de tentativas, falha de conexão, link expirado.
  Nunca expõe a mensagem técnica do Supabase.
- **Segurança**: apenas `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`; nenhuma
  senha ou chave no código; nada de service_role no frontend.

## Arquivos criados

```
src/contexts/AuthContext.tsx
src/hooks/useAuth.ts
src/services/authService.ts
src/components/auth/AuthLayout.tsx
src/components/auth/ProtectedRoute.tsx
src/components/auth/LogoutButton.tsx
src/components/ui/Alert.tsx
src/components/ui/TextField.tsx
src/components/ui/FullScreenLoader.tsx
src/pages/RegisterPage.tsx
src/pages/ForgotPasswordPage.tsx
src/pages/ResetPasswordPage.tsx
src/utils/authErrors.ts
src/utils/validation.ts
```

## Arquivos modificados

```
src/App.tsx                       + <AuthProvider>
src/routes/AppRoutes.tsx          + rotas públicas de auth + <ProtectedRoute>
src/lib/supabase.ts               + storage comutável ("manter conectado") + detectSessionInUrl
src/pages/LoginPage.tsx           reescrito: autenticação real + demo + validação
src/components/layout/Sidebar.tsx + bloco do usuário + botão Sair (rodapé "Checkpoint 02")
src/components/layout/TopBar.tsx  + bloco do usuário + botão Sair no menu mobile
```

Nenhum arquivo foi apagado. Nenhuma funcionalidade do Checkpoint 01 foi removida
(dashboard, listas, navegação e páginas continuam idênticas, apenas protegidas por login).

## Testes executados

| Teste | Ambiente | Resultado |
| ----- | -------- | --------- |
| `npm install` | local (Node v24.19.0) | ✅ sem mudanças de dependência |
| `npm run build` (`tsc -p tsconfig.json && vite build`) | local | ✅ **0 erros** — 118 módulos, `dist/` gerado, PWA ok |
| Acesso a `/dashboard` sem login | dev server (modo demo) | ✅ redireciona para `/login` |
| Login demo (`demo@mreletrica.com.br` / `123456`) via botão "Preencher" | dev server | ✅ entra no dashboard; usuário aparece na Sidebar |
| Persistência: navegar direto para `/configuracoes` já logado | dev server | ✅ mantém sessão, abre a página |
| Logout (confirmação → `signOut`) | dev server | ✅ volta para `/login` |
| Acesso a `/orcamentos` após logout | dev server | ✅ redireciona para `/login` |
| Cadastro com campos vazios | dev server | ✅ mostra erros de validação em português |
| Layout mobile (375px) das telas de auth | dev server | ✅ responsivo, botões grandes |
| Rotas `/register`, `/forgot-password`, `/reset-password` | dev server | ✅ renderizam com aviso de modo demonstração |

> Supabase real ainda **não configurado** — o fluxo de produção (e-mail de
> confirmação, recuperação real de senha) será testado quando as variáveis de
> ambiente forem definidas. Toda a lógica está implementada e compilando.

## Resultado do build

```
tsc -p tsconfig.json && vite build
vite v5.4.21 building for production...
✓ 118 modules transformed.
dist/index.html                   0.84 kB
dist/assets/index-*.css          19.49 kB │ gzip:  4.09 kB
dist/assets/index-*.js          428.64 kB │ gzip: 122.55 kB
✓ built in 3.35s
PWA v0.20.5 — precache 11 entries (447.58 KiB) — dist/sw.js, dist/workbox-*.js
```

- `tsc`: **0 erros**. `vite build`: **0 erros / 0 warnings**.

## Problemas encontrados e corrigidos

| Problema | Correção |
| -------- | -------- |
| "Manter conectado" não tinha efeito real (Supabase sempre usa localStorage) | `src/lib/supabase.ts`: adaptador de storage que alterna entre `localStorage` e `sessionStorage` conforme a preferência gravada antes do `signIn` |
| Diálogo `window.confirm` do logout é cancelado automaticamente no navegador de teste | Confirmado o funcionamento sobrescrevendo `window.confirm` no teste; em uso real o usuário confirma normalmente |
| `react-refresh/only-export-components` no `AuthContext.tsx` (exporta contexto + provider) | Comentário `eslint-disable-next-line` na linha do `createContext` (padrão aceito); não afeta o build |

## Problemas conhecidos / pendências

- Fluxo de produção do Supabase não testado de ponta a ponta (falta configurar o
  projeto Supabase e o "Site URL" / "Redirect URLs" para `/reset-password`).
- Confirmação de logout usa `window.confirm` (simples); um modal próprio pode
  ser feito depois se desejado.

## Conclusão

🟢 **CHECKPOINT 02 CONCLUÍDO** — build sem erros; modo demonstração testado
completamente (login, logout, proteção de rotas, redirecionamento, validação,
responsividade). Modo produção implementado, aguardando configuração do Supabase
para teste final.

---

# CHECKPOINT 03 — BANCO DE DADOS

- **Número do checkpoint:** 03
- **Data:** 2026-09-06
- **Título:** Modelagem do banco (migrations + RLS), tipos TypeScript e camada de
  acesso a dados. **Sem banco ativo** — decisão do usuário: "só preparar as
  migrations". O app segue em modo demonstração.

## Funcionalidades criadas

- **Migration SQL** (`supabase/migrations/20260906120000_initial_schema.sql`):
  - Tabelas: `profiles`, `configuracoes`, `clientes`, `servicos`, `orcamentos`,
    `materiais`, `documentos`.
  - Enums: `servico_status`, `orcamento_status`, `documento_tipo`,
    `material_unidade`, `tipo_hora`.
  - Trigger `set_updated_at` em todas as tabelas com `updated_at`.
  - Trigger `handle_new_user` em `auth.users`: cria `profiles` + linha padrão de
    `configuracoes` no cadastro.
  - **RLS habilitado em todas as tabelas** — cada usuário só acessa os próprios
    registros (`user_id = auth.uid()`; `profiles`/`configuracoes` por `id`/`user_id`).
  - Índices por `user_id` e por chaves estrangeiras / status.
- **Tipos TypeScript** (`src/types/database.ts`): `Row` / `Insert` / `Update` de
  cada tabela + enums + interface `Database` (formato do supabase-js). Escritos à
  mão para bater com a migration; podem ser regenerados com `supabase gen types`.
- **Camada de acesso a dados** (`src/services/`):
  - `db.ts` — base: `usingDatabase`, `currentUserId()`, `toDbError()` (mensagens
    em português), helpers de cast.
  - `clientesService`, `servicosService`, `orcamentosService`, `materiaisService`,
    `documentosService` — `list` / `get` / `create` / `update` / `delete` tipados.
  - `configuracoesService` — `get` / `update` (linha única por usuário, com
    fallback de criação).
  - Cada função usa o **Supabase quando configurado** e o **armazém local**
    (`demoStore` + `demoCrud` + `demoSeed`) no modo demonstração — nada é enviado
    a servidor no modo demo.
- **Armazém de demonstração** (`src/services/demoStore.ts`, `demoCrud.ts`,
  `demoSeed.ts`): CRUD sobre `localStorage`, com dados iniciais já no formato das
  linhas do banco. `sair` (logout demo) limpa os dados de demonstração.
- **Documentação do banco** (`supabase/README.md`): tabelas, como aplicar
  (painel SQL ou CLI), como gerar os tipos.

## Arquivos criados

```
supabase/migrations/20260906120000_initial_schema.sql
supabase/README.md
src/types/database.ts
src/services/db.ts
src/services/demoStore.ts
src/services/demoCrud.ts
src/services/demoSeed.ts
src/services/clientesService.ts
src/services/servicosService.ts
src/services/orcamentosService.ts
src/services/materiaisService.ts
src/services/documentosService.ts
src/services/configuracoesService.ts
```

## Arquivos modificados

```
src/services/authService.ts   + limpa dados de demonstração ao sair (logout demo)
CHECKPOINT.md / PROJECT_STATUS.md / README.md
```

Nada foi apagado. As telas do CP01 continuam usando `mockData.ts` (placeholders
visuais) até serem ligadas aos services nos próximos checkpoints (CP04+).
`src/lib/supabase.ts` permanece como no CP02 (cliente não tipado com o schema;
os tipos são aplicados nos services).

## Testes executados

| Teste | Resultado |
| ----- | --------- |
| `npx tsc -p tsconfig.json` (typecheck) | ✅ **0 erros** |
| `npm run build` | ✅ **0 erros / 0 warnings** — `dist/` + PWA gerados |
| `npm run lint` | ✅ **0 erros / 0 warnings** |
| App no navegador (modo demo) após as mudanças | ✅ login demo, dashboard, navegação e logout funcionando; sem erros no console (após reiniciar o dev server) |

> A migration SQL **não foi executada** — não há projeto Supabase (decisão do
> usuário). Foi revisada manualmente (sintaxe PostgreSQL 17, enums idempotentes,
> triggers, políticas RLS). Deve ser aplicada pelo painel do Supabase conforme
> `supabase/README.md` quando o projeto for criado.
>
> Os services novos ainda **não são importados por nenhuma tela** (por isso não
> entram no bundle) — a integração acontece a partir do CP04. O caminho de
> demonstração é lógica simples de `localStorage`.

## Resultado do build

```
tsc -p tsconfig.json && vite build
✓ 118 modules transformed
dist/assets/index-*.css   19.49 kB │ gzip:  4.09 kB
dist/assets/index-*.js   428.86 kB │ gzip: 122.62 kB
✓ built in 3.36s
PWA v0.20.5 — precache 11 entries
```

## Problemas encontrados e corrigidos

| Problema | Correção |
| -------- | -------- |
| Tipar o cliente Supabase com um `Database` escrito à mão gerava `never` em `.insert()/.update()` (formato não bate 100% com o supabase-js) | Manter o cliente sem tipo de schema; aplicar os tipos (`Row/Insert/Update`) por cast nos services (`asRow`/`asRows`/`asRowOrNull`). Regenerar com `supabase gen types` quando o banco existir. |
| `.eq()` depois de `.order()` não existe no builder do postgrest | Aplicar filtros `.eq()` antes do `.order()` nos services de lista |
| HMR do Vite ficou inconsistente após muitas edições + reotimização de deps | Limpar `node_modules/.vite` e reiniciar o dev server — app volta a funcionar |

## Problemas conhecidos / pendências

- Migration não aplicada (sem projeto Supabase). Aplicar via painel quando criar o projeto.
- `src/types/database.ts` é manual — regenerar com `supabase gen types` após aplicar.
- Telas ainda em `mockData` — serão ligadas aos services nos checkpoints das suas telas.

## Conclusão

🟢 **CHECKPOINT 03 CONCLUÍDO** (escopo "só preparar as migrations") — schema +
RLS + tipos + camada de acesso a dados prontos; build/lint/typecheck sem erros;
app segue funcionando em modo demonstração. Falta apenas aplicar a migration num
projeto Supabase real.

---

# CHECKPOINT 04 — SISTEMA COMPLETO DE CLIENTES

- **Número do checkpoint:** 04
- **Data:** 2026-09-07
- **Título:** Tela de clientes ligada à camada de dados — criar, editar, excluir,
  pesquisar, detalhe com histórico.

## Funcionalidades criadas

- **Lista `/clientes`** ([ClientesPage](src/pages/ClientesPage.tsx)):
  carrega via `clientesService.listClientes()`; busca (nome, cidade, condomínio,
  responsável, contatos, CPF/CNPJ); estados de carregando / erro (com "tentar
  novamente") / vazio; botão "Atualizar lista"; cada cartão abre o detalhe.
- **Formulário `/clientes/novo` e `/clientes/:id/editar`**
  ([ClienteFormPage](src/pages/ClienteFormPage.tsx)): os 11 campos do cliente
  (nome, CPF, CNPJ, telefone, WhatsApp, e-mail, endereço, cidade, condomínio,
  responsável, observações); validação (nome obrigatório, e-mail válido se
  preenchido); campos vazios viram `null`; ao salvar vai para o detalhe.
- **Detalhe `/clientes/:id`** ([ClienteDetailPage](src/pages/ClienteDetailPage.tsx)):
  todos os dados + data de cadastro; botões **Editar** e **Excluir** (com
  confirmação); **histórico**: lista os serviços e orçamentos do cliente
  (via `servicosService` / `orcamentosService`, filtrando por `cliente_id`).
- **Rotas** adicionadas em `AppRoutes.tsx` (todas protegidas).
- Funciona igual no **modo demonstração** (localStorage) e com **Supabase**
  (quando configurado) — mesma camada de services do CP03.

## Arquivos criados

```
src/pages/ClienteFormPage.tsx
src/pages/ClienteDetailPage.tsx
src/hooks/useAsync.ts
src/components/ui/Loading.tsx
src/components/ui/TextAreaField.tsx
```

## Arquivos modificados

```
src/pages/ClientesPage.tsx     reescrita: usa clientesService (era mockData)
src/routes/AppRoutes.tsx       + /clientes/novo, /clientes/:id, /clientes/:id/editar
src/utils/format.ts            formatDate trata "YYYY-MM-DD" como data local
CHECKPOINT.md / PROJECT_STATUS.md / README.md
```

Nada foi apagado. As outras telas (dashboard, orçamentos, serviços, materiais,
documentos) seguem com `mockData` até os seus checkpoints.

## Testes executados

| Teste | Resultado |
| ----- | --------- |
| `npx tsc -p tsconfig.json` | ✅ 0 erros |
| `npm run build` | ✅ 0 erros / 0 warnings — 130 módulos, JS 443,85 kB (gzip 126 kB) |
| `npm run lint` | ✅ 0 erros / 0 warnings (corrigido 1 warning de `useMemo`) |
| Lista de clientes (modo demo) | ✅ carrega os 2 clientes do seed |
| Criar cliente | ✅ salva (id UUID via `crypto.randomUUID`) e abre o detalhe |
| Editar cliente | ✅ altera cidade e reflete no detalhe/lista |
| Excluir cliente (com confirmação) | ✅ some da lista, volta para `/clientes` |
| Pesquisar ("campinas") | ✅ filtra corretamente |
| Persistência (navegar e voltar) | ✅ mantém no `localStorage` |
| Histórico no detalhe (cliente Maria) | ✅ mostra 1 serviço + 1 orçamento do seed |
| Layout mobile (375px) do formulário | ✅ 1 coluna, campos grandes, menu inferior |

> Testado no **modo demonstração** (sem Supabase). Com Supabase real, a mesma
> camada de services roda contra o banco (RLS por `user_id`).

## Problemas encontrados e corrigidos

| Problema | Correção |
| -------- | -------- |
| `formatDate('2026-09-02')` mostrava `01/09/2026` (UTC → fuso -3) | `formatDate` passa a interpretar strings `YYYY-MM-DD` como data local |
| Warning `react-hooks/exhaustive-deps`: `data ?? []` recriava array a cada render | `const clientes = useMemo(() => data ?? [], [data])` |

## Problemas conhecidos / pendências

- Sem máscara de CPF/CNPJ/telefone (entrada livre) — pode ser adicionado depois.
- Confirmação de exclusão usa `window.confirm`.
- Migration ainda não aplicada em Supabase real.

## Conclusão

🟢 **CHECKPOINT 04 CONCLUÍDO** — CRUD completo de clientes + busca + detalhe com
histórico, ligado à camada de dados; build/lint/typecheck sem erros; testado no
modo demonstração (desktop e mobile).

---

# CHECKPOINT 05 — CRIAÇÃO DE SERVIÇOS

- **Número do checkpoint:** 05
- **Data:** 2026-09-07
- **Título:** Tela de serviços ligada à camada de dados — criar, editar, listar,
  excluir, com prévia do cálculo de mão de obra.

## Funcionalidades criadas

- **Lista `/servicos`** ([ServicosPage](src/pages/ServicosPage.tsx)): carrega via
  `servicosService.listServicos()` + `listClientes()` (resolve o nome do cliente);
  **filtro por status** (chips: Todos / Aberto / Em andamento / Concluído /
  Cancelado); estados carregando / erro / vazio; cartões abrem o detalhe.
- **Formulário `/servicos/novo` e `/servicos/:id/editar`**
  ([ServicoFormPage](src/pages/ServicoFormPage.tsx)):
  - Cliente (select a partir do cadastro do CP04; permite "sem cliente"; link
    para cadastrar quando não há clientes).
  - Descrição do serviço (obrigatória) + anotações/descrição livre (para a IA do CP12).
  - Data, status.
  - **Mão de obra**: quantidade de técnicos, horas, tipo de hora
    (técnica/auxiliar/emergência/noturna), valor da hora com botão **"usar valor
    das configurações"** (puxa de `configuracoes`); **prévia ao vivo**
    `técnicos × horas × valor/h = total` (helper `calcularMaoDeObra`).
  - Taxa de deslocamento e outros custos.
  - Validação (descrição obrigatória, mínimo 1 técnico, horas ≥ 0).
- **Detalhe `/servicos/:id`** ([ServicoDetailPage](src/pages/ServicoDetailPage.tsx)):
  cliente (com link), status, descrição, quadro de mão de obra, lista de materiais
  do serviço (somente leitura — adição no CP07), e um **total do serviço**
  (mão de obra + deslocamento + outros + materiais). Botões Editar / Excluir.
- **Config compartilhada** (`src/config/servico.ts`): rótulos e cores de status,
  rótulos de tipo de hora e mapeamento para o campo de `configuracoes`.
- Rotas adicionadas em `AppRoutes.tsx` (protegidas).
- Funciona igual no **modo demonstração** e com **Supabase**.

## Arquivos criados

```
src/pages/ServicoFormPage.tsx
src/pages/ServicoDetailPage.tsx
src/config/servico.ts
src/components/ui/SelectField.tsx
```

## Arquivos modificados

```
src/pages/ServicosPage.tsx    reescrita: usa servicosService (era mockData)
src/routes/AppRoutes.tsx      + /servicos/novo, /servicos/:id, /servicos/:id/editar
CHECKPOINT.md / PROJECT_STATUS.md / README.md
```

Nada foi apagado. Dashboard, orçamentos, materiais e documentos seguem com
`mockData` até os seus checkpoints. O cálculo formal de mão de obra é o **CP06**
(esta tela já mostra a prévia).

## Testes executados

| Teste | Resultado |
| ----- | --------- |
| `npx tsc` / `npm run build` / `npm run lint` | ✅ 0 erros / 0 warnings — 136 módulos, JS 460,4 kB (gzip 129,5 kB) |
| Lista de serviços (modo demo) | ✅ 1 serviço do seed, com nome do cliente e data correta |
| Filtro por status ("Concluído") | ✅ filtra corretamente |
| Criar serviço (Maria, 2 téc., 3h, tipo Técnica) | ✅ "usar valor das configurações" → R$ 120; prévia `2 × 3h × R$ 120 = R$ 720`; salvou e abriu o detalhe |
| Detalhe do serviço | ✅ quadro de mão de obra + total R$ 720,00 |
| Cross-feature: detalhe do cliente Maria | ✅ passou a mostrar "Serviços (2)" |
| Editar (técnicos 2 → 3) | ✅ prévia `R$ 1.080,00`; salvou e recalculou o total |
| Excluir (com confirmação) | ✅ some da lista (volta a 1 registrado) |

> Testado no **modo demonstração**. Com Supabase, a mesma camada de services roda
> contra o banco.

## Resultado do build

```
tsc -p tsconfig.json && vite build
✓ 136 modules transformed
dist/assets/index-*.js   460,41 kB │ gzip: 129,50 kB
✓ built in 3,58s — PWA v0.20.5
```

## Problemas encontrados e corrigidos

| Problema | Correção |
| -------- | -------- |
| `import Button` não usado em `ServicosPage` após a reescrita | Removido |
| `['todos', ...ORDEM] as const` gerava tipo frágil | Anotado como `('todos' \| ServicoStatus)[]` |

## Problemas conhecidos / pendências

- Cálculo de mão de obra é prévia manual (valor/hora digitável); a formalização
  e as regras (hora noturna/emergência automáticas) são o **CP06**.
- Sem máscara de valores monetários (entrada numérica simples).
- Migration ainda não aplicada em Supabase real.

## Conclusão

🟢 **CHECKPOINT 05 CONCLUÍDO** — CRUD de serviços + filtro + prévia de mão de obra,
ligado à camada de dados; build/lint/typecheck sem erros; testado no modo
demonstração (criar, editar, excluir, filtrar, cross-feature com clientes).

---

# CHECKPOINT 06 — SISTEMA DE CÁLCULO DE MÃO DE OBRA

- **Número do checkpoint:** 06
- **Data:** 2026-09-07
- **Título:** Fórmula centralizada de mão de obra + valor/hora automático por tipo de hora.

## Fórmula

```
valor da mão de obra = quantidade de técnicos × horas trabalhadas × valor da hora
```

O **valor da hora** é:
1. o valor informado no serviço, quando > 0 (sobrescrita manual); ou
2. o valor da configuração para o tipo de hora selecionado
   (`valor_hora_tecnica` / `valor_hora_auxiliar` / `valor_hora_emergencia` /
   `valor_hora_noturna`).

## Funcionalidades criadas

- **Módulo de cálculo** ([src/utils/maoDeObra.ts](src/utils/maoDeObra.ts)):
  - `calcularMaoDeObra(entrada, config)` → `{ valorHora, origemValorHora
    ('informado' | 'configuracao'), valorMaoDeObra, ... }` (arredondado a 2 casas).
  - `recalcularMaoDeObraDoServico(servico, config)` — recalcula um serviço já salvo
    a partir das configurações atuais.
- **Formulário de serviço** ([ServicoFormPage](src/pages/ServicoFormPage.tsx)):
  - Campo "Valor da hora" agora é **opcional**: vazio = usa a configuração.
    Texto de apoio mostra qual valor será usado
    (ex.: *"Vazio = usa a configuração (Emergência: R$ 200,00)"*).
  - Prévia ao vivo com o rótulo **"(configuração)"** quando o valor vem das configurações.
  - Ao salvar, `valor_hora_aplicado` e `valor_mao_de_obra` são gravados a partir do
    resultado do módulo de cálculo (valor/hora efetivo é persistido, nunca 0).
  - Removido o botão "usar valor das configurações" (agora é o comportamento padrão).
- **Detalhe do serviço** ([ServicoDetailPage](src/pages/ServicoDetailPage.tsx)):
  linha com a conta explícita `técnicos × horas × valor/h = total`.
- Limpeza: removida a função duplicada `calcularMaoDeObra` de `src/utils/format.ts`
  (agora só existe em `src/utils/maoDeObra.ts`).

## Arquivos criados

```
src/utils/maoDeObra.ts
```

## Arquivos modificados

```
src/pages/ServicoFormPage.tsx    usa o módulo de cálculo; valor/hora opcional
src/pages/ServicoDetailPage.tsx  + linha da fórmula
src/utils/format.ts              removida calcularMaoDeObra (duplicada)
CHECKPOINT.md / PROJECT_STATUS.md / README.md
```

## Testes executados

| Teste | Resultado |
| ----- | --------- |
| `npx tsc` / `npm run build` / `npm run lint` | ✅ 0 erros / 0 warnings — 137 módulos, JS 461,1 kB (gzip 129,7 kB) |
| Novo serviço, tipo "Emergência", valor/hora vazio | ✅ apoio mostra "Emergência: R$ 200,00"; prévia `2 × 2h × R$ 200,00 (configuração) = R$ 800,00` |
| Digitar valor/hora manual (250) | ✅ prévia `2 × 2h × R$ 250,00 = R$ 1.000,00` (sem rótulo "configuração") |
| Salvar com valor/hora vazio | ✅ detalhe grava `Valor da hora R$ 200,00` e `Total R$ 800,00` (não zera) |
| Detalhe: linha da fórmula | ✅ `2 × 2h × R$ 200,00 = R$ 800,00` |
| Trocar tipo de hora (Técnica/Auxiliar/Emergência/Noturna) | ✅ valor de apoio muda conforme a configuração |

> Testado no modo demonstração (config demo: técnica 120 / auxiliar 70 /
> emergência 200 / noturna 160).

## Problemas encontrados e corrigidos

Nenhum erro de build. Ajuste de organização: uma só fonte para a fórmula de mão
de obra (`src/utils/maoDeObra.ts`).

## Problemas conhecidos / pendências

- Se o valor/hora da configuração mudar depois, serviços já salvos mantêm o valor
  gravado (é o comportamento esperado); `recalcularMaoDeObraDoServico` está pronto
  para uma futura ação de "recalcular".
- Sem máscara de valores monetários.

## Conclusão

🟢 **CHECKPOINT 06 CONCLUÍDO** — fórmula de mão de obra centralizada e testada;
valor/hora automático por tipo de hora, com sobrescrita manual; build/lint/typecheck
sem erros.

---

# CHECKPOINT 07 — SISTEMA DE MATERIAIS

- **Número do checkpoint:** 07
- **Data:** 2026-09-07
- **Título:** Adicionar materiais manualmente a um serviço (nome, quantidade,
  unidade, valor de custo, valor cobrado).

## Funcionalidades criadas

- **Formulário de material** ([MaterialFormPage](src/pages/MaterialFormPage.tsx)):
  rotas `/servicos/:id/materiais/novo` e `/servicos/:id/materiais/:materialId/editar`.
  Campos: nome (obrigatório), quantidade, **unidade** (un / m / m² / kg / cx / rl /
  pc / l / h), valor de custo, valor cobrado. Resumo ao vivo: custo total,
  cobrado total e diferença. Validação (nome, quantidade > 0).
- **Detalhe do serviço** ([ServicoDetailPage](src/pages/ServicoDetailPage.tsx)):
  a seção "Materiais" virou editável — **"+ Adicionar"**, **Editar** e **Excluir**
  (com confirmação) por item; "Total materiais"; o total do serviço é recalculado.
- **Tela `/materiais`** ([MateriaisPage](src/pages/MateriaisPage.tsx)): reescrita —
  lista todos os materiais (via `materiaisService`) com o serviço/cliente de
  origem e link "Ver serviço"; totais de custo / cobrado / diferença; mantém o
  cartão "Fotografar / enviar nota fiscal" (placeholder para CP09/10). Os materiais
  são adicionados dentro do serviço (a tela não tem "+ Novo" global).
- **`materiaisService`**: adicionada a função `getMaterial(id)`.
- **Config** `src/config/material.ts`: rótulos de unidade + `MARGEM_PADRAO` (20).

## Arquivos criados

```
src/pages/MaterialFormPage.tsx
src/config/material.ts
```

## Arquivos modificados

```
src/services/materiaisService.ts   + getMaterial(id)
src/pages/ServicoDetailPage.tsx    materiais editáveis (adicionar/editar/excluir)
src/pages/MateriaisPage.tsx        reescrita: usa materiaisService (era mockData)
src/routes/AppRoutes.tsx           + rotas de material
CHECKPOINT.md / PROJECT_STATUS.md / README.md
```

Nada foi apagado. `mockData.ts` continua servindo Dashboard / Orçamentos /
Documentos até os seus checkpoints.

## Testes executados

| Teste | Resultado |
| ----- | --------- |
| `npx tsc` / `npm run build` / `npm run lint` | ✅ 0 erros / 0 warnings — 139 módulos, JS 469,5 kB (gzip 131,2 kB) |
| Detalhe do serviço (seed) mostra 1 material + "Total materiais R$ 162,00" | ✅ |
| Adicionar "Cabo flexível 2,5mm²" (50 m, custo 3, cobrado 4) | ✅ resumo `Custo R$ 150 / Cobrado R$ 200 / Diferença R$ 50`; salvou; serviço → "Materiais (2)", Total **R$ 842,00** |
| Editar material (quantidade 50 → 60) | ✅ subtotal R$ 240,00; Total materiais R$ 402,00; serviço Total R$ 882,00 |
| Excluir material (com confirmação) | ✅ volta a "Materiais (1)"; Total R$ 642,00 |
| Tela `/materiais` | ✅ lista com cliente/serviço, "Ver serviço", totais (custo R$ 135 / cobrado R$ 162 / dif. R$ 27) |
| Layout mobile (375px) do detalhe do serviço | ✅ seção de materiais legível |

## Resultado do build

```
tsc -p tsconfig.json && vite build
✓ 139 modules transformed
dist/assets/index-*.js   469,50 kB │ gzip: 131,24 kB
✓ built in 6,49s — PWA v0.20.5
```

## Problemas encontrados e corrigidos

Nenhum erro de build. O `import` de `asRowOrNull` / `demoFind` foi adicionado em
`materiaisService.ts` para a nova `getMaterial`.

## Problemas conhecidos / pendências

- `valor_cobrado` é digitado manualmente; o cálculo automático pela margem
  (padrão 20%) é o **CP08** (o campo `margem_percentual` já é gravado com 20).
- Sem máscara de valores monetários.
- Materiais de **orçamento** (sem serviço) serão tratados no CP13.
- Migration ainda não aplicada em Supabase real.

## Conclusão

🟢 **CHECKPOINT 07 CONCLUÍDO** — CRUD de materiais dentro do serviço + tela geral
de materiais, ligado à camada de dados; build/lint/typecheck sem erros; testado
no modo demonstração (adicionar, editar, excluir, totais, cross-feature).

---

# CHECKPOINT 08 — MARGEM AUTOMÁTICA SOBRE MATERIAIS

- **Número do checkpoint:** 08
- **Data:** 2026-09-07
- **Título:** Cálculo automático do valor cobrado a partir do custo + margem.

## Regra

```
valor cobrado = custo × (1 + margem% / 100)
valor da margem = valor cobrado − custo
```

Margem padrão = `configuracoes.margem_padrao_materiais` (20% na demo).
O **valor de custo** (o que foi pago) é sempre gravado separado do valor cobrado.

## Funcionalidades criadas

- **Módulo de margem** ([src/utils/margem.ts](src/utils/margem.ts)):
  `aplicarMargem(custo, %)`, `valorDaMargem(custo, %)`, `margemImplicita(custo, cobrado)`
  (tudo arredondado a 2 casas).
- **Formulário de material** ([MaterialFormPage](src/pages/MaterialFormPage.tsx)):
  - Seletor de margem em chips: **0% / 10% / 20% / 30% / 40% / Outra** (campo % livre).
  - Ao criar, a margem já vem com o padrão da empresa (`getConfiguracao()`).
  - **Valor cobrado calculado automaticamente** conforme custo × margem; ao mudar
    custo ou margem, atualiza sozinho.
  - Permite **digitar o valor cobrado manualmente** — nesse caso mostra a margem
    implícita (*"margem ≈ 50%"*) e um link **"Recalcular pela margem"** para voltar
    ao automático.
  - Resumo: `Custo (qtd × unit)` + `Margem (%) = R$ x` = **Valor cobrado**.
  - Grava `margem_percentual` = margem efetiva (a selecionada ou a implícita).
- **Detalhe do serviço** ([ServicoDetailPage](src/pages/ServicoDetailPage.tsx)):
  - Cada material mostra `… · margem X%`.
  - **"Aplicar margem a todos os materiais"** — chips 0/10/20/30/40 que atualizam a
    margem e o valor cobrado de todos os materiais do serviço de uma vez (com
    confirmação), recalculando os totais.
- Limpeza: `aplicarMargem` saiu de `src/utils/format.ts` (agora em `utils/margem.ts`);
  adicionada `formatNumber` em `format.ts`.

## Arquivos criados

```
src/utils/margem.ts
```

## Arquivos modificados

```
src/pages/MaterialFormPage.tsx     seletor de margem + valor cobrado automático
src/pages/ServicoDetailPage.tsx    margem por item + "aplicar margem a todos"
src/config/material.ts             + MARGENS_PRESET
src/utils/format.ts                − aplicarMargem, + formatNumber
CHECKPOINT.md / PROJECT_STATUS.md / README.md
```

## Testes executados

| Teste | Resultado |
| ----- | --------- |
| `npx tsc` / `npm run build` / `npm run lint` | ✅ 0 erros / 0 warnings — 140 módulos, JS 472,2 kB (gzip 132,2 kB) |
| Novo material, custo R$ 100, margem 20% (padrão) | ✅ resumo `Custo R$ 100 + Margem 20% (R$ 20,00) = R$ 120,00` (exemplo do enunciado) |
| Trocar chip para 30% | ✅ valor cobrado → R$ 130,00 |
| Digitar valor cobrado R$ 150 manual | ✅ *"Valor definido manualmente (margem ≈ 50%)"*, resumo `Margem (50%) R$ 50,00` |
| "Recalcular pela margem" | ✅ volta a R$ 130,00 (margem 30%) |
| Salvar | ✅ detalhe mostra "Fio 4mm · margem 30% · R$ 130,00" |
| "Aplicar margem a todos" → 40% | ✅ Disjuntor custo R$ 45 → R$ 63,00 (3× = R$ 189); Fio custo R$ 100 → R$ 140,00; Total materiais R$ 329,00 |
| Layout mobile (375px) | ✅ chips de margem quebram linha corretamente |

## Resultado do build

```
tsc -p tsconfig.json && vite build
✓ 140 modules transformed
dist/assets/index-*.js   472,19 kB │ gzip: 132,18 kB
✓ built in 3,22s — PWA v0.20.5
```

## Problemas encontrados e corrigidos

| Problema | Correção |
| -------- | -------- |
| `MARGENS_PRESET as const` gera tupla com `.includes` de tipo estreito | `const PRESETS: readonly number[] = MARGENS_PRESET` no formulário |

## Problemas conhecidos / pendências

- A margem padrão vem da configuração, mas a tela **Configurações** ainda é só
  interface (edição virá num checkpoint próprio / junto do financeiro).
- Materiais de **orçamento** (sem serviço) serão tratados no CP13.
- Sem máscara de valores monetários. Migration ainda não aplicada em Supabase real.

## Conclusão

🟢 **CHECKPOINT 08 CONCLUÍDO** — valor cobrado calculado pela margem (0/10/20/30/40/
personalizada), com sobrescrita manual e aplicação em massa; custo preservado;
build/lint/typecheck sem erros; testado no modo demonstração.

---

# CHECKPOINT 09 — UPLOAD DE NOTAS FISCAIS

- **Número do checkpoint:** 09
- **Data:** 2026-09-07
- **Título:** Enviar foto / imagem / PDF da nota fiscal e vincular ao serviço.

## Funcionalidades criadas

- **Migration** ([supabase/migrations/20260907120000_notas_fiscais.sql](supabase/migrations/20260907120000_notas_fiscais.sql)):
  tabela `notas_fiscais` (metadados + `texto_ocr` já previsto para o CP10) com RLS
  por usuário; bucket de Storage **`notas-fiscais`** (privado) + políticas de
  Storage restringindo cada usuário à própria pasta (`<user_id>/…`).
- **Camada de armazenamento modular** ([src/services/storageService.ts](src/services/storageService.ts)):
  `upload(file, pasta)` / `getUrl(path)` / `remove(path)`.
  - Supabase: `supabase.storage.from('notas-fiscais')` (upload, `createSignedUrl`, `remove`).
  - Demonstração: arquivo vira **data URL** no `localStorage` (limite 2 MB); nada sai do navegador.
- **Serviço de notas** ([src/services/notasFiscaisService.ts](src/services/notasFiscaisService.ts)):
  `listNotasFiscais`, `enviarNotaFiscal` (upload + registro, com rollback do
  arquivo se o registro falhar), `getUrlNotaFiscal`, `excluirNotaFiscal`
  (remove registro **e** arquivo).
- **UI** ([src/components/servico/NotasFiscais.tsx](src/components/servico/NotasFiscais.tsx)),
  incluída no detalhe do serviço: seção "Notas fiscais / cupons" com botão
  **"+ Enviar"** (`accept="image/*,application/pdf"`), lista com miniatura
  (imagens) ou ícone (PDF), tamanho, links **Abrir** e **Excluir**, estados de
  carregando / erro.
- **Tipos** (`src/types/database.ts`): `NotaFiscalRow/Insert/Update` + `notas_fiscais`
  em `Database.Tables`.
- Tela `/materiais`: texto do cartão de nota fiscal atualizado (aponta para o serviço).

## Arquivos criados

```
supabase/migrations/20260907120000_notas_fiscais.sql
src/services/storageService.ts
src/services/notasFiscaisService.ts
src/components/servico/NotasFiscais.tsx
```

## Arquivos modificados

```
src/types/database.ts             + NotaFiscal* e notas_fiscais
src/pages/ServicoDetailPage.tsx    + <NotasFiscais>
src/pages/MateriaisPage.tsx        texto do cartão de nota fiscal
supabase/README.md                lista de migrations + Storage
CHECKPOINT.md / PROJECT_STATUS.md / README.md
```

## Testes executados

| Teste | Resultado |
| ----- | --------- |
| `npx tsc` / `npm run build` / `npm run lint` | ✅ 0 erros / 0 warnings — 143 módulos, JS 478,6 kB (gzip 133,9 kB) |
| Enviar imagem (PNG) no detalhe do serviço | ✅ aparece "Notas fiscais / cupons (1)" com **miniatura** e link "Abrir" (data URL) |
| Arquivo gravado no `localStorage` (`mr-demo-file-<id>`) | ✅ |
| Enviar PDF | ✅ aparece com **ícone** de documento (não miniatura) |
| Persistência (navegar e voltar) | ✅ a nota continua listada |
| Excluir nota (com confirmação) | ✅ some da lista **e** o arquivo sai do `localStorage` |
| Arquivo > 2 MB (modo demo) | ✅ recusado: *"No modo demonstração o arquivo deve ter até 2 MB…"* |

> Testado no **modo demonstração**. O caminho do **Supabase Storage** está
> implementado (bucket + políticas na migration; `storageService`/`notasFiscaisService`
> já chamam a API), mas só pode ser testado com um projeto Supabase real.

## Resultado do build

```
tsc -p tsconfig.json && vite build
✓ 143 modules transformed
dist/assets/index-*.js   478,57 kB │ gzip: 133,88 kB
✓ built in 2,60s — PWA v0.20.5
```

## Problemas encontrados e corrigidos

| Problema | Correção |
| -------- | -------- |
| `React.ChangeEvent` sem `React` global (jsx: react-jsx) | `import { type ChangeEvent } from 'react'` |

## Problemas conhecidos / pendências

- Upload real no Supabase Storage **não testado** (sem projeto). Aplicar a
  migration `20260907120000_notas_fiscais.sql` e conferir o bucket.
- No modo demonstração o limite é 2 MB por arquivo (localStorage).
- `texto_ocr` / `processado_em` existem mas só serão preenchidos no **CP10**.

## Conclusão

🟢 **CHECKPOINT 09 CONCLUÍDO** — envio de foto/imagem/PDF de nota fiscal vinculado
ao serviço, com camada de armazenamento modular (Supabase Storage / localStorage);
build/lint/typecheck sem erros; testado no modo demonstração.

---

# CHECKPOINT 10 — OCR / LEITURA AUTOMÁTICA DE NOTAS

- **Número do checkpoint:** 10
- **Data:** 2026-09-07
- **Título:** Arquitetura modular de OCR + interpretação do texto da nota +
  tela de confirmação editável.

## Regra 10 (baixo custo / sem fornecedor preso)

- **Nenhum fornecedor pago** foi adicionado. O provedor padrão é **"manual"**:
  o usuário digita ou cola o texto da nota e o sistema extrai os itens.
- A camada `OCRService` permite plugar um provedor real depois (Tesseract.js no
  navegador ou uma Edge Function chamando Google Vision / OCR.space) com
  `setOCRProvider({ nome, extrairTexto })` — sem tocar no resto do app.

## Fluxo (conforme o enunciado)

```
imagem/PDF (CP09)
   ↓  texto (informado ou, no futuro, por OCR)
interpretarTextoNota(texto)
   ↓  itens { nome, quantidade, unidade, valorUnitário, valorTotal }
tela de confirmação  ── sempre editável (editar / adicionar / remover) ──
   ↓  margem por lote
createMaterial() para cada item  →  materiais do serviço
```

## Funcionalidades criadas

- **`src/services/ocrService.ts`** (reescrito):
  - `OCRProvider` com `extrairTexto?(arquivo)` opcional; provedor padrão `manual`.
  - `interpretarTextoNota(texto)` — parser best-effort de linhas de nota/cupom:
    detecta valores em R$, quantidade + unidade, ignora linhas de total/CNPJ/
    pagamento, calcula valor unitário quando só há o total.
  - `OCRService.podeLerImagem()`, `.lerImagem(file)`, `.interpretar(texto)`.
- **`notasFiscaisService`**: `getNotaFiscal(id)` e `atualizarTextoOcr(id, texto)`
  (grava `texto_ocr` + `processado_em`).
- **Tela de leitura** ([LeituraNotaPage](src/pages/LeituraNotaPage.tsx)),
  rota `/servicos/:id/notas/:notaId/ler`:
  - Mostra a imagem da nota (quando é imagem) como referência.
  - Textarea do texto (pré-preenchido com `texto_ocr`), com exemplo.
  - "Extrair itens" → lista **editável** (nome, qtd, unidade, custo unitário,
    remover) + "adicionar item" manual.
  - Chips de **margem para todos os itens** (0/10/20/30/40); mostra custo total e
    cobrado total.
  - "Adicionar ao serviço" → cria os materiais (`valor_custo` = custo lido,
    `valor_cobrado` = custo × margem).
- **`NotasFiscais`**: link **"Ler itens"** em cada nota.
- Rota adicionada em `AppRoutes.tsx`.

## Arquivos criados

```
src/pages/LeituraNotaPage.tsx
```

## Arquivos modificados

```
src/services/ocrService.ts              reescrito (parser + provedor modular)
src/services/notasFiscaisService.ts     + getNotaFiscal, atualizarTextoOcr
src/components/servico/NotasFiscais.tsx  + "Ler itens"
src/routes/AppRoutes.tsx                 + rota de leitura
CHECKPOINT.md / PROJECT_STATUS.md / README.md
```

## Testes executados

| Teste | Resultado |
| ----- | --------- |
| `npx tsc` / `npm run build` / `npm run lint` | ✅ 0 erros / 0 warnings — 145 módulos, JS 486,6 kB (gzip 136,3 kB) |
| Enviar nota (imagem) → "Ler itens" | ✅ abre a tela de leitura com aviso "OCR de imagem não ativado" |
| Colar texto de cupom (4 itens + cabeçalho + "VALOR TOTAL 400,00") → "Extrair itens" | ✅ extraiu **4 itens**, ignorou o cabeçalho e a linha de total |
| Conferência do parser | ✅ `DISJUNTOR BIPOLAR 40A / 3 / un / 45`; `CABO FLEXIVEL 2,5MM / 50 / m / 3,5`; `FITA ISOLANTE / 5 / un / 4,2`; `TOMADA 2P+T 10A / 10 / pc / 6,9` |
| Margem 30% no lote | ✅ Custo total R$ 400,00 → Cobrado total R$ 520,00 |
| "Adicionar ao serviço" | ✅ 4 materiais criados (margem 30%): Tomada R$ 8,97/un, Fita R$ 5,46/un, Cabo R$ 4,55/un, Disjuntor R$ 58,50/un; Total materiais R$ 682,00 |

## Resultado do build

```
tsc -p tsconfig.json && vite build
✓ 145 modules transformed
dist/assets/index-*.js   486,57 kB │ gzip: 136,26 kB
✓ built in 11,14s — PWA v0.20.5
```

## Problemas encontrados e corrigidos

| Problema | Correção |
| -------- | -------- |
| Alternância de unidades `(un\|m\|m2\|…)` casava "m" antes de "m2" | Ordena as alternativas por tamanho (maior primeiro) |
| Atribuição dinâmica `{ ...it, [campo]: valor }` com campo tipado | `as ItemEditavel` no `map` |

## Problemas conhecidos / pendências

- OCR real de **imagem** não incluído (decisão de custo). Para ativar: adicionar
  Tesseract.js **ou** uma Edge Function e chamar `setOCRProvider(...)`.
- O parser é heurístico — funciona bem em cupons com colunas de valores; a tela de
  confirmação existe justamente para corrigir o que não sair certo.

## Conclusão

🟢 **CHECKPOINT 10 CONCLUÍDO** — leitura de nota via texto (parser modular) →
confirmação editável → materiais no serviço; `OCRService` pronto para um provedor
de OCR real; build/lint/typecheck sem erros; testado no modo demonstração.

---

# CHECKPOINT 11 — REGISTRO DE FOTOS DO SERVIÇO

- **Número do checkpoint:** 11
- **Data:** 2026-09-07
- **Título:** Fotos do serviço com categorias **antes / durante / depois**.

## Funcionalidades criadas

- **Migration** ([supabase/migrations/20260907130000_fotos_servico.sql](supabase/migrations/20260907130000_fotos_servico.sql)):
  enum `foto_categoria` (antes/durante/depois); tabela `fotos_servico` (com RLS por
  usuário); bucket de Storage **`fotos-servicos`** (privado) + políticas por pasta
  do usuário.
- **`storageService` generalizado**: os métodos passam a receber o **bucket**
  (`notas-fiscais` | `fotos-servicos`); `notasFiscaisService` foi ajustado para
  passar o bucket.
- **`fotosServicoService`**: `listFotosServico(servicoId)`, `enviarFotoServico(file,
  servicoId, categoria)` (só imagens; com rollback), `getUrlFotoServico`,
  `atualizarFotoServico`, `excluirFotoServico` (remove registro + arquivo).
- **Componente** ([src/components/servico/FotosServico.tsx](src/components/servico/FotosServico.tsx)),
  no detalhe do serviço: três seções (Antes / Durante / Depois), cada uma com
  **"+ Adicionar"** (`accept="image/*"` + `capture="environment"` → abre a câmera
  no celular), **grade de miniaturas** (clique abre em tamanho real), **Excluir**
  por foto, estados de carregando / erro.
- **Tipos** (`src/types/database.ts`): `FotoCategoria`, `FotoServicoRow/Insert/Update`,
  `fotos_servico` em `Database.Tables`, `foto_categoria` em `Enums`.

## Arquivos criados

```
supabase/migrations/20260907130000_fotos_servico.sql
src/services/fotosServicoService.ts
src/components/servico/FotosServico.tsx
```

## Arquivos modificados

```
src/services/storageService.ts         métodos agora recebem o bucket
src/services/notasFiscaisService.ts    passa 'notas-fiscais' nas chamadas
src/types/database.ts                  + FotoServico* / foto_categoria
src/pages/ServicoDetailPage.tsx        + <FotosServico>
supabase/README.md                     + migration / tabela / bucket
CHECKPOINT.md / PROJECT_STATUS.md / README.md
```

## Testes executados

| Teste | Resultado |
| ----- | --------- |
| `npx tsc` / `npm run build` / `npm run lint` | ✅ 0 erros / 0 warnings — 147 módulos, JS 490,7 kB (gzip 137,1 kB) |
| Detalhe do serviço mostra "Fotos do serviço (0)" com Antes / Durante / Depois | ✅ |
| Enviar foto em "Antes" e em "Depois" | ✅ "Fotos do serviço (2)" — Antes (1), Durante (0), Depois (1) |
| Miniaturas renderizam (data URL) | ✅ 2 `<img>` |
| Excluir foto (com confirmação) | ✅ some da grade **e** o arquivo sai do `localStorage` |
| Persistência (navegar e voltar) | ✅ a foto continua na categoria |
| Layout mobile (375px) | ✅ seções e grade de 3 colunas |

## Resultado do build

```
tsc -p tsconfig.json && vite build
✓ 147 modules transformed
dist/assets/index-*.js   490,71 kB │ gzip: 137,11 kB
✓ built in 3,70s — PWA v0.20.5
```

## Problemas encontrados e corrigidos

Nenhum erro. Refatoração: `storageService` agora recebe o bucket como parâmetro
(reaproveitado por notas fiscais e fotos).

## Problemas conhecidos / pendências

- Upload real no Supabase Storage **não testado** (sem projeto) — aplicar a
  migration nova e conferir o bucket `fotos-servicos`.
- No modo demonstração o limite é 2 MB por foto (localStorage).
- Sem edição de legenda na UI (o serviço `atualizarFotoServico` já existe).

## Conclusão

🟢 **CHECKPOINT 11 CONCLUÍDO** — fotos do serviço por categoria (antes/durante/
depois), com galeria e exclusão; camada de storage reaproveitada; build/lint/
typecheck sem erros; testado no modo demonstração.

---

# CHECKPOINT 12 — DESCRIÇÃO INTELIGENTE DO SERVIÇO

- **Número do checkpoint:** 12
- **Data:** 2026-09-07
- **Título:** O técnico escreve com as próprias palavras → descrição profissional.

## Regra 10 (sem fornecedor preso, sem serviço pago)

- Provedor padrão **`regras`** (montagem local, sem API): formata as anotações e
  acrescenta o resumo estruturado (materiais aplicados, mão de obra).
- Para usar IA de verdade: criar um provedor e registrar com `setAIProvider(...)`
  — a chamada à API deve ficar numa **Edge Function** (chave nunca no frontend).

## Funcionalidades criadas

- **`src/services/aiService.ts`** (reescrito):
  - `AIProvider.gerarDescricaoServico(ctx)` onde `ctx` = `{ textoLivre, materiais?,
    quantidadeTecnicos?, horasTrabalhadas?, clienteNome? }`.
  - Provedor `regras`: primeira letra maiúscula, pontuação, capitalização após
    ponto; blocos "Materiais aplicados: …" e "Mão de obra: N técnico(s), X h".
  - `AIService.usaIA()`, `.gerarDescricaoServico(ctx)`.
- **Detalhe do serviço** ([ServicoDetailPage](src/pages/ServicoDetailPage.tsx)):
  botão **"✨ Gerar descrição profissional"** na área da descrição → prévia
  (usa `descricao_livre` + materiais + horas/técnicos + cliente) → **"Aplicar como
  descrição"** (salva via `updateServico`) ou "Descartar".
- **Formulário do serviço** ([ServicoFormPage](src/pages/ServicoFormPage.tsx)):
  botão **"✨ Gerar descrição a partir das anotações"** abaixo do campo de
  anotações → preenche o campo "Descrição do serviço".
- Ajuste de textos: telas de nota fiscal não mencionam mais "OCR chega no CP10"
  (o OCR já existe).

## Arquivos criados

Nenhum.

## Arquivos modificados

```
src/services/aiService.ts               reescrito (provedor modular + regras)
src/pages/ServicoDetailPage.tsx          + gerar/aplicar descrição
src/pages/ServicoFormPage.tsx            + gerar descrição das anotações
src/components/servico/NotasFiscais.tsx  texto do vazio
src/pages/MateriaisPage.tsx              texto do cartão
CHECKPOINT.md / PROJECT_STATUS.md / README.md
```

## Testes executados

| Teste | Resultado |
| ----- | --------- |
| `npx tsc` / `npm run build` / `npm run lint` | ✅ 0 erros / 0 warnings — 148 módulos, JS 493,6 kB (gzip 137,9 kB) |
| Detalhe do serviço (seed): "✨ Gerar descrição profissional" | ✅ prévia: *"Troquei 3 disjuntores e revisei o quadro, 4 horas de trabalho.\n\nMateriais aplicados: 3 un de Disjuntor bipolar 40A.\n\nMão de obra: 1 técnico, 4 h de trabalho."* |
| "Aplicar como descrição" | ✅ `servico.descricao` atualizado; anotações preservadas |
| Formulário (novo serviço): anotações + 2 téc. + 3h → gerar | ✅ campo Descrição preenchido: *"Instalei 4 tomadas novas e passei fio, demorou umas 3 horas.\n\nMão de obra: 2 técnicos, 3 h de trabalho."* |

## Resultado do build

```
tsc -p tsconfig.json && vite build
✓ 148 modules transformed
dist/assets/index-*.js   493,60 kB │ gzip: 137,89 kB
✓ built in 2,82s — PWA v0.20.5
```

## Problemas encontrados e corrigidos

Nenhum erro de build.

## Problemas conhecidos / pendências

- O provedor `regras` **não é IA** — é formatação + montagem. Faz um bom trabalho
  em texto curto; para reescrita real de linguagem, plugar um provedor de IA
  (Anthropic/OpenAI) via Edge Function e `setAIProvider`.
- A geração no formulário não considera os materiais (eles ainda não existem num
  serviço novo); no detalhe, sim.

## Conclusão

🟢 **CHECKPOINT 12 CONCLUÍDO** — geração de descrição profissional a partir das
anotações, com `AIService` modular (provedor `regras` por padrão, pronto para IA
real); build/lint/typecheck sem erros; testado no modo demonstração.

---

# CHECKPOINT 13 — SISTEMA COMPLETO DE ORÇAMENTO

- **Número do checkpoint:** 13
- **Data:** 2026-09-07
- **Título:** Orçamento com composição do valor e geração a partir do serviço.

## Fórmula

```
VALOR TOTAL = materiais (custo) + margem de materiais + mão de obra
            + deslocamento + outros custos
```

## Funcionalidades criadas

- **`src/utils/orcamento.ts`**: `calcularTotalOrcamento(componentes)`,
  `totalMateriaisCobrado(...)`, `formatarNumeroOrcamento(ano, seq)`.
- **`src/config/orcamento.ts`**: rótulos e cores dos status.
- **`orcamentosService`**:
  - `proximoNumeroOrcamento()` → `ORC-AAAA-NNN` (sequencial por ano).
  - `criarOrcamentoDoServico(servicoId)` → orçamento em rascunho com materiais
    (custo + margem), mão de obra, deslocamento e outros custos do serviço.
- **Lista `/orcamentos`** ([OrcamentosPage](src/pages/OrcamentosPage.tsx)):
  reescrita — usa `listOrcamentos()` + nome do cliente; filtro por status;
  estados carregando / erro / vazio.
- **Formulário `/orcamentos/novo` e `/orcamentos/:id/editar`**
  ([OrcamentoFormPage](src/pages/OrcamentoFormPage.tsx)): cliente, serviço
  (opcional) com **"Puxar valores do serviço"**, número (automático), status,
  os 5 valores da composição com **total ao vivo**, validade, garantia, forma de
  pagamento, observações.
- **Detalhe `/orcamentos/:id`** ([OrcamentoDetailPage](src/pages/OrcamentoDetailPage.tsx)):
  composição discriminada + **VALOR TOTAL**, alterar status por select,
  condições, link para o serviço/cliente, Editar / Excluir, aviso "PDF no CP14".
- **Detalhe do serviço**: botão **"Gerar orçamento deste serviço"**.
- Rotas adicionadas em `AppRoutes.tsx`.

## Arquivos criados

```
src/utils/orcamento.ts
src/config/orcamento.ts
src/pages/OrcamentoFormPage.tsx
src/pages/OrcamentoDetailPage.tsx
```

## Arquivos modificados

```
src/services/orcamentosService.ts   + proximoNumeroOrcamento, criarOrcamentoDoServico
src/pages/OrcamentosPage.tsx         reescrita (usa orcamentosService)
src/pages/ServicoDetailPage.tsx      + "Gerar orçamento deste serviço"
src/routes/AppRoutes.tsx             + rotas de orçamento
CHECKPOINT.md / PROJECT_STATUS.md / README.md
```

## Testes executados

| Teste | Resultado |
| ----- | --------- |
| `npx tsc` / `npm run build` / `npm run lint` | ✅ 0 erros / 0 warnings — 152 módulos, JS 509 kB (gzip 141 kB) |
| "Gerar orçamento deste serviço" (seed) | ✅ criou **ORC-2026-016**; composição: Materiais R$ 135 + Margem R$ 27 + Mão de obra R$ 480 = **VALOR TOTAL R$ 642,00** |
| Lista `/orcamentos` | ✅ 2 orçamentos, com nome do cliente e status |
| Alterar status (Rascunho → Enviado) pelo select do detalhe | ✅ persistiu; refletiu na lista |
| Novo orçamento: número automático (ORC-2026-017) | ✅ |
| "Puxar valores do serviço" | ✅ materiais 135 / margem 27 / mão de obra 480 / total R$ 642,00 |
| Adicionar deslocamento R$ 50 → total ao vivo | ✅ **R$ 692,00**; detalhe confere |
| Excluir orçamento (com confirmação) | ✅ volta para a lista |
| Layout mobile (375px) do formulário | ✅ 1 coluna, campos grandes |

## Resultado do build

```
tsc -p tsconfig.json && vite build
✓ 152 modules transformed
dist/assets/index-*.js   509 kB │ gzip: ~141 kB
✓ built in 3,4s — PWA v0.20.5
```

O Vite avisa (amarelo, não é erro) que o bundle passou de 500 kB — otimização
(code-splitting por rota) pode ser feita no CP23.

## Problemas encontrados e corrigidos

| Problema | Correção |
| -------- | -------- |
| Warning `react-hooks/exhaustive-deps` no `useMemo` do total | Total calculado direto (é barato), sem `useMemo` |

## Problemas conhecidos / pendências

- Materiais vinculados diretamente a um orçamento (sem serviço) não têm UI — o
  orçamento sem serviço recebe os valores digitados manualmente.
- PDF do orçamento é o **CP14**.

## Conclusão

🟢 **CHECKPOINT 13 CONCLUÍDO** — orçamento com composição do valor (materiais +
margem + mão de obra + deslocamento + outros = total), geração a partir do
serviço, numeração automática, status e condições; build/lint/typecheck sem
erros; testado no modo demonstração.

---

# CHECKPOINT 14 — GERAÇÃO DE PDF DO ORÇAMENTO

- **Data:** 2026-09-07 · **Título:** PDF profissional do orçamento + Configurações funcionais.

## Funcionalidades

- **`jspdf`** adicionado (open source, sem serviço pago), **carregado sob demanda**
  (dynamic import → chunk separado).
- **`src/services/pdf/pdfDoc.ts`**: construtor de PDF A4 — cabeçalho (logo + dados
  da empresa), seções, pares chave/valor, parágrafos, tabela, total, QR, grade de
  fotos, rodapé com paginação.
- **`src/services/pdf/orcamentoPdf.ts`**: monta o PDF do orçamento (empresa,
  cliente, dados, descrição, materiais, composição do valor, **VALOR TOTAL**,
  forma de pagamento, PIX, garantia, observações).
- **`documentacaoService.gerarPdfOrcamento(id)`**: carrega os dados, gera o PDF,
  **registra em `documentos`** e devolve o blob.
- **`src/utils/download.ts`**: `baixarBlob`, `compartilharArquivo` (Web Share),
  `linkWhatsApp`.
- **Configurações** ([ConfiguracoesPage](src/pages/ConfiguracoesPage.tsx)):
  reescrita — agora **salva de verdade** (empresa, financeiro, PIX) via
  `configuracoesService`.
- **Detalhe do orçamento**: card "Documento" com **Baixar PDF** / **Compartilhar**
  + link WhatsApp do cliente.

## Testes

| Teste | Resultado |
| --- | --- |
| `tsc` / `build` / `lint` | ✅ 0 erros / 0 warnings — 522 módulos, JS 523 kB (jspdf em chunk separado) |
| Salvar Configurações (empresa + PIX) | ✅ "Configurações salvas." |
| "Baixar PDF" no orçamento ORC-2026-015 | ✅ download `Orcamento-ORC-2026-015.pdf` (blob), sem erro; documento registrado em `documentos` |

🟢 **CHECKPOINT 14 CONCLUÍDO**.

---

# CHECKPOINT 15 — SISTEMA PIX

- **Data:** 2026-09-07 · **Título:** PIX copia e cola (BR Code) + QR Code.

## Funcionalidades

- **`src/services/pixService.ts`** (puro, sem dependência para o payload; QR com
  `qrcode-generator` open source):
  - `gerarPixCopiaECola(dados)` — payload **EMV® MPM** (BR Code) com CRC16.
  - `gerarPixQrDataUrl(texto)` — QR Code PNG (canvas).
  - `pixConfigurado(config)`, `montarPixOrcamento(...)`.
- **Configurações → Configuração PIX**: beneficiário, chave, cidade (salvam).
- **Detalhe do orçamento**: card "Pagamento via PIX" com **QR Code**, o código
  **copia e cola** e botão **"Copiar código PIX"**.
- **PDF do orçamento**: inclui o QR e o copia-e-cola quando o PIX está configurado.

## Testes

| Teste | Resultado |
| --- | --- |
| `tsc` / `build` / `lint` | ✅ 0 erros / 0 warnings |
| Detalhe do orçamento com PIX configurado | ✅ QR renderiza (PNG); copia-e-cola de 144 chars: `000201...br.gov.bcb.pix...ORC-2026-015...6304<CRC>` |
| PDF com PIX | ✅ gerado sem erro (QR embutido) |

🟢 **CHECKPOINT 15 CONCLUÍDO**.

---

# CHECKPOINTS 16–18 — ORDEM DE SERVIÇO, RELATÓRIO TÉCNICO E RECIBO (PDF)

- **Data:** 2026-09-07.

## Funcionalidades

- **`src/services/pdf/documentosPdf.ts`**:
  - `montarOrdemServicoPdf` — cliente, dados do serviço, descrição, materiais,
    valores, total, linhas de assinatura (técnico / cliente).
  - `montarRelatorioTecnicoPdf` — descrição e atividades, materiais, **fotos por
    categoria** (antes / durante / depois, em grade), conclusão, assinatura.
  - `montarReciboPdf` — "Recebi(emos) de … a importância de … referente a …",
    valor por extenso (simplificado), data, forma de pagamento, assinatura.
- **`documentacaoService`**: `gerarPdfOrdemServico(servicoId)`,
  `gerarPdfRelatorioTecnico(servicoId)` (usa `fotosServicoHelper` para converter as
  fotos em data URL), `gerarPdfRecibo(dados)`. Todos registram em `documentos`.
- **`src/utils/imagem.ts`** (`urlParaDataUrl`) — reaproveitado pelo logo e fotos.
- **Detalhe do serviço**: card "Documentos (PDF)" → **Ordem de serviço** /
  **Relatório técnico**.
- **`ReciboFormPage`** (`/recibos/novo`): cliente, valor, data, referência, forma
  de pagamento → gera o PDF. Pré-preenchido a partir de um orçamento **aprovado**
  ("Gerar recibo deste orçamento").
- **Tela `/documentos`** ([DocumentosPage](src/pages/DocumentosPage.tsx)):
  reescrita — histórico dos PDFs gerados, com links para o orçamento/serviço.

## Testes

| Teste | Resultado |
| --- | --- |
| `tsc` / `build` / `lint` | ✅ 0 erros / 0 warnings — 526 módulos |
| "Ordem de serviço" e "Relatório técnico" no detalhe do serviço | ✅ downloads `Ordem-Servico-*.pdf` e `Relatorio-Tecnico-*.pdf`, sem erro |
| Recibo (`/recibos/novo`) | ✅ download `Recibo-*.pdf`; volta para `/documentos` |
| Lista `/documentos` | ✅ 5 documentos (recibo, relatório, OS, 2 orçamentos) com tipo/data/links |

🟢 **CHECKPOINTS 16, 17 e 18 CONCLUÍDOS**.

---

# CHECKPOINT 19 — FINANCEIRO

- **`src/services/financeiroService.ts`** — `getResumoFinanceiro()`: gasto em
  materiais, materiais cobrados, margem sobre materiais, mão de obra, faturamento
  (orçamentos aprovados), total orçado, contagens.
- **`/financeiro`** (novo item de menu): cartões + bloco de faturamento
  (aprovado / em aberto / total orçado) + serviços concluídos.
- Testado: gasto R$ 135 / cobrado R$ 162 / margem R$ 27 / mão de obra R$ 480 /
  faturamento R$ 642.

🟢 **CHECKPOINT 19 CONCLUÍDO**.

---

# CHECKPOINT 20 — DASHBOARD REAL

- **`dashboardService`** reescrito: usa `financeiroService` + serviços +
  orçamentos + clientes reais (sem `mockData`).
- **Dashboard** reescrito: cartões reais (orçamentos do mês, serviços concluídos,
  valor faturado, materiais registrados), **orçamentos e serviços recentes**
  clicáveis com badge de status, botões "+ Novo" para as telas de criação, link
  para o Financeiro.
- **`src/services/mockData.ts` e `src/types/index.ts` removidos** (nenhuma tela
  usava mais).
- Testado: dashboard mostra ORC-2026-015 (Aprovado, R$ 642) e o serviço concluído.

🟢 **CHECKPOINT 20 CONCLUÍDO**.

---

# CHECKPOINT 21 — HISTÓRICO COMPLETO DO CLIENTE

- **Detalhe do cliente** expandido: totais (mão de obra, materiais, faturado);
  **serviços** e **orçamentos** clicáveis com status e valor; **documentos**
  gerados para o cliente (`listDocumentos({ clienteId })`).
- Testado: cliente Maria — totais R$ 480 / R$ 162 / R$ 642, 1 serviço, 1
  orçamento, 4 documentos.

🟢 **CHECKPOINT 21 CONCLUÍDO**.

---

# CHECKPOINT 22 — COMPARTILHAMENTO

- **`src/utils/download.ts`**: `baixarBlob` (download), `compartilharArquivo`
  (Web Share API do celular, com fallback para download), `linkWhatsApp`.
- **Orçamento**: "Baixar PDF", "Compartilhar", link "Abrir conversa no WhatsApp"
  (usa o WhatsApp do cliente), "Copiar código PIX".
- **Serviço**: "Ordem de serviço" / "Relatório técnico" tentam compartilhar e
  caem para download.
- **Recibo**: gerado e baixado.

🟢 **CHECKPOINT 22 CONCLUÍDO**.

---

# CHECKPOINT 23 — FINALIZAÇÃO E TESTES

- **Build de produção**: `tsc` + `vite build` — **0 erros / 0 warnings**,
  527 módulos.
- **Lint**: `eslint` — **0 erros / 0 warnings**.
- **Code splitting** (`vite.config.ts`): `react`, `supabase` em chunks próprios;
  `jspdf` / `html2canvas` / `qrcode` **carregados sob demanda** (só ao gerar
  PDF / QR). Sem aviso de tamanho de bundle.
  - Chunks: app ~152 kB, react ~164 kB, supabase ~222 kB, jspdf ~358 kB (lazy),
    html2canvas ~202 kB (lazy), qrcode ~22 kB (lazy).
- **Limpeza**: removidos `mockData.ts`, `types/index.ts`; versão → `1.0.0`.
- **PWA**: `manifest.webmanifest` + `sw.js` + `workbox` gerados.
- **Testes manuais no navegador** (modo demonstração), sem erros de console:
  login/logout, clientes (CRUD + histórico), serviços (CRUD + mão de obra +
  materiais + OCR + fotos), orçamentos (composição + PDF + PIX), documentos
  (OS / relatório / recibo em PDF), financeiro, dashboard real, responsivo
  celular/desktop.

## Pendências gerais (fora do escopo dos checkpoints)

- **Supabase real não configurado** — aplicar as 3 migrations em
  `supabase/migrations/` e preencher `.env` para sair do modo demonstração.
  O caminho de produção (Auth, banco, Storage) está implementado mas foi testado
  apenas com dados de demonstração (`localStorage`).
- `src/types/database.ts` é manual — regenerar com `supabase gen types` depois.
- OCR de imagem e IA de texto: camadas modulares prontas, sem provedor pago
  (regra 10). Para ativar, `setOCRProvider` / `setAIProvider` + Edge Function.

🟢 **CHECKPOINT 23 CONCLUÍDO — PROJETO v1.0.0**.

---

# CHECKPOINT 24 — EQUIPE (TÉCNICO + AJUDANTE) + IA REAL DE TEXTO

> Ajuste pedido depois do go-live: "sempre se trabalha de 2" — poder lançar
> técnico **e** ajudante juntos, cada um com sua hora e seu valor de hora.
> Também: ligar uma IA de verdade para escrever a descrição do serviço.

## Mão de obra com dois grupos

Antes: `nº técnicos × horas × 1 valor/h`.
Agora:

```
valor_mao_de_obra =
    (nº técnicos  × horas técnicos  × R$/h técnico)
  + (nº ajudantes × horas ajudantes × R$/h ajudante)
```

- R$/h do ajudante: valor informado no serviço **ou** `configuracoes.valor_hora_auxiliar`.
- Horas dos técnicos e dos ajudantes são **separadas**.
- Sem ajudante (`quantidade_ajudantes = 0`) o resultado é idêntico ao anterior
  — registros antigos continuam válidos.

### Banco (`supabase/migrations/20260910120000_equipe_tecnico_ajudante.sql`)

- `servicos` +: `quantidade_ajudantes`, `horas_ajudantes`, `valor_hora_ajudante` (default 0).
- `orcamentos` +: `mo_qtd_tecnicos`, `mo_horas_tecnicos`, `mo_valor_hora_tecnico`,
  `mo_qtd_ajudantes`, `mo_horas_ajudantes`, `mo_valor_hora_ajudante` (default 0).
  Se tudo 0, o orçamento usa só `valor_mao_de_obra` (valor único, comportamento antigo).
- Só `add column if not exists` — **seguro rodar no banco já em uso**.
- Incluído em `supabase/setup-completo.sql`.

### Código

- `src/utils/maoDeObra.ts` — `calcularMaoDeObra` agora recebe `{ tecnicos, ajudantes }`
  e devolve `{ tecnicos, ajudantes, valorMaoDeObra, ... }` (campos antigos mantidos
  por compatibilidade). `recalcularMaoDeObraDoServico` lê as colunas novas.
- `ServicoFormPage` / `ServicoDetailPage` — seção "Técnicos" + seção "Ajudantes"
  (rótulo deixa 0 se trabalhou sozinho); resumo mostra os dois subtotais.
- `OrcamentoFormPage` — bloco "Mão de obra": detalhe por equipe (6 campos) **ou**
  valor total único. "Puxar valores do serviço" traz o detalhe pronto.
- `OrcamentoDetailPage` + PDFs (`orcamentoPdf`, `documentosPdf`) — linhas
  separadas de técnicos / ajudantes quando há detalhe.
- Tipos (`src/types/database.ts`), seeds de demonstração e services atualizados.

## IA de texto de verdade (opcional, gratuita)

- `supabase/functions/gerar-descricao/` — Edge Function que chama o **Google
  Gemini** (modelo `gemini-1.5-flash`, faixa gratuita). A chave fica no secret
  `GEMINI_API_KEY` — nunca no front. README com o passo a passo de publicação.
- `src/services/aiService.ts` — novo provedor `edge` (`criarProvedorEdge`) que
  invoca a função; **se ela não existir ou falhar, cai no gerador local** (`regras`)
  automaticamente — a tela nunca quebra.
- `src/services/aiSetup.ts` (importado em `main.tsx`) registra o provedor `edge`
  quando o Supabase está configurado.
- Contexto da IA agora inclui ajudantes.

## Verificação

- `npm run build` — **0 erros / 0 warnings**.
- `npm run lint` — **0 erros / 0 warnings** (`supabase/functions` são Deno, ignorados).

## Pendências para o usuário (Supabase)

1. Rodar `supabase/migrations/20260910120000_equipe_tecnico_ajudante.sql` no
   SQL Editor (ou `setup-completo.sql` de novo — é idempotente).
2. (Opcional, para IA) publicar a função `gerar-descricao` e configurar o secret
   `GEMINI_API_KEY` — ver `supabase/functions/gerar-descricao/README.md`.

🟢 **CHECKPOINT 24 CONCLUÍDO**.

---

# CHECKPOINT 25 — FOTO NO MATERIAL · FORMA DE COBRANÇA · LUCRO E MARGEM

> Pedido pós go-live: integrar foto no cadastro de materiais, poder editar
> tudo, escolher a forma de cobrança da mão de obra e ver lucro/margem na
> hora — tudo otimizado para celular. Nada recriado; nenhum dado apagado.

## 1. Foto no cadastro de material

- Colunas novas em `materiais`: `foto_path`, `foto_nome`, `foto_tipo` (NULL = sem foto).
- `src/services/materialFotoService.ts` — upload/URL/remoção no bucket privado
  `fotos-servicos` (pasta `materiais`); no modo demonstração vira data URL.
- `MaterialFormPage` — bloco "Foto do material (opcional)": botão "📷 Tirar foto /
  escolher imagem" (`capture="environment"`), pré-visualização, **Trocar** e
  **Remover**. Ao salvar: sobe a nova foto, apaga a antiga só depois do sucesso.
- `materiaisService.deleteMaterial` remove o arquivo junto.
- `ServicoDetailPage` — miniatura ao lado de cada material (abre a foto).
- `MateriaisPage` — link **Editar** por material (além de "Ver serviço").

## 2. Forma de cobrança da mão de obra

`servicos.forma_cobranca` e `orcamentos.mo_forma_cobranca` (`text` + `check`):

| Forma | Cálculo |
| ----- | ------- |
| `hora` (padrão) | qtd × horas × R$/h — igual ao anterior |
| `diaria` | qtd × diárias × R$/diária (mesmas colunas, rótulos mudam) |
| `fechado` | um valor único de mão de obra, digitado direto |

- `src/utils/maoDeObra.ts` — `calcularMaoDeObra` aceita `forma` + `valorFechado`;
  `'fechado'` devolve o valor único, `'hora'`/`'diaria'` usam a mesma fórmula.
- Seletor "Como cobrar?" (3 botões) no serviço e no orçamento; rótulos de campo
  e do resumo se adaptam (Horas ↔ Diárias, Valor da hora ↔ Valor da diária).
- PDFs (orçamento e ordem de serviço) mostram a forma e usam `h`/`d`.

## 3. Lucro e margem imediatos

- `src/utils/lucro.ts` — `calcularLucro({ receita, custo }) → { receita, custo,
  lucro, margemPct }`.
  - Receita = mão de obra + materiais cobrados + deslocamento + outros.
  - Custo = materiais a preço de custo + `custo_mao_de_obra` (o que você paga à
    equipe; **não** é cobrado do cliente) — coluna nova em `servicos`.
- `ServicoFormPage` — card "Custos e lucro" com lucro da mão de obra ao vivo.
- `ServicoDetailPage` — card "Lucro e margem" (com materiais): receita, custo,
  lucro e **margem %**.
- `OrcamentoFormPage` / `OrcamentoDetailPage` — bloco de lucro/margem ao vivo
  (Lucro = total − custo dos materiais).

## 4. "Editar tudo"

- Material: agora inclui a foto; editável em `MateriaisPage` e no serviço.
- `FotosServico` — cada foto tem um seletor para **mover** entre
  Antes / Durante / Depois (usa `atualizarFotoServico`, que já existia).
- Cliente, serviço, orçamento, configurações, materiais, notas: edição completa
  já existente, agora cobrindo os campos novos.

## Banco — `supabase/migrations/20260910130000_material_foto_cobranca_lucro.sql`

Só `alter table ... add column if not exists` (+ `check` idempotente). Seguro
rodar no banco em uso; linhas antigas ficam com `forma_cobranca = 'hora'` e
custos/foto em 0/NULL. Incluído em `supabase/setup-completo.sql`.

## Verificação

- `npm run build` — **0 erros / 0 warnings**.
- `npm run lint` — **0 erros / 0 warnings**.
- Testado no navegador (Supabase real, modo dev):
  - Serviço: "Por hora / Por diária / Valor fechado" alternam campos e rótulos;
    diária 2×3×R$250 + ajudante 1×3×R$120 = **R$ 1.860** ✔; fechado R$ 2.000 ✔;
    card de lucro atualiza ao digitar ✔.
  - Serviço (detalhe): cards "Total cobrado" e "Lucro e margem" (margem %) ✔.
  - Material: bloco de foto (tirar/trocar/remover) ✔.
  - Orçamento: seletor de forma + bloco de lucro (R$ 530 / 84,1%) ✔.
  - Console sem erros.
  - Telas em largura de celular ✔ (grades `sm:` colapsam para 1 coluna).

## Pendências para o usuário (Supabase)

Rodar `supabase/migrations/20260910130000_material_foto_cobranca_lucro.sql` no
SQL Editor (ou `setup-completo.sql` de novo). Sem isso, **abrir** as telas
funciona, mas **salvar** serviço/material/orçamento dá erro de coluna inexistente.

🟢 **CHECKPOINT 25 CONCLUÍDO**.
