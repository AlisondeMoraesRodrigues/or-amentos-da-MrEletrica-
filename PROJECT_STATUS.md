# STATUS DO PROJETO — MR ORÇAMENTOS

Empresa: **MR ELÉTRICA**
Última atualização: **2026-09-08**

## CHECKPOINT ATUAL

**Checkpoint 23 — Finalização e testes** · 🟢 **PROJETO v1.0.0 CONCLUÍDO**

Todos os 23 checkpoints foram implementados. Build de produção e lint sem erros
(527 módulos); PWA gerada; testado no modo demonstração (celular e computador).

**Falta apenas** conectar o Supabase real: aplicar as 3 migrations de
`supabase/migrations/` e preencher o `.env`. Todo o caminho de produção (Auth,
banco, Storage) já está implementado — foi validado com dados de demonstração
(`localStorage`).

### Checkpoints 14–23 (concluídos)

- **CP14** — PDF do orçamento (jspdf, sob demanda) + Configurações funcionais.
- **CP15** — PIX: copia e cola (BR Code) + QR Code; card no orçamento; no PDF.
- **CP16/17/18** — PDF de ordem de serviço, relatório técnico (com fotos) e recibo.
- **CP19** — Financeiro (`/financeiro`): materiais, margem, mão de obra, faturamento.
- **CP20** — Dashboard real (dados de serviços/orçamentos/financeiro).
- **CP21** — Histórico completo do cliente (serviços, orçamentos, documentos, totais).
- **CP22** — Compartilhamento (download, Web Share, WhatsApp).
- **CP23** — Build/lint limpos, code-splitting, limpeza de código, PWA, testes.

### Checkpoint 13 (concluído)

🟢 Sistema completo de orçamento: composição do valor
(materiais + margem + mão de obra + deslocamento + outros = total), geração a
partir do serviço, numeração automática, status, condições.

### Checkpoint 12 (concluído)

🟢 Descrição inteligente do serviço: `AIService` modular (provedor `regras`,
sem fornecedor pago); "✨ Gerar descrição" no detalhe e no formulário do serviço.

### Checkpoint 11 (concluído)

🟢 Fotos do serviço (antes/durante/depois): migration `fotos_servico` + bucket
`fotos-servicos`; `storageService` genérico; `fotosServicoService` + componente
`FotosServico` (upload com câmera no celular, galeria, excluir).

### Checkpoint 10 (concluído)

🟢 OCR / leitura de notas: `OCRService` modular (provedor "manual" padrão, sem
fornecedor pago) + `interpretarTextoNota`; tela `/servicos/:id/notas/:notaId/ler`
(texto → itens editáveis → margem por lote → materiais no serviço).

### Checkpoint 09 (concluído)

🟢 Upload de notas fiscais: migration `notas_fiscais` + bucket de Storage;
`storageService` modular (Supabase Storage / localStorage no demo);
`notasFiscaisService` + componente `NotasFiscais` no detalhe do serviço
(enviar foto/imagem/PDF, miniatura, abrir, excluir).

### Checkpoint 08 (concluído)

🟢 Margem automática sobre materiais: `src/utils/margem.ts`; chips 0/10/20/30/40/
personalizada; valor cobrado = custo × (1 + margem%); sobrescrita manual com
margem implícita; "aplicar margem a todos" no serviço; margem padrão da configuração.

### Checkpoint 07 (concluído)

🟢 Materiais manuais dentro do serviço: adicionar/editar/excluir (nome, quantidade,
unidade, custo, cobrado). Tela `/materiais` com lista geral + totais.
`materiaisService.getMaterial()`, `src/config/material.ts`.

### Checkpoint 06 (concluído)

🟢 Cálculo de mão de obra: módulo `src/utils/maoDeObra.ts`
(`calcularMaoDeObra` / `recalcularMaoDeObraDoServico`). Fórmula
`técnicos × horas × valor/hora`; valor/hora automático por tipo de hora a partir
das configurações (sobrescrita manual opcional). Formulário de serviço persiste o
valor/hora efetivo.

