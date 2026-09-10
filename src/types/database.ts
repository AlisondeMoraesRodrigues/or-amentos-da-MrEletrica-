/**
 * Tipos do banco de dados MR ORÇAMENTOS (Checkpoint 03).
 *
 * Escrito à mão para espelhar `supabase/migrations/20260906120000_initial_schema.sql`.
 * Quando o Supabase estiver conectado, pode ser regenerado com:
 *   supabase gen types typescript --project-id <ref> > src/types/database.ts
 */

export type ServicoStatus = 'aberto' | 'em_andamento' | 'concluido' | 'cancelado'
export type OrcamentoStatus =
  | 'rascunho'
  | 'enviado'
  | 'aprovado'
  | 'reprovado'
  | 'cancelado'
export type DocumentoTipo =
  | 'orcamento'
  | 'ordem_servico'
  | 'relatorio_tecnico'
  | 'recibo'
export type MaterialUnidade = 'un' | 'm' | 'm2' | 'kg' | 'cx' | 'rl' | 'pc' | 'l' | 'h'
export type TipoHora = 'tecnica' | 'auxiliar' | 'emergencia' | 'noturna'

type Timestamps = {
  created_at: string
  updated_at: string
}

// --- profiles --------------------------------------------------------------
export interface ProfileRow extends Timestamps {
  id: string
  nome: string | null
  email: string | null
}
export type ProfileInsert = { id: string; nome?: string | null; email?: string | null }
export type ProfileUpdate = Partial<Omit<ProfileInsert, 'id'>>

// --- configuracoes --------------------------------------------------------
export interface ConfiguracaoRow extends Timestamps {
  user_id: string
  empresa_nome: string | null
  empresa_cnpj: string | null
  empresa_telefone: string | null
  empresa_email: string | null
  empresa_endereco: string | null
  logo_url: string | null
  valor_hora_tecnica: number
  valor_hora_auxiliar: number
  valor_hora_emergencia: number
  valor_hora_noturna: number
  margem_padrao_materiais: number
  taxa_deslocamento: number
  pix_beneficiario: string | null
  pix_chave: string | null
  pix_cidade: string | null
}
export type ConfiguracaoInsert = { user_id: string } & Partial<
  Omit<ConfiguracaoRow, 'user_id' | keyof Timestamps>
>
export type ConfiguracaoUpdate = Partial<Omit<ConfiguracaoInsert, 'user_id'>>

// --- clientes -------------------------------------------------------------
export interface ClienteRow extends Timestamps {
  id: string
  user_id: string
  nome: string
  cpf: string | null
  cnpj: string | null
  telefone: string | null
  whatsapp: string | null
  email: string | null
  endereco: string | null
  cidade: string | null
  condominio: string | null
  responsavel: string | null
  observacoes: string | null
}
export type ClienteInsert = {
  user_id: string
  nome: string
} & Partial<Omit<ClienteRow, 'id' | 'user_id' | 'nome' | keyof Timestamps>>
export type ClienteUpdate = Partial<Omit<ClienteInsert, 'user_id'>>

// --- servicos ------------------------------------------------------------
export interface ServicoRow extends Timestamps {
  id: string
  user_id: string
  cliente_id: string | null
  descricao: string
  descricao_livre: string | null
  horas_trabalhadas: number
  quantidade_tecnicos: number
  tipo_hora: TipoHora
  valor_hora_aplicado: number
  /** Equipe (CP24): grupo de ajudantes. 0 ajudante = comportamento anterior. */
  quantidade_ajudantes: number
  horas_ajudantes: number
  valor_hora_ajudante: number
  valor_mao_de_obra: number
  taxa_deslocamento: number
  outros_custos: number
  status: ServicoStatus
  data_servico: string | null
}
export type ServicoInsert = { user_id: string } & Partial<
  Omit<ServicoRow, 'id' | 'user_id' | keyof Timestamps>
>
export type ServicoUpdate = Partial<Omit<ServicoInsert, 'user_id'>>

// --- orcamentos --------------------------------------------------------
export interface OrcamentoRow extends Timestamps {
  id: string
  user_id: string
  cliente_id: string | null
  servico_id: string | null
  numero: string
  status: OrcamentoStatus
  valor_materiais: number
  valor_margem_materiais: number
  valor_mao_de_obra: number
  /** Detalhamento opcional da mão de obra (CP24). Se tudo 0, vale só valor_mao_de_obra. */
  mo_qtd_tecnicos: number
  mo_horas_tecnicos: number
  mo_valor_hora_tecnico: number
  mo_qtd_ajudantes: number
  mo_horas_ajudantes: number
  mo_valor_hora_ajudante: number
  valor_deslocamento: number
  outros_custos: number
  valor_total: number
  observacoes: string | null
  garantia: string | null
  forma_pagamento: string | null
  validade_data: string | null
}
export type OrcamentoInsert = {
  user_id: string
  numero: string
} & Partial<Omit<OrcamentoRow, 'id' | 'user_id' | 'numero' | keyof Timestamps>>
export type OrcamentoUpdate = Partial<Omit<OrcamentoInsert, 'user_id'>>

