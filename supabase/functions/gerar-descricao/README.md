# Edge Function — `gerar-descricao`

Gera a descrição profissional do serviço com IA de verdade (Google Gemini,
faixa **gratuita**). A chave da IA fica só no servidor.

Enquanto esta função **não** estiver publicada, o app continua funcionando: ele
usa o gerador local por regras (arruma o texto que o técnico digitou).

## Publicar (uma vez, ~5 min)

### 1. Pegar a chave gratuita do Gemini
- Acesse <https://aistudio.google.com/apikey> (login com conta Google)
- **Create API key** → copie a chave (começa com `AIza...`)
- Faixa gratuita: suficiente para uso normal de um eletricista.

### 2. Publicar a função
**Opção A — painel (sem instalar nada):**
- Supabase → **Edge Functions** → **Deploy a new function**
- Nome: `gerar-descricao`
- Cole o conteúdo de [`index.ts`](./index.ts) no editor → **Deploy**

**Opção B — CLI:**
```bash
supabase functions deploy gerar-descricao --project-ref fuwsmbzrhxyolhvznglp
```

### 3. Configurar o secret da chave
- Supabase → **Edge Functions** → **Secrets** (ou **Manage secrets**)
- Adicione:
  - `GEMINI_API_KEY` = a chave do passo 1
  - *(opcional)* `GEMINI_MODEL` = `gemini-1.5-flash` (padrão)

Pronto. No app: abra um serviço, escreva as anotações e toque em
**"✨ Gerar descrição profissional"**.

## Como o app chama

`src/services/aiSetup.ts` registra o provedor `edge`, que faz
`supabase.functions.invoke('gerar-descricao', { body: contexto })`.
Se a função falhar ou responder vazio, o provedor cai no gerador local
automaticamente — a tela nunca quebra.

## Trocar de IA

Basta editar `gerarComGemini` em `index.ts` (ou adicionar outra função) para
falar com OpenAI, Anthropic, etc. O contrato de resposta é só
`{ descricao: string }`.
