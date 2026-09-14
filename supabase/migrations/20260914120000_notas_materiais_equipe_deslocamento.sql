-- ===========================================================================
-- MR ORÇAMENTOS · Checkpoint 27 — "Novo Serviço" inteligente
-- ---------------------------------------------------------------------------
-- Catálogo de materiais com histórico de preços (por loja/código), equipe
-- (funcionários com diária) e deslocamento/combustível detalhado por serviço.
--
-- NÃO mexe nas tabelas existentes além de `alter table ... add column`.
-- Todas as tabelas novas seguem o mesmo padrão de RLS das anteriores.
-- Idempotente: seguro rodar mais de uma vez / em banco já em uso.
-- ===========================================================================

-- ===========================================================================
-- lojas — fornecedores onde os materiais são comprados
-- ===========================================================================
create table if not exists public.lojas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  nome        text not null,
  cnpj        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_lojas_user_id on public.lojas (user_id);
create index if not exists idx_lojas_nome    on public.lojas (user_id, nome);

drop trigger if exists trg_lojas_updated_at on public.lojas;
create trigger trg_lojas_updated_at
  before update on public.lojas
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- materiais_catalogo — catálogo de produtos do usuário (por código/nome)
-- ===========================================================================
create table if not exists public.materiais_catalogo (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  nome               text not null,
  codigo             text,                 -- código do produto/fabricante
  sku                text,                 -- código interno da loja
  marca              text,
  unidade            public.material_unidade not null default 'un',
  loja_id            uuid references public.lojas (id) on delete set null,
  ultimo_preco       numeric(12,2) not null default 0,
  maior_preco        numeric(12,2) not null default 0,
  menor_preco        numeric(12,2) not null default 0,
  preco_medio        numeric(12,2) not null default 0,
  ultima_compra_em   date,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_materiais_catalogo_user_id on public.materiais_catalogo (user_id);
create index if not exists idx_materiais_catalogo_sku     on public.materiais_catalogo (user_id, sku);
create index if not exists idx_materiais_catalogo_nome    on public.materiais_catalogo (user_id, nome);

drop trigger if exists trg_materiais_catalogo_updated_at on public.materiais_catalogo;
create trigger trg_materiais_catalogo_updated_at
  before update on public.materiais_catalogo
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- materiais_compras — histórico de preços (uma linha por compra)
-- ===========================================================================
create table if not exists public.materiais_compras (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users (id) on delete cascade,
  material_catalogo_id   uuid not null references public.materiais_catalogo (id) on delete cascade,
  nota_fiscal_id         uuid references public.notas_fiscais (id) on delete set null,
  servico_id             uuid references public.servicos (id) on delete set null,
  quantidade             numeric(12,3) not null default 1,
  valor_unitario         numeric(12,2) not null default 0,
  valor_total            numeric(12,2) not null default 0,
  data_compra            date not null default current_date,
  created_at             timestamptz not null default now()
);

create index if not exists idx_materiais_compras_user_id    on public.materiais_compras (user_id);
create index if not exists idx_materiais_compras_catalogo   on public.materiais_compras (material_catalogo_id, data_compra);
create index if not exists idx_materiais_compras_servico_id on public.materiais_compras (servico_id);

-- ===========================================================================
-- materiais (linha do serviço/orçamento) — ligação com o catálogo
-- ===========================================================================
alter table public.materiais
  add column if not exists codigo               text,
  add column if not exists sku                  text,
  add column if not exists material_catalogo_id uuid references public.materiais_catalogo (id) on delete set null;

-- ===========================================================================
-- funcionarios — equipe (ajudantes/terceiros) com diária
-- ===========================================================================
create table if not exists public.funcionarios (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  nome          text not null,
  valor_diaria  numeric(12,2) not null default 130,
  ativo         boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_funcionarios_user_id on public.funcionarios (user_id);

drop trigger if exists trg_funcionarios_updated_at on public.funcionarios;
create trigger trg_funcionarios_updated_at
  before update on public.funcionarios
  for each row execute function public.set_updated_at();

-- ===========================================================================
-- servico_funcionarios — equipe alocada em um serviço (custo interno)
-- ===========================================================================
create table if not exists public.servico_funcionarios (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users (id) on delete cascade,
  servico_id             uuid not null references public.servicos (id) on delete cascade,
  funcionario_id         uuid references public.funcionarios (id) on delete set null,
  nome_funcionario       text not null,   -- snapshot (sobrevive à exclusão do funcionário)
  quantidade_dias        numeric(6,2) not null default 1,
  quantidade_horas       numeric(8,2) not null default 0,
  valor_diaria_aplicado  numeric(12,2) not null default 0,
  custo                  numeric(12,2) not null default 0,
  created_at             timestamptz not null default now()
);

create index if not exists idx_servico_funcionarios_user_id    on public.servico_funcionarios (user_id);
create index if not exists idx_servico_funcionarios_servico_id on public.servico_funcionarios (servico_id);

-- ===========================================================================
-- configuracoes — diária padrão, orçamento semanal de combustível, referência
-- ===========================================================================
alter table public.configuracoes
  add column if not exists diaria_padrao            numeric(12,2) not null default 130,
  add column if not exists gasto_semanal_camionete   numeric(12,2) not null default 0,
  add column if not exists preco_referencia_material text          not null default 'maior';

do $$ begin
  alter table public.configuracoes
    add constraint configuracoes_preco_referencia_chk
    check (preco_referencia_material in ('ultimo', 'medio', 'maior', 'menor', 'personalizado'));
exception when duplicate_object then null; end $$;

-- ===========================================================================
-- servicos — deslocamento/combustível detalhado (custo interno)
-- ===========================================================================
alter table public.servicos
  add column if not exists km_inicial          numeric(10,1),
  add column if not exists km_final            numeric(10,1),
  add column if not exists combustivel_valor   numeric(12,2) not null default 0,
  add column if not exists pedagio             numeric(12,2) not null default 0,
  add column if not exists estacionamento_valor numeric(12,2) not null default 0;

-- ===========================================================================
-- RLS — mesmo padrão das tabelas existentes (dono = user_id)
-- ===========================================================================
alter table public.lojas                 enable row level security;
alter table public.materiais_catalogo    enable row level security;
alter table public.materiais_compras     enable row level security;
alter table public.funcionarios          enable row level security;
alter table public.servico_funcionarios  enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'lojas', 'materiais_catalogo', 'materiais_compras', 'funcionarios', 'servico_funcionarios'
  ]
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
