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