### Checkpoint 05 (concluído)

🟢 Criação de serviços: `/servicos` (lista + filtro por status), `/servicos/novo`,
`/servicos/:id` (detalhe + total), `/servicos/:id/editar`. Formulário com cliente,
descrição, mão de obra e prévia do cálculo. `SelectField`, `src/config/servico.ts`.

### Checkpoint 04 (concluído)

🟢 Sistema completo de clientes: `/clientes` (lista + busca), `/clientes/novo`,
`/clientes/:id` (detalhe + histórico de serviços/orçamentos), `/clientes/:id/editar`.
CRUD ligado ao `clientesService`. Hook `useAsync`, componentes `Loading` e
`TextAreaField`. `formatDate` trata `YYYY-MM-DD` como data local.

### Checkpoint 03 (concluído)

🟢 Banco de dados — escopo "só preparar as migrations": migration SQL (7 tabelas +
enums + triggers + RLS), tipos TS (`src/types/database.ts`), camada de acesso a
dados (`src/services/*Service.ts`) com fallback demo. Migration **não aplicada**
(sem projeto Supabase) — aplicar via `supabase/README.md`.

### Checkpoint 02 (concluído)

🟢 Autenticação Supabase (login/cadastro/recuperação/redefinição), `AuthContext` +
`useAuth`, `authService`, `ProtectedRoute`, logout, persistência de sessão +
"manter conectado", modo demonstração, erros em português. Build sem erros;
modo demo testado no navegador.

### Checkpoint 01 (concluído e validado)

🟢 Estrutura, layout, rotas, páginas, preparação Supabase/PWA, documentação.
Build e dev server validados. Node.js v24.19.0 instalado via winget.
Atenção: projeto dentro do OneDrive causou `EPERM` no 1º `npm install` — OneDrive
foi pausado; religar após instalações.

## FUNCIONALIDADES CONCLUÍDAS

**Checkpoint 01**
- Estrutura React + Vite + TypeScript.
- Tailwind CSS + identidade visual MR ELÉTRICA.
- Layout responsivo mobile first (menu inferior no celular, menu lateral no PC).
- Roteamento e todas as páginas base: login, dashboard, clientes, orçamentos,
  serviços, materiais, documentos, configurações, 404.
- Dashboard com cartões e botões de ação (dados fictícios).
- Camada de serviços (`dashboardService`, `ocrService`, `aiService`) com
  arquitetura modular para trocar fornecedores.
- Preparação do Supabase (`src/lib/supabase.ts`, modo demonstração + aviso).
- Preparação do PWA (manifest, ícones, service worker).
- Documentação (`README.md`, `.env.example`, `vercel.json`).

**Checkpoint 02**
- Autenticação com Supabase Auth: login, cadastro, recuperação e redefinição de senha.
- `AuthContext` + `useAuth` (user, session, loading, isDemo + ações).
- `authService` isolando Supabase e modo demonstração.
- Proteção de todas as rotas privadas (`ProtectedRoute`) com tela de carregamento.
- Logout com confirmação (Sidebar no desktop, menu da TopBar no celular).
- Persistência de sessão + "Manter conectado" (localStorage x sessionStorage).
- `onAuthStateChange` sincronizando o contexto (inclusive entre abas).
- Modo demonstração: login `demo@mreletrica.com.br` / `123456` (fictício, local).
- Tratamento de erros em português (`translateAuthError`), sem expor o Supabase.

**Checkpoint 03**
- Migration SQL do schema completo (7 tabelas) + enums + triggers + RLS por usuário.
- Tipos TypeScript do banco (`src/types/database.ts`).
- Camada de acesso a dados: `clientesService`, `servicosService`, `orcamentosService`,
  `materiaisService`, `documentosService`, `configuracoesService` (CRUD tipado).
- Fallback de modo demonstração para os services (`demoStore` / `demoCrud` / `demoSeed`).
- `supabase/README.md` com instruções de aplicação.

