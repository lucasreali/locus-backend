# Locus

> *Your knowledge, in place.*

Locus é um aplicativo desktop de produtividade voltado para estudantes universitários. Ele combina um gerenciador de notas, um calendário de prazos e um importador inteligente de documentos — permitindo que o estudante jogue um plano de ensino no app e tenha o semestre inteiro organizado automaticamente.

---

## Problema

Estudantes universitários lidam com múltiplas matérias, prazos, provas e entregas ao mesmo tempo. As ferramentas existentes (Notion, Obsidian, Google Calendar) resolvem partes do problema, mas nenhuma conecta o documento recebido do professor diretamente à agenda do estudante. O resultado é uma agenda desatualizada, prazos perdidos e tempo gasto organizando o que poderia ser automático.

---

## Solução

Locus integra três módulos em uma única interface desktop:

1. **Notas** — escrever e organizar o conteúdo estudado
2. **Calendário** — visualizar e controlar prazos e provas
3. **Importador IA** — subir um documento e deixar a IA montar a agenda automaticamente

O diferencial está no pipeline de IA: o estudante recebe o plano de ensino da faculdade, sobe no Locus, e em segundos todos os marcos do semestre já estão no calendário — com revisão antes de confirmar.

---

## Nome e identidade

**Nome:** Locus  
**Referência:** Do latim *locus* ("lugar") e do método dos loci — a técnica milenar de memorização onde cada informação tem um lugar no espaço mental.  
**Tagline:** *Your knowledge, in place.*  
**Cor primária:** `#534AB7` (Locus Purple)  
**Paleta:** Purple · Teal (IA) · Amber (alertas) · Ink (texto)

---

## Público-alvo

Estudantes universitários que:
- Recebem planos de ensino, cronogramas e listas de exercícios em PDF ou imagem
- Precisam controlar prazos de provas, entregas e seminários
- Querem um espaço único para notas e agenda, sem precisar sincronizar ferramentas diferentes

---

## Funcionalidades do MVP

### Módulo 1 — Gerenciador de notas

- Criar, editar e deletar notas
- Editor rich text (títulos, negrito, listas, blocos de código)
- Organização por tags (ex: "Cálculo II", "Algoritmos")
- Listagem de notas na sidebar com filtro por tag
- Busca simples por título
- Dados salvos localmente por usuário

### Módulo 2 — Calendário de prazos

- Visualização mensal do calendário
- Criação manual de prazos com título, data, tipo e matéria
- Tipos de evento: prova, entrega, aula
- Lista de próximos prazos ordenada por data
- Badge de urgência: verde (> 7 dias), âmbar (3–7 dias), vermelho (< 3 dias)
- Notificações nativas do sistema operacional

### Módulo 3 — Importador IA

- Upload de PDF ou imagem (plano de ensino, print de calendário, cronograma)
- Extração de texto via OCR (PDFs) ou visão direta (imagens via Claude)
- IA identifica e extrai: datas, títulos de eventos, tipos e matérias
- Tela de revisão: o usuário confirma ou descarta cada sugestão antes de salvar
- Histórico de documentos já processados

### Autenticação

- Cadastro com nome, email e senha
- Login com JWT
- Todos os dados vinculados ao usuário autenticado

---

## O que fica fora do MVP

| Funcionalidade | Motivo |
|---|---|
| Links bidirecionais entre notas | Complexidade alta, baixo impacto inicial |
| Múltiplos workspaces / perfis | Pós-MVP |
| Sincronização em nuvem | Local-first é suficiente para MVP |
| Command palette | Polish de UX, não essencial |
| Resumo e sugestão de tags por IA | IA focada só no pipeline de documentos |
| Versão mobile / web | Desktop only por ora |

---

## Stack técnica

### Cliente — Tauri (desktop)

| Tecnologia | Papel |
|---|---|
| Tauri v2 | Shell nativo do app desktop |
| React + TypeScript | UI e lógica do frontend |
| Vite | Bundler |
| TipTap | Editor de notas rich text |
| React Big Calendar | Visualização do calendário |
| TanStack Query | Cache e estado do servidor (dados da API) |
| Zustand | Estado local da UI (nota ativa, modais, sidebar) |
| shadcn/ui + Tailwind | Componentes e estilos |
| tauri-plugin-store | Armazenamento seguro do JWT |

### Backend — Fastify (Node.js)

| Tecnologia | Papel |
|---|---|
| Fastify + TypeScript | Framework HTTP principal |
| Prisma ORM | Acesso ao banco e migrations |
| JWT + bcrypt | Autenticação e senhas |
| @fastify/multipart | Upload de arquivos |
| pdf-parse | Extração de texto de PDFs |
| @anthropic-ai/sdk | Chamadas à API do Claude |
| Zod | Validação de schemas |

### Banco de dados

