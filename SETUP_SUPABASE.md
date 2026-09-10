# Passo a passo — conectar o MR ORÇAMENTOS ao Supabase

Guia completo, do zero, para tirar o sistema do **modo demonstração** e colocar
dados reais (login de verdade, banco de dados, upload de arquivos).

Tempo estimado: **15 a 25 minutos**. Não precisa saber programar — é só seguir na ordem.

> Enquanto você **não** fizer isto, o app continua funcionando em modo
> demonstração (dados só no navegador). Nada quebra.

---

## Índice

1. [Criar a conta e o projeto no Supabase](#1-criar-a-conta-e-o-projeto-no-supabase)
2. [Pegar a URL e a chave do projeto](#2-pegar-a-url-e-a-chave-do-projeto)
3. [Criar o arquivo `.env`](#3-criar-o-arquivo-env)
4. [Criar as tabelas e os buckets (SQL)](#4-criar-as-tabelas-e-os-buckets-sql)
5. [Configurar o login (Authentication)](#5-configurar-o-login-authentication)
6. [Testar no seu computador](#6-testar-no-seu-computador)
7. [(Opcional) Regenerar os tipos TypeScript](#7-opcional-regenerar-os-tipos-typescript)
8. [Publicar na internet (Vercel)](#8-publicar-na-internet-vercel)
9. [Conferência final](#9-conferência-final)
10. [Problemas comuns](#10-problemas-comuns)

---

## 1. Criar a conta e o projeto no Supabase

1. Abra <https://supabase.com> e clique em **Start your project**.
2. Entre com o **GitHub** (recomendado) ou com e-mail.
3. Na tela **Organizations**, se não houver nenhuma, clique em **New organization**:
   - **Name:** `MR Elétrica`
   - **Type:** Personal
   - **Plan:** **Free** (grátis — suficiente para começar)
4. Clique em **New project** e preencha:
   - **Project name:** `mr-orcamentos`
   - **Database Password:** clique em **Generate a password** e **guarde essa senha**
     num lugar seguro (você quase nunca vai usar, mas não dá para recuperar).
   - **Region:** escolha a mais perto — **South America (São Paulo)** se disponível,
     senão **East US (North Virginia)**.
   - **Pricing plan:** Free.
5. Clique em **Create new project** e **espere** (leva 1 a 2 minutos, aparece
   "Setting up project...").

---

## 2. Pegar a URL e a chave do projeto

1. Com o projeto pronto, no menu da esquerda clique na **engrenagem (Project Settings)**
   → **API**.
2. Anote dois valores desta página:

   | Campo na tela do Supabase | Onde vai usar |
   | ------------------------- | ------------- |
   | **Project URL** (ex.: `https://abcdefgh.supabase.co`) | `VITE_SUPABASE_URL` |
   | **Project API keys → `anon` `public`** (uma chave longa) | `VITE_SUPABASE_ANON_KEY` |

> ⚠️ **Nunca** copie a chave `service_role`. Só a `anon public`. A `anon` pode
> ficar no site sem problema porque o banco está protegido por RLS (regras que
> você vai criar no passo 4).

---

## 3. Criar o arquivo `.env`

Na **pasta do projeto** (`aplicativo da MrEletrica`):

1. Faça uma cópia do arquivo `.env.example` e renomeie a cópia para **`.env`**
   (só isso, sem nada antes do ponto).
2. Abra o `.env` no Bloco de Notas e deixe assim (troque pelos **seus** valores
   do passo 2):

   ```
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=cole-aqui-a-chave-anon-public
   ```

3. Salve.

> O arquivo `.env` **não** vai para o GitHub (já está no `.gitignore`). Está certo.

---

## 4. Criar as tabelas e os buckets (SQL)

1. No painel do Supabase, menu da esquerda → **SQL Editor** → **New query**.
2. Abra o arquivo **`supabase/setup-completo.sql`** (dentro da pasta do projeto),
   selecione **tudo** (`Ctrl+A`) e **copie** (`Ctrl+C`).
3. **Cole** dentro do SQL Editor do Supabase.
4. Clique em **Run** (ou `Ctrl+Enter`).
5. Deve aparecer **"Success. No rows returned"**. Se der erro, veja a
   [seção 10](#10-problemas-comuns).

### Conferir se deu certo

- **Table Editor** (menu esquerdo): devem existir as tabelas
  `profiles`, `configuracoes`, `clientes`, `servicos`, `orcamentos`, `materiais`,
  `documentos`, `notas_fiscais`, `fotos_servico`.
- **Storage** (menu esquerdo): devem existir os buckets
  `notas-fiscais` e `fotos-servicos` (ambos **privados** — cadeado fechado).
- **Authentication → Policies**: cada tabela deve ter políticas (RLS) listadas.

> O arquivo `setup-completo.sql` junta todas as migrations em uma. Se preferir, dá
> para rodar uma a uma, na ordem do nome, a partir de `supabase/migrations/`.

### Já rodou antes? Atualização do Checkpoint 24

Se o banco já estava criado e você só quer a novidade **técnico + ajudante**,
rode apenas o arquivo
**`supabase/migrations/20260910120000_equipe_tecnico_ajudante.sql`**
(ou o `setup-completo.sql` inteiro de novo — ele é idempotente, não duplica nada).
São só colunas novas com valor padrão 0; nenhum dado existente é alterado.

### IA para escrever a descrição do serviço (opcional, gratuito)

Sem isso, o app arruma o texto que você digita. Para a IA **escrever sozinha**,
publique a Edge Function `gerar-descricao` e configure a chave gratuita do
Google Gemini — passo a passo em
**`supabase/functions/gerar-descricao/README.md`**.

---

## 5. Configurar o login (Authentication)

No painel: **Authentication** (menu esquerdo).

### 5.1. Provedor de e-mail e "Confirm email"

1. **Authentication → Sign In / Providers**.
2. Em **Auth Providers**, o **Email** deve aparecer como **Enabled**. Se estiver
   Disabled, clique nele e ligue **"Enable email provider"** → Save.
3. Ainda em **Sign In / Providers**, role até a seção **"User Signups"**. Na
   linha **"Confirm email"**:
   - Para **testar rápido agora**: **desligue** o toggle → **Save changes**.
     Assim, ao criar conta o login já funciona na hora, sem e-mail.
   - Para **produção de verdade**: pode deixar ligado (o usuário recebe um
     e-mail para confirmar — mas o e-mail grátis do Supabase entrega pouco;
     nesse caso configure um SMTP em Authentication → Emails). O sistema já
     trata os dois casos.

> ⚠️ Não confunda: **"Enable email provider"** (na aba do provedor Email) é o
> login por e-mail em si — deixe **LIGADO**. **"Confirm email"** (na seção
> "User Signups") é só a exigência de confirmar o e-mail — desligue para testar.

### 5.2. URLs

**Authentication → URL Configuration**:

1. **Site URL:**
   - Enquanto testa no computador: `http://localhost:5173`
   - Depois de publicar na Vercel: troque para a URL da Vercel
     (ex.: `https://mr-orcamentos.vercel.app`).
2. **Redirect URLs** — clique em **Add URL** e adicione (uma por linha):
   ```
   http://localhost:5173/**
   https://SEU-APP.vercel.app/**
   ```
   (o `/**` no final é importante — libera qualquer página, inclusive
   `/reset-password`).
3. **Save**.

> A recuperação de senha ("Esqueci minha senha") usa esses valores. Sem eles o
> link do e-mail não volta para o app.

---

## 6. Testar no seu computador

Na pasta do projeto, abra um terminal (Prompt de Comando ou PowerShell) e rode:

```bash
npm run dev
```

Abra <http://localhost:5173>.

1. O aviso amarelo **"Modo demonstração"** deve ter **sumido**. Se ainda
   aparecer, o `.env` não foi lido → pare o servidor (`Ctrl+C`) e rode
   `npm run dev` de novo.
2. Clique em **Criar conta**, preencha nome/e-mail/senha e cadastre.
   - Se você **desligou** o "Confirm email": entra direto no Dashboard.
   - Se **deixou ligado**: confirme pelo e-mail e depois faça login.
3. Cadastre um **Cliente**, crie um **Serviço**, gere um **Orçamento** e baixe
   o **PDF**. Confira no Supabase → **Table Editor** que os registros apareceram.
4. Em **Configurações**, preencha os dados da empresa e o PIX e salve.
5. No serviço, teste enviar uma **foto** — confira em **Storage → fotos-servicos**
   que o arquivo subiu (dentro de uma pasta com o seu ID de usuário).

Deu tudo certo? O sistema está no ar com dados reais. 🎉

---

## 7. (Opcional) Regenerar os tipos TypeScript

O arquivo `src/types/database.ts` foi escrito à mão e já bate com o banco. Se
quiser a versão "oficial" gerada pelo Supabase (recomendado antes de mexer no
código):

```bash
npx supabase login
npx supabase gen types typescript --project-id SEU_PROJECT_REF > src/types/database.ts
```

(`SEU_PROJECT_REF` é a parte do meio da Project URL: `https://SEU_PROJECT_REF.supabase.co`.)

Depois rode `npm run build` para conferir que continua sem erros.

---

## 8. Publicar na internet (Vercel)

### 8.1. Subir o código para o GitHub

1. Crie um repositório em <https://github.com/new> (pode ser **privado**),
   ex.: `mr-orcamentos`.
2. Na pasta do projeto:
   ```bash
   git init
   git add .
   git commit -m "MR Orçamentos v1.0.0"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/mr-orcamentos.git
   git push -u origin main
   ```

### 8.2. Importar na Vercel

1. Entre em <https://vercel.com> com o GitHub.
2. **Add New… → Project** → importe o repositório `mr-orcamentos`.
3. A Vercel detecta **Vite** sozinha. Deixe:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Abra **Environment Variables** e adicione as duas (mesmos valores do `.env`):

   | Name | Value |
   | ---- | ----- |
   | `VITE_SUPABASE_URL` | `https://SEU-PROJETO.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | sua chave `anon public` |

5. Clique em **Deploy** e espere.
6. Copie a URL final (ex.: `https://mr-orcamentos.vercel.app`).

### 8.3. Avisar o Supabase da URL nova

Volte ao Supabase → **Authentication → URL Configuration**:

- **Site URL:** troque para a URL da Vercel.
- **Redirect URLs:** confirme que `https://SEU-APP.vercel.app/**` está lá.
- **Save**.

### 8.4. Instalar no celular (PWA)

Abra a URL da Vercel no **Chrome do Android** → menu **⋮** → **Adicionar à tela
inicial**. No iPhone: **Safari → Compartilhar → Adicionar à Tela de Início**.

---

## 9. Conferência final

- [ ] Aviso "Modo demonstração" sumiu (local e na Vercel).
- [ ] Consigo criar conta e fazer login.
- [ ] "Esqueci minha senha" envia e-mail e o link volta para o app.
- [ ] Cliente / Serviço / Orçamento salvam e aparecem no **Table Editor**.
- [ ] PDF do orçamento baixa com os dados da empresa e o QR do PIX.
- [ ] Foto do serviço aparece em **Storage → fotos-servicos**.
- [ ] `npm run build` roda sem erro.

---

## 10. Problemas comuns

| Sintoma | Causa / solução |
| ------- | --------------- |
| Continua em "Modo demonstração" | `.env` não existe ou está com nome errado (tem que ser exatamente `.env`), ou o servidor não foi reiniciado. Pare (`Ctrl+C`) e rode `npm run dev`. Na Vercel: falta a variável de ambiente → adicione e faça **Redeploy**. |
| Erro no SQL: `type "public.servico_status" already exists` | Você rodou o SQL duas vezes. Sem problema — os `create type` são idempotentes; pode ignorar, ou rode de novo (o `do $$ ... exception ...` trata isso). |
| Erro no SQL: `permission denied for schema auth` / `for table users` | Rode o SQL pelo **SQL Editor do painel** (não por uma conexão externa). No painel ele roda com permissão de administrador. |
| Login diz "E-mail ou senha incorretos" logo após cadastrar | "Confirm email" está **ligado** e o e-mail não foi confirmado. Confirme pelo e-mail, ou desligue em **Authentication → Providers → Email**. |
| Link de recuperação de senha dá "Link inválido ou expirado" | Faltou o `/**` nas **Redirect URLs**, ou a **Site URL** está diferente do endereço que você está usando. |
| Upload de foto falha ("permissão") | O bucket ou as políticas de Storage não foram criados. Rode o `setup-completo.sql` de novo e confira em **Storage**. Se ainda faltar o bucket, crie manualmente: **Storage → New bucket** → nome `fotos-servicos` (e outro `notas-fiscais`), deixe **Public = OFF**, depois rode de novo só a parte das `create policy ... on storage.objects` do SQL. |
| Vercel: build falha | Rode `npm run build` no seu PC primeiro. Se passar lá e falhar na Vercel, quase sempre é variável de ambiente faltando. |
| OneDrive travando o `npm install` (erro `EPERM`) | Pause o OneDrive enquanto instala, ou mova o projeto para fora da pasta do OneDrive (ex.: `C:\dev\mr-orcamentos`). |

---

## Resumo ultrarrápido

```
1. supabase.com → New project (Free)
2. Project Settings → API → copiar Project URL e anon key
3. copiar .env.example para .env e colar os dois valores
4. SQL Editor → colar supabase/setup-completo.sql → Run
5. Authentication → Email (Confirm email OFF p/ testar) · URL Configuration:
   Site URL = http://localhost:5173 · Redirect URLs = http://localhost:5173/**
6. npm run dev → criar conta → testar
7. GitHub push → Vercel import → env vars → Deploy
8. Supabase: trocar Site URL / Redirect URLs para a URL da Vercel
```
