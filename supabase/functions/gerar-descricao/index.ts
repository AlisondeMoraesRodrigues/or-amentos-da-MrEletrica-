// ===========================================================================
// Edge Function: gerar-descricao
// ---------------------------------------------------------------------------
// Recebe o contexto do serviço (o que o técnico escreveu + materiais + equipe)
// e devolve uma descrição profissional escrita por IA.
//
// Provedor padrão: Google Gemini (modelo gemini-1.5-flash, faixa gratuita).
// A chave fica no secret GEMINI_API_KEY — NUNCA vai para o front.
//
// Publicar (uma vez):
//   1. Supabase → Edge Functions → Deploy a new function → nome: gerar-descricao
//      (ou cole este arquivo no editor do painel e clique em Deploy)
//   2. Supabase → Edge Functions → Secrets → adicione:
//        GEMINI_API_KEY = (chave gratuita de https://aistudio.google.com/apikey)
//   3. Pronto. Se a chave faltar, a função responde 200 com descricao vazia e
//      o app usa o gerador local automaticamente.
// ===========================================================================

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

interface MaterialContexto {
  nome: string
  quantidade: number
  unidade: string
}

interface ContextoDescricao {
  textoLivre?: string
  materiais?: MaterialContexto[]
  quantidadeTecnicos?: number
  horasTrabalhadas?: number
  quantidadeAjudantes?: number
  horasAjudantes?: number
  clienteNome?: string | null
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

function montarPrompt(ctx: ContextoDescricao): string {
  const linhas: string[] = []
  linhas.push(
    'Você é um eletricista profissional escrevendo a descrição de um serviço para ' +
      'constar em orçamento e relatório técnico entregues ao cliente.',
  )
  linhas.push(
    'Escreva de 2 a 4 frases, em português do Brasil, tom profissional e objetivo, ' +
      'na terceira pessoa (ex.: "Foi realizada a troca..."). Não invente valores, ' +
      'preços, prazos nem itens que não foram informados. Não use marcadores nem títulos.',
  )
  if (ctx.textoLivre?.trim()) {
    linhas.push(`\nAnotações do técnico: "${ctx.textoLivre.trim()}"`)
  }
  if (ctx.materiais?.length) {
    const lista = ctx.materiais
      .map((m) => `${m.quantidade} ${m.unidade} de ${m.nome}`)
      .join('; ')
    linhas.push(`Materiais aplicados: ${lista}.`)
  }
  if (ctx.quantidadeTecnicos && ctx.horasTrabalhadas) {
    let equipe = `${ctx.quantidadeTecnicos} técnico(s) por ${ctx.horasTrabalhadas} h`
    if (ctx.quantidadeAjudantes && ctx.horasAjudantes) {
      equipe += ` e ${ctx.quantidadeAjudantes} ajudante(s) por ${ctx.horasAjudantes} h`
    }
    linhas.push(`Equipe: ${equipe}.`)
  }
  linhas.push('\nDescrição:')
  return linhas.join('\n')
}

async function gerarComGemini(ctx: ContextoDescricao, apiKey: string): Promise<string> {
  const modelo = Deno.env.get('GEMINI_MODEL') ?? 'gemini-1.5-flash'
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: montarPrompt(ctx) }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 400 },
    }),
  })

  if (!resp.ok) {
    const detalhe = await resp.text()
    throw new Error(`Gemini ${resp.status}: ${detalhe.slice(0, 300)}`)
  }

  const dados = await resp.json()
  const texto: string =
    dados?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
  return texto.trim()
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405)

  let ctx: ContextoDescricao
  try {
    ctx = await req.json()
  } catch {
    return json({ error: 'Corpo inválido.' }, 400)
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) {
    // Sem chave: o app cai no gerador local.
    return json({ descricao: '', provedor: 'nenhum' })
  }

  try {
    const descricao = await gerarComGemini(ctx, apiKey)
    return json({ descricao, provedor: 'gemini' })
  } catch (err) {
    console.error('gerar-descricao:', err)
    return json({ descricao: '', provedor: 'erro', detalhe: String(err) })
  }
})