**Checkpoint 04**
- Tela de clientes completa: lista + busca, cadastro, edição, exclusão.
- Página de detalhe do cliente com histórico (serviços e orçamentos do cliente).
- Rotas `/clientes`, `/clientes/novo`, `/clientes/:id`, `/clientes/:id/editar`.
- Hook `useAsync`, componentes `Loading` e `TextAreaField`.

**Checkpoint 05**
- Tela de serviços completa: lista + filtro por status, cadastro, edição, exclusão.
- Formulário com seleção de cliente, mão de obra (técnicos, horas, tipo de hora,
  valor/hora das configurações) e prévia do cálculo ao vivo.
- Detalhe do serviço com total (mão de obra + deslocamento + outros + materiais).
- `SelectField`, `src/config/servico.ts`.

**Checkpoint 06**
- Módulo `src/utils/maoDeObra.ts` (fórmula centralizada + recálculo).
- Valor/hora automático por tipo de hora a partir das configurações (sobrescrita manual opcional).
- Persistência do valor/hora efetivo no serviço; linha da fórmula no detalhe.

**Checkpoint 07**
- Materiais manuais dentro do serviço: adicionar, editar, excluir (nome, quantidade,
  unidade, valor de custo, valor cobrado), com recálculo do total do serviço.
- Tela `/materiais`: lista geral com serviço/cliente e totais.
- `materiaisService.getMaterial()`, `src/config/material.ts`.

**Checkpoint 08**
- Módulo `src/utils/margem.ts`; valor cobrado = custo × (1 + margem%).
- Chips de margem 0/10/20/30/40/personalizada no formulário de material.
- Sobrescrita manual com margem implícita; "aplicar margem a todos" no serviço.
- Margem padrão a partir das configurações.

**Checkpoint 09**
- Migration `notas_fiscais` + bucket de Storage `notas-fiscais`.
- `storageService` modular (Supabase Storage / localStorage no demo).
- `notasFiscaisService` + componente `NotasFiscais` no detalhe do serviço:
  enviar foto/imagem/PDF, miniatura, abrir, excluir.

**Checkpoint 10**
- `OCRService` modular + `interpretarTextoNota(texto)` (parser de cupom/nota).
- Provedor padrão "manual" (sem fornecedor pago); pronto para Tesseract/Edge Function.
- Tela de leitura: texto → itens editáveis → margem por lote → materiais no serviço.

**Checkpoint 11**
- Migration `fotos_servico` + bucket `fotos-servicos`; `storageService` genérico.
- `fotosServicoService` + componente `FotosServico` (Antes / Durante / Depois).
- Upload com câmera no celular, galeria de miniaturas, excluir.

**Checkpoint 12**
- `AIService` modular (provedor `regras` por padrão; pronto para IA real).
- "Gerar descrição profissional" no detalhe e no formulário do serviço.

**Checkpoint 13**
- `orcamentosService` com numeração automática e "criar do serviço".
- Telas de orçamento: lista + filtro, formulário (com "puxar valores do serviço"),
  detalhe com composição do valor e alteração de status.

**Checkpoint 14** — PDF do orçamento (`jspdf` sob demanda, `pdfDoc` + `orcamentoPdf`);
`documentacaoService`; Configurações editáveis (empresa, financeiro, PIX).

**Checkpoint 15** — PIX: `pixService` (copia e cola EMV/BR Code + CRC16, QR Code
com `qrcode-generator`); card no orçamento; incluído no PDF.

**Checkpoints 16–18** — PDF de ordem de serviço, relatório técnico (com fotos) e
recibo; `documentosPdf`; `ReciboFormPage`; `/documentos` reescrita (histórico).

**Checkpoint 19** — `financeiroService` + `/financeiro` (gasto em materiais,
margem, mão de obra, faturamento).

**Checkpoint 20** — `dashboardService` real; Dashboard reescrito; remoção de `mockData`.

**Checkpoint 21** — Histórico completo do cliente (serviços, orçamentos, documentos, totais).

