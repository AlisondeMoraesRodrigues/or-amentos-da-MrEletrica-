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
