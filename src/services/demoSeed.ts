import type {
  ClienteRow,
  ConfiguracaoRow,
  DocumentoRow,
  MaterialRow,
  OrcamentoRow,
  ServicoRow,
} from '@/types/database'

/**
 * Dados iniciais do MODO DEMONSTRAÇÃO, já no formato das linhas do banco.
 * São gravados no `localStorage` na primeira leitura e podem ser editados
 * normalmente pelas telas (a partir do Checkpoint 04).
 */

const USER = 'demo-user'
const T = '2026-09-01T12:00:00.000Z'

const cliente1 = '11111111-1111-4111-8111-111111111111'
const cliente2 = '22222222-2222-4222-8222-222222222222'
const servico1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const orcamento1 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

export const demoClientes: ClienteRow[] = [
  {
    id: cliente1,
    user_id: USER,
    nome: 'Condomínio Solar das Flores',
    cpf: null,
    cnpj: '12.345.678/0001-90',
    telefone: '(11) 4002-8922',
    whatsapp: '(11) 99999-0001',
    email: 'sindico@solardasflores.com.br',
    endereco: 'Rua das Acácias, 100',
    cidade: 'São Paulo',
    condominio: 'Solar das Flores',
    responsavel: 'Sr. Antônio (síndico)',
    observacoes: 'Portaria libera acesso técnico das 8h às 18h.',
    created_at: T,
    updated_at: T,
  },
  {
    id: cliente2,
    user_id: USER,
    nome: 'Maria Aparecida Souza',
    cpf: '123.456.789-00',
    cnpj: null,
    telefone: '(11) 3555-1020',
    whatsapp: '(11) 98888-0002',
    email: 'maria.souza@email.com',
    endereco: 'Av. Brasil, 4567 - Apto 52',
    cidade: 'São Paulo',
    condominio: null,
    responsavel: 'Maria Souza',
    observacoes: null,
    created_at: T,
    updated_at: T,
  },
]

export const demoServicos: ServicoRow[] = [
  {
    id: servico1,
    user_id: USER,
    cliente_id: cliente2,
    descricao: 'Troca de 3 disjuntores e revisão do quadro de distribuição.',
    descricao_livre: 'troquei 3 disjuntores e revisei o quadro, 4 horas de trabalho',
    horas_trabalhadas: 4,
    quantidade_tecnicos: 1,
    tipo_hora: 'tecnica',
    valor_hora_aplicado: 120,
    quantidade_ajudantes: 1,
    horas_ajudantes: 4,
    valor_hora_ajudante: 70,
    forma_cobranca: 'hora',
    custo_mao_de_obra: 280,
    valor_mao_de_obra: 760,
    taxa_deslocamento: 0,
    outros_custos: 0,
    status: 'concluido',
    data_servico: '2026-09-02',
    created_at: T,
    updated_at: T,
  },
]

export const demoMateriais: MaterialRow[] = [
  {
    id: '33333333-3333-4333-8333-333333333333',
    user_id: USER,
    servico_id: servico1,
    orcamento_id: null,
    nome: 'Disjuntor bipolar 40A',
    quantidade: 3,
    unidade: 'un',
    valor_custo: 45,
    margem_percentual: 20,
    valor_cobrado: 54,
    foto_path: null,
    foto_nome: null,
    foto_tipo: null,
    created_at: T,
    updated_at: T,
  },
]

export const demoOrcamentos: OrcamentoRow[] = [
  {
    id: orcamento1,
    user_id: USER,
    cliente_id: cliente2,
    servico_id: servico1,
    numero: 'ORC-2026-015',
    status: 'aprovado',
    valor_materiais: 135,
    valor_margem_materiais: 27,
    valor_mao_de_obra: 760,
    mo_qtd_tecnicos: 1,
    mo_horas_tecnicos: 4,
    mo_valor_hora_tecnico: 120,
    mo_qtd_ajudantes: 1,
    mo_horas_ajudantes: 4,
    mo_valor_hora_ajudante: 70,
    mo_forma_cobranca: 'hora',
    valor_deslocamento: 0,
    outros_custos: 0,
    valor_total: 922,
    observacoes: null,
    garantia: '90 dias para serviços e materiais aplicados.',
    forma_pagamento: 'PIX ou cartão em até 3x.',
    validade_data: '2026-09-17',
    created_at: T,
    updated_at: T,
  },
]

export const demoDocumentos: DocumentoRow[] = [
  {
    id: '44444444-4444-4444-8444-444444444444',
    user_id: USER,
    tipo: 'orcamento',
    titulo: 'ORC-2026-015',
    cliente_id: cliente2,
    servico_id: servico1,
    orcamento_id: orcamento1,
    arquivo_url: null,
    dados: null,
    created_at: T,
  },
]

export const demoConfiguracao: ConfiguracaoRow = {
  user_id: USER,
  empresa_nome: 'MR Elétrica',
  empresa_cnpj: null,
  empresa_telefone: null,
  empresa_email: null,
  empresa_endereco: null,
  logo_url: null,
  valor_hora_tecnica: 120,
  valor_hora_auxiliar: 70,
  valor_hora_emergencia: 200,
  valor_hora_noturna: 160,
  margem_padrao_materiais: 20,
  taxa_deslocamento: 0,
  pix_beneficiario: null,
  pix_chave: null,
  pix_cidade: null,
  created_at: T,
  updated_at: T,
}
