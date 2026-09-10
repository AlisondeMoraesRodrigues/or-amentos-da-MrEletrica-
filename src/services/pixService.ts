import type { ConfiguracaoRow } from '@/types/database'
import type { PixPdf } from './pdf/orcamentoPdf'

/**
 * PIX (Checkpoint 15) — "copia e cola" (EMV® MPM BR Code) + QR Code.
 * Tudo local, sem serviço pago. QR gerado com `qrcode-generator` (open source).
 */

function tlv(id: string, valor: string): string {
  return `${id}${String(valor.length).padStart(2, '0')}${valor}`
}

function crc16(payload: string): string {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

function sanitizar(texto: string, max: number): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim()
    .toUpperCase()
    .slice(0, max)
}

export interface DadosPix {
  chave: string
  beneficiario: string
  cidade: string
  valor?: number
  descricao?: string
}

export function pixConfigurado(c: ConfiguracaoRow): boolean {
  return Boolean(c.pix_chave && c.pix_beneficiario && c.pix_cidade)
}

export function gerarPixCopiaECola(d: DadosPix): string {
  const contaMerchant =
    tlv('00', 'br.gov.bcb.pix') +
    tlv('01', d.chave.trim()) +
    (d.descricao ? tlv('02', sanitizar(d.descricao, 25)) : '')

  let payload =
    tlv('00', '01') +
    tlv('26', contaMerchant) +
    tlv('52', '0000') +
    tlv('53', '986') +
    (d.valor && d.valor > 0 ? tlv('54', d.valor.toFixed(2)) : '') +
    tlv('58', 'BR') +
    tlv('59', sanitizar(d.beneficiario || 'BENEFICIARIO', 25)) +
    tlv('60', sanitizar(d.cidade || 'CIDADE', 15)) +
    tlv('62', tlv('05', '***'))

  payload += '6304'
  return payload + crc16(payload)
}

export async function gerarPixQrDataUrl(texto: string): Promise<string | null> {
  try {
    const qrcode = (await import('qrcode-generator')).default
    const qr = qrcode(0, 'M')
    qr.addData(texto)
    qr.make()
    const count = qr.getModuleCount()
    const cell = 6
    const borda = 4
    const size = (count + borda * 2) * cell
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = '#000000'
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.isDark(r, c)) {
          ctx.fillRect((c + borda) * cell, (r + borda) * cell, cell, cell)
        }
      }
    }
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

export async function montarPixOrcamento(
  config: ConfiguracaoRow,
  valor: number,
  descricao: string,
): Promise<PixPdf | null> {
  if (!pixConfigurado(config)) return null
  const copiaECola = gerarPixCopiaECola({
    chave: config.pix_chave ?? '',
    beneficiario: config.pix_beneficiario ?? '',
    cidade: config.pix_cidade ?? '',
    valor,
    descricao,
  })
  return { copiaECola, qrDataUrl: await gerarPixQrDataUrl(copiaECola) }
}