**Checkpoint 22** — `download.ts` (baixar, Web Share, WhatsApp); botões de
compartilhamento no orçamento, serviço e recibo.

**Checkpoint 23** — Build/lint limpos, code-splitting, limpeza, PWA, testes; v1.0.0.

## FUNCIONALIDADES EM DESENVOLVIMENTO

- Nenhuma. **Todos os 23 checkpoints concluídos.**

## PENDÊNCIAS (para tirar do modo demonstração)

1. Criar o projeto no Supabase e aplicar as 3 migrations (`supabase/README.md`).
2. Preencher `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
3. Configurar Authentication (Email + Site URL + Redirect URLs).
4. Regenerar `src/types/database.ts` com `supabase gen types`.
5. Deploy na Vercel com as variáveis de ambiente.
6. (Opcional) Ativar OCR de imagem / IA de texto via `setOCRProvider` /
   `setAIProvider` + Edge Function.

## ESTRUTURA DO BANCO DE DADOS

Schema em `supabase/migrations/` — **ainda não aplicado** (sem projeto Supabase):
1. `20260906120000_initial_schema.sql` (CP03) — 7 tabelas + enums + triggers + RLS.
2. `20260907120000_notas_fiscais.sql` (CP09) — `notas_fiscais` + bucket `notas-fiscais`.
3. `20260907130000_fotos_servico.sql` (CP11) — `fotos_servico` + bucket `fotos-servicos`.

| Tabela | Chave | Observações |
| ------ | ----- | ----------- |
| `profiles` | `id` = `auth.users.id` | nome, email. Criada por trigger no cadastro. |
| `configuracoes` | `user_id` | empresa, valores de hora, margem padrão (20%), PIX. Criada por trigger. |
| `clientes` | `id` | nome, cpf/cnpj, contatos, endereço, condomínio, responsável, obs. |
| `servicos` | `id` | cliente, descrição, horas, técnicos, tipo de hora, mão de obra, status. |
| `orcamentos` | `id` | cliente, serviço, número (único por usuário), status, valores, garantia, pagamento. |
| `materiais` | `id` | serviço/orçamento, nome, qtd, unidade, custo, margem %, valor cobrado. |
| `documentos` | `id` | tipo (orçamento/OS/relatório/recibo), título, vínculos, arquivo_url, dados jsonb. |
| `notas_fiscais` | `id` | metadados do arquivo enviado (foto/PDF/imagem), `texto_ocr` (CP10), vínculo com serviço. |
| `fotos_servico` | `id` | fotos do serviço por categoria (antes/durante/depois); arquivo no bucket `fotos-servicos`. |

Enums: `servico_status`, `orcamento_status`, `documento_tipo`, `material_unidade`, `tipo_hora`, `foto_categoria`.
RLS habilitado em todas — acesso restrito ao dono (`auth.uid()`).

## CONFIGURAÇÕES NECESSÁRIAS

| Item | Onde | Status |
| ---- | ---- | ------ |
| Build local validado (`npm run build`) | Máquina de desenvolvimento | ✅ OK |
| `VITE_SUPABASE_URL` | `.env` (local) e Vercel | Pendente |
| `VITE_SUPABASE_ANON_KEY` | `.env` (local) e Vercel | Pendente |
| Node.js 18+ instalado | Máquina de desenvolvimento | ✅ v24.19.0 |
| Projeto Supabase criado | supabase.com | Pendente |
| Projeto Vercel criado | vercel.com | Pendente |
| Provedor OCR (futuro, CP10) | Edge Function / backend | Não definido |
| Provedor IA (futuro, CP12) | Edge Function / backend | Não definido |

## PRÓXIMO CHECKPOINT

Nenhum — o roteiro de 23 checkpoints está **concluído (v1.0.0)**.

Próximos passos são de operação, não de desenvolvimento:
1. Conectar o Supabase real (migrations + `.env`).
2. Deploy na Vercel.
3. Substituir os ícones/logo placeholder pela arte oficial da MR ELÉTRICA.
4. (Opcional) Ativar OCR de imagem / IA de texto.
