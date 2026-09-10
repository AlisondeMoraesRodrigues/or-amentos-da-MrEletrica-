import type { ConfiguracaoRow } from '@/types/database'
import type { EmpresaPdf } from './pdfDoc'

export function empresaDaConfig(config: ConfiguracaoRow): EmpresaPdf {
  return {
    nome: config.empresa_nome || 'MR Elétrica',
    cnpj: config.empresa_cnpj,
    telefone: config.empresa_telefone,
    email: config.empresa_email,
    endereco: config.empresa_endereco,
    logoUrl: config.logo_url,
  }
}
