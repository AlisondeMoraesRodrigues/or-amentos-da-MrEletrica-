# Edge Function — `ler-nota`

Lê a **foto (ou PDF)** de uma nota/cupom de material e devolve os dados já
estruturados (loja, documento, data, itens, totais) — sem precisar digitar o
texto. Genérica: não é feita pra uma loja específica, o próprio Gemini
identifica os campos pela estrutura do documento.

Enquanto esta função **não** estiver publicada (ou sem a chave), o app cai
sozinho no fluxo manual (digitar/colar o texto da nota) — nada quebra.

## Publicar (uma vez, ~3 min — reaproveita a chave da `gerar-descricao`)

Se você já publicou a função `gerar-descricao` (Checkpoint 24), **já tem a
chave `GEMINI_API_KEY` configurada** — é a mesma chave, só falta publicar
esta função:

1. Supabase → **Edge Functions** → **Deploy a new function**
2. Nome: `ler-nota`
3. Cole o conteúdo de [`index.ts`](./index.ts) no editor → **Deploy**

Se ainda não tem a chave: veja `supabase/functions/gerar-descricao/README.md`
(pegar a chave gratuita em https://aistudio.google.com/apikey e configurar o
secret `GEMINI_API_KEY`).

## Como o app usa

`src/services/ocrSetup.ts` registra um provedor de OCR que chama
`supabase.functions.invoke('ler-nota', { body: { imagemBase64, mimeType } })`.
Em `NotaMaterialCapture`, depois de confirmar a foto, o app tenta ler
automaticamente; se conseguir, já mostra os itens pra conferência — o técnico
não precisa digitar nada. Se a função não estiver publicada ou falhar, o
fluxo manual (digitar/colar o texto) aparece normalmente.

## Limitações conhecidas

- Se a foto tiver **mais de uma nota junto**, o modelo lê só a primeira e
  ignora as demais (não separa automaticamente em vários registros ainda).
- Sempre confira os dados antes de salvar — o Gemini pode errar,
  principalmente em fotos tortas, escuras ou com letra pequena.
- PDF de várias páginas: só a primeira página é considerada.
