import type { jsPDF } from 'jspdf'
import { urlParaDataUrl } from '@/utils/imagem'

/**
 * Construtor de PDF (jsPDF carregado sob demanda). Base dos documentos:
 * orçamento (CP14), ordem de serviço (CP16), relatório técnico (CP17),
 * recibo (CP18). Biblioteca open source, sem serviço pago.
 */

export interface EmpresaPdf {
  nome: string
  cnpj?: string | null
  telefone?: string | null
  email?: string | null
  endereco?: string | null
  logoUrl?: string | null
}

export interface Coluna {
  titulo: string
  largura: number
  alinhar?: 'left' | 'right'
}

export class PdfDoc {
  private doc: jsPDF
  private y = 18
  private readonly margin = 15
  private readonly width: number
  private readonly height: number

  private constructor(doc: jsPDF) {
    this.doc = doc
    this.width = doc.internal.pageSize.getWidth()
    this.height = doc.internal.pageSize.getHeight()
  }

  static async criar(): Promise<PdfDoc> {
    const { jsPDF } = await import('jspdf')
    return new PdfDoc(new jsPDF({ unit: 'mm', format: 'a4' }))
  }

  private quebra(altura: number) {
    if (this.y + altura > this.height - 18) {
      this.doc.addPage()
      this.y = 18
    }
  }

  async cabecalho(titulo: string, empresa: EmpresaPdf) {
    const logo = empresa.logoUrl ? await urlParaDataUrl(empresa.logoUrl) : null
    let x = this.margin
    if (logo) {
      try {
        this.doc.addImage(logo, 'PNG', this.margin, this.y - 4, 20, 20)
        x = this.margin + 25
      } catch {
        /* logo inválida — ignora */
      }
    }
    this.doc.setFont('helvetica', 'bold').setFontSize(14).setTextColor(15, 23, 42)
    this.doc.text(empresa.nome || 'MR Elétrica', x, this.y + 2)
    this.doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(110)
    const linhas = [
      empresa.cnpj ? `CNPJ: ${empresa.cnpj}` : '',
      [empresa.telefone, empresa.email].filter(Boolean).join('   |   '),
      empresa.endereco ?? '',
    ].filter(Boolean)
    let ly = this.y + 7
    for (const l of linhas) {
      this.doc.text(l, x, ly)
      ly += 4
    }
    this.y = Math.max(ly, this.y + 20) + 3

    this.doc.setDrawColor(37, 99, 235).setLineWidth(0.6)
    this.doc.line(this.margin, this.y, this.width - this.margin, this.y)
    this.y += 8

    this.doc.setFont('helvetica', 'bold').setFontSize(16).setTextColor(15, 23, 42)
    this.doc.text(titulo, this.margin, this.y)
    this.y += 9
  }

  secao(titulo: string) {
    this.quebra(12)
    this.doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(37, 99, 235)
    this.doc.text(titulo, this.margin, this.y)
    this.y += 6
  }

  linhas(pares: [string, string][]) {
    this.doc.setFontSize(10).setTextColor(30)
    for (const [k, v] of pares) {
      this.quebra(6)
      this.doc.setFont('helvetica', 'bold').text(`${k}:`, this.margin, this.y)
      this.doc.setFont('helvetica', 'normal')
      const wrap = this.doc.splitTextToSize(v || '-', this.width - this.margin * 2 - 42) as string[]
      this.doc.text(wrap, this.margin + 42, this.y)
      this.y += Math.max(6, wrap.length * 5)
    }
    this.y += 1
  }

  paragrafo(texto: string) {
    this.doc.setFont('helvetica', 'normal').setFontSize(10).setTextColor(30)
    const wrap = this.doc.splitTextToSize(texto || '-', this.width - this.margin * 2) as string[]
    this.quebra(wrap.length * 5 + 3)
    this.doc.text(wrap, this.margin, this.y)
    this.y += wrap.length * 5 + 3
  }

  tabela(colunas: Coluna[], linhas: string[][]) {
    const startX = this.margin
    const larguraTotal = this.width - this.margin * 2
    this.quebra(12)
    this.doc.setFillColor(241, 245, 249).rect(startX, this.y - 4, larguraTotal, 7, 'F')
    this.doc.setFont('helvetica', 'bold').setFontSize(9).setTextColor(51)
    let cx = startX + 1
    for (const c of colunas) {
      const px = c.alinhar === 'right' ? cx + c.largura - 2 : cx
      this.doc.text(c.titulo, px, this.y, { align: c.alinhar === 'right' ? 'right' : 'left' })
      cx += c.largura
    }
    this.y += 6
    this.doc.setFont('helvetica', 'normal').setTextColor(30)
    for (const row of linhas) {
      this.quebra(8)
      cx = startX + 1
      row.forEach((cell, i) => {
        const c = colunas[i]
        const txt = this.doc.splitTextToSize(cell, c.largura - 2) as string[]
        const px = c.alinhar === 'right' ? cx + c.largura - 2 : cx
        this.doc.text(txt, px, this.y, { align: c.alinhar === 'right' ? 'right' : 'left' })
        cx += c.largura
      })
      this.y += 6
      this.doc.setDrawColor(226, 232, 240).setLineWidth(0.1)
      this.doc.line(startX, this.y - 2, this.width - this.margin, this.y - 2)
    }
    this.y += 3
  }

  total(rotulo: string, valor: string) {
    this.quebra(12)
    const x0 = this.width - this.margin - 75
    this.doc.setDrawColor(37, 99, 235).setLineWidth(0.4).line(x0, this.y - 1, this.width - this.margin, this.y - 1)
    this.doc.setFont('helvetica', 'bold').setFontSize(12).setTextColor(15, 23, 42)
    this.doc.text(rotulo, x0, this.y + 5)
    this.doc.text(valor, this.width - this.margin, this.y + 5, { align: 'right' })
    this.y += 13
  }

  espaco(mm = 4) {
    this.y += mm
  }

  grade(imagens: string[]) {
    if (imagens.length === 0) return
    const larguraCol = (this.width - this.margin * 2 - 6) / 2
    const alturaImg = larguraCol * 0.72
    for (let i = 0; i < imagens.length; i += 2) {
      this.quebra(alturaImg + 4)
      for (let j = 0; j < 2 && i + j < imagens.length; j++) {
        const x = this.margin + j * (larguraCol + 6)
        try {
          this.doc.addImage(imagens[i + j], 'JPEG', x, this.y, larguraCol, alturaImg, undefined, 'FAST')
        } catch {
          /* imagem inválida — ignora */
        }
      }
      this.y += alturaImg + 4
    }
  }

  qr(dataUrl: string, ladoMm = 40) {
    this.quebra(ladoMm + 4)
    try {
      this.doc.addImage(dataUrl, 'PNG', this.margin, this.y, ladoMm, ladoMm)
    } catch {
      /* ignora */
    }
    this.y += ladoMm + 4
  }

  rodape(texto: string) {
    const paginas = this.doc.getNumberOfPages()
    for (let p = 1; p <= paginas; p++) {
      this.doc.setPage(p)
      this.doc.setFont('helvetica', 'normal').setFontSize(8).setTextColor(150)
      this.doc.text(texto, this.margin, this.height - 8)
      this.doc.text(`${p}/${paginas}`, this.width - this.margin, this.height - 8, { align: 'right' })
    }
  }

  blob(): Blob {
    return this.doc.output('blob')
  }

  salvar(nome: string) {
    this.doc.save(nome)
  }
}
