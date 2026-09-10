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
