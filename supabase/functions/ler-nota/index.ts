// ===========================================================================
// Edge Function: ler-nota
// ---------------------------------------------------------------------------
// Recebe a FOTO (ou PDF) de uma nota/cupom de materiais e devolve os dados
// já estruturados: loja, documento, data, itens (nome/código/quantidade/
// unidade/valor) e totais — para o app só mostrar a conferência, sem o
// técnico precisar digitar o texto.
//
// Provedor padrão: Google Gemini (modelo com visão, faixa gratuita) — o
// mesmo padrão já usado em `gerar-descricao` (CP24). A chave fica só no
// secret GEMINI_API_KEY, nunca no front.
//
// Publicar (uma vez):
//   1. Supabase → Edge Functions → Deploy a new function → nome: ler-nota
//      (ou cole este arquivo no editor do painel e clique em Deploy)
//   2. Supabase → Edge Functions → Secrets → GEMINI_API_KEY já configurada
//      pra `gerar-descricao` serve pra esta também (mesma chave).
//   3. Pronto. Sem a chave, a função responde `ok: false` e o app cai no
//      fluxo manual (digitar/colar o texto da nota).
// ===========================================================================

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

interface RequisicaoLerNota {
  imagemBase64: string
  mimeType: string
}

interface ItemNota {
  nome: string
  codigo: string | null
  marca: string | null
  quantidade: number
  unidade: string
  valorUnitario: number
  valorTotal: number
  conferido: boolean
}

interface NotaEstruturada {
  loja: string | null
  cnpjLoja: string | null
  documento: string | null
  data: string | null
  vendedor: string | null
  cliente: string | null
  itens: ItemNota[]
  totalProdutos: number | null
  desconto: number | null
  total: number | null
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

const PROMPT = `Você lê fotos e PDFs de notas fiscais e cupons de lojas de material de
construção/elétrica (qualquer fornecedor — ferragem, casa de material elétrico,
distribuidora, etc). A imagem pode conter MAIS DE UM documento junto: quando isso
acontecer, leia só o PRIMEIRO documento completo que aparecer (da esquerda pra
direita, de cima pra baixo) e ignore os outros.

Devolva APENAS um JSON válido, sem markdown, no formato:
{
  "loja": string ou null,
  "cnpjLoja": string ou null,
  "documento": string ou null (número do documento/nota/cupom),
  "data": string ou null (formato AAAA-MM-DD),
  "vendedor": string ou null,
  "cliente": string ou null (nome do cliente na nota, se houver),
  "itens": [
    {
      "nome": string,
      "codigo": string ou null,
      "marca": string ou null,
      "quantidade": number,
      "unidade": string (ex.: "un", "m", "kg", "cx"),
      "valorUnitario": number,
      "valorTotal": number
    }
  ],
  "totalProdutos": number ou null,
  "desconto": number ou null,
  "total": number ou null
}

Regras importantes:
- NUNCA invente um valor que não conseguir ler com segurança — use null nesse campo.
- Números são sempre com ponto decimal (ex.: 45.90), nunca vírgula.
- Se não conseguir identificar nenhum item, devolva "itens": [].
- Não inclua nenhum texto fora do JSON.`

async function lerComGemini(req: RequisicaoLerNota, apiKey: string): Promise<NotaEstruturada> {
  const modelo = Deno.env.get('GEMINI_MODEL_VISAO') ?? 'gemini-1.5-flash'
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: PROMPT },
            { inlineData: { mimeType: req.mimeType, data: req.imagemBase64 } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!resp.ok) {
    const detalhe = await resp.text()
    throw new Error(`Gemini ${resp.status}: ${detalhe.slice(0, 300)}`)
  }

  const dados = await resp.json()
  const texto: string =
    dados?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ??
    ''

  let bruto: Record<string, unknown>
  try {
    bruto = JSON.parse(texto)
  } catch {
    throw new Error('Resposta da IA não veio em JSON válido.')
  }

  const itensBrutos = Array.isArray(bruto.itens) ? bruto.itens : []
  const itens: ItemNota[] = itensBrutos
    .map((i): ItemNota | null => {
      const item = i as Record<string, unknown>
      const nome = typeof item.nome === 'string' ? item.nome.trim() : ''
      if (!nome) return null
      const quantidade = Number(item.quantidade) || 0
      const valorUnitario = Number(item.valorUnitario) || 0
      const valorTotal = Number(item.valorTotal) || Math.round(quantidade * valorUnitario * 100) / 100
      const conferido = Math.abs(quantidade * valorUnitario - valorTotal) < 0.05
      return {
        nome,
        codigo: typeof item.codigo === 'string' ? item.codigo.trim() || null : null,
        marca: typeof item.marca === 'string' ? item.marca.trim() || null : null,
        quantidade,
        unidade: typeof item.unidade === 'string' ? item.unidade.trim() || 'un' : 'un',
        valorUnitario,
        valorTotal,
        conferido,
      }
    })
    .filter((i): i is ItemNota => i !== null)

  return {
    loja: typeof bruto.loja === 'string' ? bruto.loja.trim() || null : null,
    cnpjLoja: typeof bruto.cnpjLoja === 'string' ? bruto.cnpjLoja.trim() || null : null,
    documento: typeof bruto.documento === 'string' ? bruto.documento.trim() || null : null,
    data: typeof bruto.data === 'string' ? bruto.data.trim() || null : null,
    vendedor: typeof bruto.vendedor === 'string' ? bruto.vendedor.trim() || null : null,
    cliente: typeof bruto.cliente === 'string' ? bruto.cliente.trim() || null : null,
    itens,
    totalProdutos: typeof bruto.totalProdutos === 'number' ? bruto.totalProdutos : null,
    desconto: typeof bruto.desconto === 'number' ? bruto.desconto : null,
    total: typeof bruto.total === 'number' ? bruto.total : null,
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)

  let corpo: RequisicaoLerNota
  try {
    corpo = await req.json()
  } catch {
    return json({ ok: false, motivo: 'corpo_invalido' }, 400)
  }

  if (!corpo.imagemBase64 || !corpo.mimeType) {
    return json({ ok: false, motivo: 'arquivo_ausente' }, 400)
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) {
    return json({ ok: false, motivo: 'sem_chave' })
  }

  try {
    const dados = await lerComGemini(corpo, apiKey)
    return json({ ok: true, dados })
  } catch (err) {
    console.error('ler-nota:', err)
    return json({ ok: false, motivo: 'erro', detalhe: String(err) })
  }
})