| Tecnologia | Papel |
|---|---|
| PostgreSQL | Banco principal |
| Prisma | ORM + migrations |
| Railway / Neon | PostgreSQL gerenciado na nuvem |

### Infra

| Serviço | Papel |
|---|---|
| Railway | Hospedagem do backend + banco |
| Cloudflare R2 | Armazenamento de PDFs e imagens |
| GitHub Actions | CI/CD e build do Tauri |

---

## Arquitetura

```
┌─────────────────────────┐         HTTPS/REST        ┌─────────────────────────┐
│   Cliente (Tauri)        │  ──────────────────────►  │   Backend (Fastify)      │
│                          │                           │                          │
│  React + TypeScript      │                           │  API REST                │
│  TipTap (editor)         │                           │  Auth (JWT + bcrypt)     │
│  React Big Calendar      │                           │  Prisma ORM              │
│  TanStack Query          │                           │  Pipeline de IA          │
│  Zustand                 │                           │                          │
└─────────────────────────┘                           └────────────┬────────────┘
                                                                    │
                                              ┌─────────────────────┼──────────────────┐
                                              │                     │                  │
                                    ┌─────────▼──────┐   ┌─────────▼──────┐  ┌────────▼───────┐
                                    │  PostgreSQL     │   │  Cloudflare R2 │  │  Claude API    │
                                    │  (dados)        │   │  (arquivos)    │  │  (IA)          │
                                    └────────────────┘   └────────────────┘  └────────────────┘
```

---

## Endpoints do backend (MVP)

### Autenticação
| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/register` | Cria conta com nome, email e senha |
| POST | `/auth/login` | Autentica e retorna JWT |
| GET | `/auth/me` | Retorna dados do usuário logado |

### Notas
| Método | Rota | Descrição |
|---|---|---|
| GET | `/notes` | Lista notas com filtro por tag e busca |
| GET | `/notes/:id` | Retorna nota específica |
| POST | `/notes` | Cria nova nota |
| PUT | `/notes/:id` | Atualiza nota |
| DELETE | `/notes/:id` | Remove nota (soft delete) |

### Eventos e prazos
| Método | Rota | Descrição |
|---|---|---|
| GET | `/events` | Lista eventos com filtro por mês e tipo |
| GET | `/events/upcoming` | Próximos prazos a vencer |
| POST | `/events` | Cria evento manualmente |
| PUT | `/events/:id` | Atualiza evento |
| DELETE | `/events/:id` | Remove evento |

### IA
| Método | Rota | Descrição |
|---|---|---|
| POST | `/ai/parse-document` | Processa PDF/imagem e retorna sugestões |
| POST | `/ai/confirm-events` | Salva eventos confirmados pelo usuário |
| GET | `/ai/history` | Histórico de documentos processados |

### Infra
| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Health check da API |

---

## Pipeline de IA — como funciona

```
Arquivo (PDF/imagem)
        │
        ▼
  OCR / extração
  (pdf-parse ou visão direta para imagens)
        │
        ▼
  Claude API
  (extrai datas, títulos, tipos de eventos)
        │
        ▼
  Retorna JSON estruturado
  [{ titulo, data, tipo, materia }, ...]
        │
        ▼
  Tela de revisão
  (usuário confirma ou descarta cada item)
        │
        ▼
  Eventos salvos no calendário
```

**Observação:** imagens (prints de calendário, fotos de planos de ensino) vão diretamente para a vision API do Claude, sem necessidade de OCR. PDFs seguem o fluxo de extração de texto → Claude.

---

## Roadmap de desenvolvimento

### Fase 1 — Fundação (3–4 semanas)
- Setup do projeto Tauri + React + TypeScript
- Banco de dados PostgreSQL com Prisma
- Autenticação (register, login, JWT)
- Módulo de notas completo (CRUD + tags + busca)
- Sidebar de navegação e editor TipTap

### Fase 2 — Calendário (3–4 semanas)
- Módulo de eventos (CRUD)
- Visualização mensal com React Big Calendar
- Lista de prazos com badge de urgência
- Notificações nativas via Tauri
- Dark mode

### Fase 3 — IA (4–5 semanas)
- Upload de arquivos (PDF e imagem)
- Pipeline OCR + Claude API no backend
- Tela de revisão de eventos sugeridos
- Confirmação e salvamento em massa
- Histórico de documentos processados

### Fase 4 — Polish (3–4 semanas)
- Templates de notas
- Busca global
- Atalhos de teclado
- Export de notas (PDF / Markdown)
- Múltiplos workspaces

---

## Referências e inspirações

- **Notion** — estrutura de workspace e editor de blocos
- **Obsidian** — filosofia local-first e foco em conhecimento
- **Linear** — design limpo e minimalista
- **TickTick / Todoist** — gestão de prazos e urgência visual