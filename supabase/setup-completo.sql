-- ===========================================================================
-- MR ORÇAMENTOS — SETUP COMPLETO DO BANCO (cole tudo isto no SQL Editor)
-- Gerado a partir de migrations/ (CP03 + CP09 + CP11). Rodar UMA vez.
-- ===========================================================================

-- ===========================================================================
-- MR ORÇAMENTOS · Checkpoint 03 — Estrutura inicial do banco de dados
-- ---------------------------------------------------------------------------
-- Tabelas: profiles, clientes, servicos, materiais, orcamentos, documentos,
--          configuracoes
-- Cada tabela pertence a um usuário (user_id = auth.uid()) e é protegida por RLS.
-- Idempotente o suficiente para rodar uma vez em um projeto novo.
-- ===========================================================================

-- --- Extensões -------------------------------------------------------------
create extension if not exists "pgcrypto";

-- --- Tipos (enums) --------------------------------------------------------
do $$ begin
  create type public.servico_status as enum ('aberto', 'em_andamento', 'concluido', 'cancelado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.orcamento_status as enum ('rascunho', 'enviado', 'aprovado', 'reprovado', 'cancelado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.documento_tipo as enum ('orcamento', 'ordem_servico', 'relatorio_tecnico', 'recibo');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.material_unidade as enum ('un', 'm', 'm2', 'kg', 'cx', 'rl', 'pc', 'l', 'h');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.tipo_hora as enum ('tecnica', 'auxiliar', 'emergencia', 'noturna');
exception when duplicate_object then null; end $$;

-- --- Função utilitária: updated_at --------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ===========================================================================
-- profiles — dados do usuário (espelha auth.users)
-- ===========================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nome        text,
  email       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- configuracoes — 1 linha por usuário (dados da empresa, valores, PIX)
-- ===========================================================================
create table if not exists public.configuracoes (
  user_id                  uuid primary key references auth.users (id) on delete cascade,
  empresa_nome             text,
  empresa_cnpj             text,
  empresa_telefone         text,
  empresa_email            text,
  empresa_endereco         text,
  logo_url                 text,
  valor_hora_tecnica       numeric(12,2) not null default 0,
  valor_hora_auxiliar      numeric(12,2) not null default 0,
  valor_hora_emergencia    numeric(12,2) not null default 0,
  valor_hora_noturna       numeric(12,2) not null default 0,
  margem_padrao_materiais  numeric(6,2)  not null default 20,
  taxa_deslocamento        numeric(12,2) not null default 0,
  pix_beneficiario         text,
  pix_chave                text,
  pix_cidade               text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

drop trigger if exists trg_configuracoes_updated_at on public.configuracoes;
create trigger trg_configuracoes_updated_at
  before update on public.configuracoes
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- clientes
-- ===========================================================================
create table if not exists public.clientes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  nome         text not null,
  cpf          text,
  cnpj         text,
  telefone     text,
  whatsapp     text,
  email        text,
  endereco     text,
  cidade       text,
  condominio   text,
  responsavel  text,
  observacoes  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_clientes_user_id on public.clientes (user_id);
create index if not exists idx_clientes_nome    on public.clientes (user_id, nome);

drop trigger if exists trg_clientes_updated_at on public.clientes;
create trigger trg_clientes_updated_at
  before update on public.clientes
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- servicos
-- ===========================================================================
create table if not exists public.servicos (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,
  cliente_id           uuid references public.clientes (id) on delete set null,
  descricao            text not null default '',
  descricao_livre      text,
  horas_trabalhadas    numeric(8,2)  not null default 0,
  quantidade_tecnicos  integer       not null default 1,
  tipo_hora            public.tipo_hora not null default 'tecnica',
  valor_hora_aplicado  numeric(12,2) not null default 0,
  valor_mao_de_obra    numeric(12,2) not null default 0,
  taxa_deslocamento    numeric(12,2) not null default 0,
  outros_custos        numeric(12,2) not null default 0,
  status               public.servico_status not null default 'aberto',
  data_servico         date,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_servicos_user_id    on public.servicos (user_id);
create index if not exists idx_servicos_cliente_id on public.servicos (cliente_id);

drop trigger if exists trg_servicos_updated_at on public.servicos;
create trigger trg_servicos_updated_at
  before update on public.servicos
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- orcamentos
-- ===========================================================================
create table if not exists public.orcamentos (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users (id) on delete cascade,
  cliente_id               uuid references public.clientes (id) on delete set null,
  servico_id               uuid references public.servicos (id) on delete set null,
  numero                   text not null,
  status                   public.orcamento_status not null default 'rascunho',
  valor_materiais          numeric(12,2) not null default 0,
  valor_margem_materiais   numeric(12,2) not null default 0,
  valor_mao_de_obra        numeric(12,2) not null default 0,
  valor_deslocamento       numeric(12,2) not null default 0,
  outros_custos            numeric(12,2) not null default 0,
  valor_total              numeric(12,2) not null default 0,
  observacoes              text,
  garantia                 text,
  forma_pagamento          text,
  validade_data            date,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (user_id, numero)
);

create index if not exists idx_orcamentos_user_id    on public.orcamentos (user_id);
create index if not exists idx_orcamentos_cliente_id on public.orcamentos (cliente_id);
create index if not exists idx_orcamentos_status     on public.orcamentos (user_id, status);

drop trigger if exists trg_orcamentos_updated_at on public.orcamentos;
create trigger trg_orcamentos_updated_at
  before update on public.orcamentos
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- materiais — vinculados a um serviço e/ou orçamento
-- ===========================================================================
create table if not exists public.materiais (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  servico_id          uuid references public.servicos (id) on delete cascade,
  orcamento_id        uuid references public.orcamentos (id) on delete cascade,
  nome                text not null,
  quantidade          numeric(12,3) not null default 1,
  unidade             public.material_unidade not null default 'un',
  valor_custo         numeric(12,2) not null default 0,
  margem_percentual   numeric(6,2)  not null default 20,
  valor_cobrado       numeric(12,2) not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_materiais_user_id     on public.materiais (user_id);
create index if not exists idx_materiais_servico_id   on public.materiais (servico_id);
create index if not exists idx_materiais_orcamento_id on public.materiais (orcamento_id);

drop trigger if exists trg_materiais_updated_at on public.materiais;
create trigger trg_materiais_updated_at
  before update on public.materiais
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- documentos — PDFs gerados (orçamento, OS, relatório, recibo)
-- ===========================================================================
create table if not exists public.documentos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  tipo          public.documento_tipo not null,
  titulo        text not null,
  cliente_id    uuid references public.clientes (id) on delete set null,
  servico_id    uuid references public.servicos (id) on delete set null,
  orcamento_id  uuid references public.orcamentos (id) on delete set null,
  arquivo_url   text,
  dados         jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists idx_documentos_user_id on public.documentos (user_id);
create index if not exists idx_documentos_tipo    on public.documentos (user_id, tipo);

-- ===========================================================================
-- Novo usuário: cria profile + linha de configuracoes padrão
-- ===========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'full_name'),
    new.email
  )
  on conflict (id) do nothing;

  insert into public.configuracoes (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===========================================================================
-- RLS — cada usuário só enxerga e altera os próprios registros
-- ===========================================================================
alter table public.profiles      enable row level security;
alter table public.configuracoes enable row level security;
alter table public.clientes      enable row level security;
alter table public.servicos      enable row level security;
alter table public.orcamentos    enable row level security;
alter table public.materiais     enable row level security;
alter table public.documentos    enable row level security;

-- profiles (dono = id)
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- configuracoes (dono = user_id)
drop policy if exists "configuracoes_select_own" on public.configuracoes;
create policy "configuracoes_select_own" on public.configuracoes
  for select using (auth.uid() = user_id);
drop policy if exists "configuracoes_insert_own" on public.configuracoes;
create policy "configuracoes_insert_own" on public.configuracoes
  for insert with check (auth.uid() = user_id);
drop policy if exists "configuracoes_update_own" on public.configuracoes;
create policy "configuracoes_update_own" on public.configuracoes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Padrão para as demais tabelas: CRUD completo do dono (user_id).
do $$
declare
  t text;
begin
  foreach t in array array['clientes', 'servicos', 'orcamentos', 'materiais', 'documentos']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_select_own', t);
    execute format('create policy %I on public.%I for select using (auth.uid() = user_id)', t || '_select_own', t);

    execute format('drop policy if exists %I on public.%I', t || '_insert_own', t);
    execute format('create policy %I on public.%I for insert with check (auth.uid() = user_id)', t || '_insert_own', t);

    execute format('drop policy if exists %I on public.%I', t || '_update_own', t);
    execute format('create policy %I on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t || '_update_own', t);

    execute format('drop policy if exists %I on public.%I', t || '_delete_own', t);
    execute format('create policy %I on public.%I for delete using (auth.uid() = user_id)', t || '_delete_own', t);
  end loop;
end $$;


-- ===========================================================================
-- MR ORÇAMENTOS · Checkpoint 09 — Notas fiscais / cupons
-- ---------------------------------------------------------------------------
-- Tabela `notas_fiscais` (metadados) + bucket de Storage `notas-fiscais`
-- (arquivos: foto / imagem / PDF). RLS por usuário.
-- ===========================================================================

create table if not exists public.notas_fiscais (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  servico_id     uuid references public.servicos (id) on delete cascade,
  orcamento_id   uuid references public.orcamentos (id) on delete cascade,
  arquivo_path   text not null,             -- caminho no bucket (ou "demo/<id>")
  nome_arquivo   text not null,
  tipo_arquivo   text,                      -- image/jpeg, application/pdf, ...
  tamanho_bytes  bigint,
  texto_ocr      text,                      -- preenchido no Checkpoint 10
  processado_em  timestamptz,               -- quando o OCR rodou
  created_at     timestamptz not null default now()
);

create index if not exists idx_notas_fiscais_user_id    on public.notas_fiscais (user_id);
create index if not exists idx_notas_fiscais_servico_id on public.notas_fiscais (servico_id);

alter table public.notas_fiscais enable row level security;

drop policy if exists "notas_fiscais_select_own" on public.notas_fiscais;
create policy "notas_fiscais_select_own" on public.notas_fiscais
  for select using (auth.uid() = user_id);
drop policy if exists "notas_fiscais_insert_own" on public.notas_fiscais;
create policy "notas_fiscais_insert_own" on public.notas_fiscais
  for insert with check (auth.uid() = user_id);
drop policy if exists "notas_fiscais_update_own" on public.notas_fiscais;
create policy "notas_fiscais_update_own" on public.notas_fiscais
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "notas_fiscais_delete_own" on public.notas_fiscais;
create policy "notas_fiscais_delete_own" on public.notas_fiscais
  for delete using (auth.uid() = user_id);

-- --- Storage: bucket privado, cada usuário só acessa a própria pasta -------
insert into storage.buckets (id, name, public)
values ('notas-fiscais', 'notas-fiscais', false)
on conflict (id) do nothing;

-- Convém que o caminho do arquivo comece com o id do usuário:
--   notas-fiscais/<user_id>/<servico_id>/<arquivo>
drop policy if exists "notas_fiscais_storage_select" on storage.objects;
create policy "notas_fiscais_storage_select" on storage.objects
  for select using (
    bucket_id = 'notas-fiscais'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "notas_fiscais_storage_insert" on storage.objects;
create policy "notas_fiscais_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'notas-fiscais'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "notas_fiscais_storage_delete" on storage.objects;
create policy "notas_fiscais_storage_delete" on storage.objects
  for delete using (
    bucket_id = 'notas-fiscais'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- ===========================================================================
-- MR ORÇAMENTOS · Checkpoint 11 — Fotos do serviço
-- ---------------------------------------------------------------------------
-- Tabela `fotos_servico` + bucket de Storage `fotos-servicos`.
-- Categorias: antes / durante / depois. RLS por usuário.
-- ===========================================================================

do $$ begin
  create type public.foto_categoria as enum ('antes', 'durante', 'depois');
exception when duplicate_object then null; end $$;

create table if not exists public.fotos_servico (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  servico_id     uuid not null references public.servicos (id) on delete cascade,
  categoria      public.foto_categoria not null default 'durante',
  arquivo_path   text not null,
  nome_arquivo   text not null,
  tipo_arquivo   text,
  tamanho_bytes  bigint,
  legenda        text,
  created_at     timestamptz not null default now()
);

create index if not exists idx_fotos_servico_user_id    on public.fotos_servico (user_id);
create index if not exists idx_fotos_servico_servico_id on public.fotos_servico (servico_id, categoria);

alter table public.fotos_servico enable row level security;

drop policy if exists "fotos_servico_select_own" on public.fotos_servico;
create policy "fotos_servico_select_own" on public.fotos_servico
  for select using (auth.uid() = user_id);
drop policy if exists "fotos_servico_insert_own" on public.fotos_servico;
create policy "fotos_servico_insert_own" on public.fotos_servico
  for insert with check (auth.uid() = user_id);
drop policy if exists "fotos_servico_update_own" on public.fotos_servico;
create policy "fotos_servico_update_own" on public.fotos_servico
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "fotos_servico_delete_own" on public.fotos_servico;
create policy "fotos_servico_delete_own" on public.fotos_servico
  for delete using (auth.uid() = user_id);

-- --- Storage: bucket privado, pasta por usuário --------------------------
insert into storage.buckets (id, name, public)
values ('fotos-servicos', 'fotos-servicos', false)
on conflict (id) do nothing;

drop policy if exists "fotos_servico_storage_select" on storage.objects;
create policy "fotos_servico_storage_select" on storage.objects
  for select using (
    bucket_id = 'fotos-servicos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "fotos_servico_storage_insert" on storage.objects;
create policy "fotos_servico_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'fotos-servicos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "fotos_servico_storage_delete" on storage.objects;
create policy "fotos_servico_storage_delete" on storage.objects
  for delete using (
    bucket_id = 'fotos-servicos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- ###########################################################################
-- ## Checkpoint 24 — Equipe: tecnico + ajudante na mao de obra
-- ###########################################################################

-- ===========================================================================
-- MR ORÇAMENTOS · Checkpoint 24 — Equipe: técnico + ajudante na mão de obra
-- ---------------------------------------------------------------------------
-- Antes: mão de obra = nº de técnicos × horas × 1 valor de hora.
-- Agora: técnicos e ajudantes lançados juntos, cada grupo com sua hora e
--        seu valor de hora (o "auxiliar" já existe em configuracoes).
--
--   valor_mao_de_obra =
--       (quantidade_tecnicos  × horas_trabalhadas × valor_hora_tecnico)
--     + (quantidade_ajudantes × horas_ajudantes   × valor_hora_ajudante)
--
-- Colunas novas têm default 0 — registros antigos continuam válidos
-- (0 ajudante = comportamento anterior).
-- Idempotente: pode rodar mais de uma vez.
-- ===========================================================================

-- --- servicos: grupo de ajudantes -----------------------------------------
alter table public.servicos
  add column if not exists quantidade_ajudantes integer       not null default 0,
  add column if not exists horas_ajudantes      numeric(8,2)  not null default 0,
  add column if not exists valor_hora_ajudante  numeric(12,2) not null default 0;

comment on column public.servicos.quantidade_ajudantes is 'Nº de ajudantes na equipe (0 = sem ajudante).';
comment on column public.servicos.horas_ajudantes      is 'Horas trabalhadas pelos ajudantes.';
comment on column public.servicos.valor_hora_ajudante  is 'Valor/hora do ajudante aplicado (0 = usa configuracoes.valor_hora_auxiliar).';

-- --- orcamentos: composição da mão de obra (opcional, para o PDF) --------
alter table public.orcamentos
  add column if not exists mo_qtd_tecnicos      integer       not null default 0,
  add column if not exists mo_horas_tecnicos    numeric(8,2)  not null default 0,
  add column if not exists mo_valor_hora_tecnico numeric(12,2) not null default 0,
  add column if not exists mo_qtd_ajudantes     integer       not null default 0,
  add column if not exists mo_horas_ajudantes   numeric(8,2)  not null default 0,
  add column if not exists mo_valor_hora_ajudante numeric(12,2) not null default 0;

comment on column public.orcamentos.mo_qtd_tecnicos is 'Detalhamento da mão de obra do orçamento. Se tudo 0, usa-se apenas valor_mao_de_obra (valor único).';


-- ###########################################################################
-- ## Checkpoint 25 — Foto no material + forma de cobranca + custo/lucro
-- ###########################################################################

-- ===========================================================================
-- MR ORÇAMENTOS · Checkpoint 25
-- ---------------------------------------------------------------------------
--  1. Foto no cadastro de material (arquivo no bucket `fotos-servicos`).
--  2. Forma de cobrança da mão de obra: 'hora' | 'diaria' | 'fechado'.
--     - hora / diaria: quantidade × (horas OU diárias) × valor unitário
--     - fechado: um valor único de mão de obra, digitado direto.
--  3. Custo da equipe (o que você paga a ajudantes/terceiros) para o cálculo
--     imediato de lucro e margem.
--
-- Só `add column if not exists` com default — seguro rodar no banco em uso.
-- Idempotente.
-- ===========================================================================

-- 1. Foto do material -------------------------------------------------------
alter table public.materiais
  add column if not exists foto_path text,
  add column if not exists foto_nome text,
  add column if not exists foto_tipo text;

comment on column public.materiais.foto_path is 'Caminho no bucket fotos-servicos (ou demo/<id>). NULL = sem foto.';

-- 2. Forma de cobrança da mão de obra -------------------------------------
alter table public.servicos
  add column if not exists forma_cobranca    text          not null default 'hora',
  add column if not exists custo_mao_de_obra numeric(12,2) not null default 0;

alter table public.orcamentos
  add column if not exists mo_forma_cobranca text not null default 'hora';

-- trava os valores aceitos (aceita linhas antigas: default 'hora')
do $$ begin
  alter table public.servicos
    add constraint servicos_forma_cobranca_chk
    check (forma_cobranca in ('hora', 'diaria', 'fechado'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.orcamentos
    add constraint orcamentos_mo_forma_cobranca_chk
    check (mo_forma_cobranca in ('hora', 'diaria', 'fechado'));
exception when duplicate_object then null; end $$;

comment on column public.servicos.forma_cobranca is 'hora | diaria | fechado. Em hora/diaria, horas_trabalhadas e horas_ajudantes guardam a quantidade de horas OU de diárias.';
comment on column public.servicos.custo_mao_de_obra is 'Quanto você paga à equipe (ajudante/terceiro). Entra no cálculo de lucro. NÃO é cobrado do cliente.';
