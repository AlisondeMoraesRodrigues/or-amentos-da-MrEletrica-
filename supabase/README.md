# Banco de dados — MR ORÇAMENTOS

Migrations SQL do projeto.

## Migrations

| Arquivo | Checkpoint | Conteúdo |
| ------- | ---------- | -------- |
| `20260906120000_initial_schema.sql` | CP03 | `profiles`, `configuracoes`, `clientes`, `servicos`, `orcamentos`, `materiais`, `documentos` + enums + triggers + RLS |
| `20260907120000_notas_fiscais.sql` | CP09 | `notas_fiscais` + bucket de Storage `notas-fiscais` (privado) + políticas |
| `20260907130000_fotos_servico.sql` | CP11 | `fotos_servico` (categorias antes/durante/depois) + bucket `fotos-servicos` (privado) + políticas |
| `20260910120000_equipe_tecnico_ajudante.sql` | CP24 | Colunas de ajudante em `servicos` + detalhe da mão de obra em `orcamentos` (técnico + ajudante). Só `alter table ... add column if not exists` — seguro rodar em banco já populado. |
| `20260910130000_material_foto_cobranca_lucro.sql` | CP25 | Foto no material (`materiais.foto_*`), forma de cobrança da mão de obra (`servicos.forma_cobranca`, `orcamentos.mo_forma_cobranca`: hora/diária/fechado) e `servicos.custo_mao_de_obra` para lucro. Só `add column if not exists` + `check`. |

## Tabelas

| Tabela | Descrição |
| ------ | --------- |
| `profiles` | Dados do usuário (espelha `auth.users`). Criada automaticamente no cadastro. |
| `configuracoes` | 1 linha por usuário: dados da empresa, valores de hora, margem, PIX. Criada automaticamente no cadastro. |
| `clientes` | Cadastro de clientes. |
| `servicos` | Serviços realizados (horas, técnicos, mão de obra). |
| `orcamentos` | Orçamentos e seus valores. |
| `materiais` | Materiais de um serviço e/ou orçamento. |
| `documentos` | PDFs gerados (orçamento, ordem de serviço, relatório, recibo). |
| `notas_fiscais` | Metadados das notas/cupons enviados (arquivo no bucket `notas-fiscais`). |
| `fotos_servico` | Fotos do serviço por categoria (antes/durante/depois; arquivo no bucket `fotos-servicos`). |

### Equipe (técnico + ajudante) — CP24

`servicos` e `orcamentos` calculam a mão de obra como:

```
(nº técnicos  × horas técnicos  × R$/h técnico)
+ (nº ajudantes × horas ajudantes × R$/h ajudante)
```

O R$/h do ajudante vem de `configuracoes.valor_hora_auxiliar` quando não
informado. Sem ajudante (`quantidade_ajudantes = 0`) o cálculo é igual ao
anterior. Em `orcamentos`, se as colunas `mo_*` estão todas em 0, vale o campo
único `valor_mao_de_obra`.

Todas as tabelas têm **RLS** habilitado: cada usuário só acessa os próprios
registros (`user_id = auth.uid()`).

## Como aplicar

> **Guia completo passo a passo:** [`../SETUP_SUPABASE.md`](../SETUP_SUPABASE.md)

### Opção A — Painel do Supabase (mais simples, sem instalar nada)

1. No painel do projeto: **SQL Editor → New query**.
2. Cole e rode **`setup-completo.sql`** (junta as 3 migrations na ordem certa).
   Ou rode cada arquivo de `migrations/` na ordem do nome.
3. Confira em **Table Editor**, **Authentication → Policies** e **Storage**
   (buckets `notas-fiscais` e `fotos-servicos` devem aparecer).

### Opção B — Supabase CLI

```bash
npm i -g supabase          # ou: npx supabase ...
supabase link --project-ref <SEU_PROJECT_REF>
supabase db push
```

## Gerar os tipos TypeScript a partir do banco

Depois de aplicar as migrations, o ideal é regenerar
[`src/types/database.ts`](../src/types/database.ts):

```bash
supabase gen types typescript --project-id <SEU_PROJECT_REF> > src/types/database.ts
```

O arquivo atual foi escrito à mão para bater com a migration e já permite
desenvolver sem o banco (modo demonstração).

## Modo demonstração

Sem `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, a camada de acesso a dados
(`src/services/*Service.ts`) usa um armazém local (`localStorage`, via
`src/services/demoStore.ts` e `demoSeed.ts`) — nada é enviado a servidor.