// --- materiais --------------------------------------------------------
export interface MaterialRow extends Timestamps {
  id: string
  user_id: string
  servico_id: string | null
  orcamento_id: string | null
  nome: string
  quantidade: number
  unidade: MaterialUnidade
  valor_custo: number
  margem_percentual: number
  valor_cobrado: number
}
export type MaterialInsert = {
  user_id: string
  nome: string
} & Partial<Omit<MaterialRow, 'id' | 'user_id' | 'nome' | keyof Timestamps>>
export type MaterialUpdate = Partial<Omit<MaterialInsert, 'user_id'>>

// --- documentos ------------------------------------------------------
export interface DocumentoRow {
  id: string
  user_id: string
  tipo: DocumentoTipo
  titulo: string
  cliente_id: string | null
  servico_id: string | null
  orcamento_id: string | null
  arquivo_url: string | null
  dados: Record<string, unknown> | null
  created_at: string
}
export type DocumentoInsert = {
  user_id: string
  tipo: DocumentoTipo
  titulo: string
} & Partial<Omit<DocumentoRow, 'id' | 'user_id' | 'tipo' | 'titulo' | 'created_at'>>
export type DocumentoUpdate = Partial<Omit<DocumentoInsert, 'user_id'>>

// --- notas_fiscais --------------------------------------------------
export interface NotaFiscalRow {
  id: string
  user_id: string
  servico_id: string | null
  orcamento_id: string | null
  arquivo_path: string
  nome_arquivo: string
  tipo_arquivo: string | null
  tamanho_bytes: number | null
  texto_ocr: string | null
  processado_em: string | null
  created_at: string
}
export type NotaFiscalInsert = {
  user_id: string
  arquivo_path: string
  nome_arquivo: string
} & Partial<
  Omit<NotaFiscalRow, 'id' | 'user_id' | 'arquivo_path' | 'nome_arquivo' | 'created_at'>
>
export type NotaFiscalUpdate = Partial<Omit<NotaFiscalInsert, 'user_id'>>

// --- fotos_servico -------------------------------------------------
export type FotoCategoria = 'antes' | 'durante' | 'depois'

export interface FotoServicoRow {
  id: string
  user_id: string
  servico_id: string
  categoria: FotoCategoria
  arquivo_path: string
  nome_arquivo: string
  tipo_arquivo: string | null
  tamanho_bytes: number | null
  legenda: string | null
  created_at: string
}
export type FotoServicoInsert = {
  user_id: string
  servico_id: string
  arquivo_path: string
  nome_arquivo: string
} & Partial<
  Omit<
    FotoServicoRow,
    'id' | 'user_id' | 'servico_id' | 'arquivo_path' | 'nome_arquivo' | 'created_at'
  >
>
export type FotoServicoUpdate = Partial<Omit<FotoServicoInsert, 'user_id' | 'servico_id'>>

// --- Database (formato do supabase-js) ---------------------------------
type TableShape<Row, Insert, Update> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      profiles: TableShape<ProfileRow, ProfileInsert, ProfileUpdate>
      configuracoes: TableShape<ConfiguracaoRow, ConfiguracaoInsert, ConfiguracaoUpdate>
      clientes: TableShape<ClienteRow, ClienteInsert, ClienteUpdate>
      servicos: TableShape<ServicoRow, ServicoInsert, ServicoUpdate>
      orcamentos: TableShape<OrcamentoRow, OrcamentoInsert, OrcamentoUpdate>
      materiais: TableShape<MaterialRow, MaterialInsert, MaterialUpdate>
      documentos: TableShape<DocumentoRow, DocumentoInsert, DocumentoUpdate>
      notas_fiscais: TableShape<NotaFiscalRow, NotaFiscalInsert, NotaFiscalUpdate>
      fotos_servico: TableShape<FotoServicoRow, FotoServicoInsert, FotoServicoUpdate>
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: {
      servico_status: ServicoStatus
      orcamento_status: OrcamentoStatus
      documento_tipo: DocumentoTipo
      material_unidade: MaterialUnidade
      tipo_hora: TipoHora
      foto_categoria: FotoCategoria
    }
    CompositeTypes: Record<never, never>
  }
}
