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
