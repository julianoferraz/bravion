# 📋 Documentação Completa do Projeto — Bravion Global

## 1. Visão Geral

**Bravion Global** é um site institucional + plataforma de blog para uma empresa que ajuda companhias internacionais a expandirem suas operações para o Brasil e América Latina. O projeto oferece:

- **Site institucional** com seções: Hero, Sobre, Serviços, Setores, Por que nos escolher, Contato e Footer
- **Blog completo** com geração de conteúdo por IA, gerenciamento de categorias, edição visual/HTML e agendamento de publicação
- **Painel administrativo** para gerenciamento de posts, categorias e geração de conteúdo/imagens via IA
- **Autenticação e autorização** com sistema de roles (admin, editor, author, viewer)
- **Internacionalização (i18n)** com suporte a Inglês e Português, com detecção automática por IP

**Público-alvo:** Empresas internacionais de tecnologia (SaaS, Proxy, Betting, Apps, Produtos Digitais) que buscam expandir para a América Latina.

---

## 2. Arquitetura Completa

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React SPA)                   │
│  Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui │
│  Hospedado como arquivos estáticos (HTML/JS/CSS)         │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────────┐
│                  SUPABASE (Backend)                       │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  PostgreSQL  │  │ Edge Functions│  │    Storage     │  │
│  │  (Database)  │  │ (Deno Runtime)│  │ (blog-images)  │  │
│  │  + RLS       │  │              │  │                │  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐                       │
│  │    Auth      │  │  Realtime    │                       │
│  │ (GoTrue)     │  │ (WebSocket)  │                       │
│  └─────────────┘  └──────────────┘                       │
└─────────────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              APIs EXTERNAS                                │
│  • Lovable AI Gateway (geração de texto e imagem)        │
│  • ip-api.com (detecção de geolocalização por IP)        │
└─────────────────────────────────────────────────────────┘
```

### Fluxo de dados:
1. O **frontend** se comunica com o **Supabase** via SDK JavaScript (`@supabase/supabase-js`)
2. **Edge Functions** (Deno) executam lógica de backend (geração de conteúdo IA, detecção de idioma, publicação agendada)
3. **RLS (Row Level Security)** no PostgreSQL garante segurança no nível de banco de dados
4. **Storage** armazena imagens de capa dos posts do blog

---

## 3. Stack Tecnológica

### Frontend
| Tecnologia | Versão | Uso |
|---|---|---|
| React | ^18.3.1 | Biblioteca de UI |
| TypeScript | (via Vite) | Tipagem estática |
| Vite | (config) | Build tool e dev server |
| Tailwind CSS | (via PostCSS) | Estilização utilitária |
| shadcn/ui | (componentes) | Biblioteca de componentes |
| React Router DOM | ^6.30.1 | Roteamento SPA |
| TanStack React Query | ^5.83.0 | Gerenciamento de estado servidor |
| Lucide React | ^0.462.0 | Ícones |
| date-fns | ^3.6.0 | Manipulação de datas |
| Sonner | ^1.7.4 | Notificações toast |
| Zod | ^3.25.76 | Validação de schemas |
| React Hook Form | ^7.61.1 | Formulários |
| Recharts | ^2.15.4 | Gráficos (disponível) |

### Backend (Supabase)
| Componente | Tecnologia | Uso |
|---|---|---|
| Banco de dados | PostgreSQL 15+ | Persistência de dados |
| Auth | GoTrue (Supabase Auth) | Autenticação de usuários |
| Edge Functions | Deno Runtime | Lógica de backend serverless |
| Storage | Supabase Storage | Armazenamento de arquivos/imagens |
| RLS | Row Level Security | Segurança de dados |

### APIs Externas
| API | Uso |
|---|---|
| Lovable AI Gateway (`ai.gateway.lovable.dev`) | Geração de texto e imagem via modelos Google Gemini |
| ip-api.com | Detecção de país por IP para auto-seleção de idioma |

---

## 4. Estrutura de Pastas

```
bravion-global/
├── public/                      # Arquivos estáticos públicos
│   ├── favicon.ico              # Ícone do site
│   ├── placeholder.svg          # Imagem placeholder
│   └── robots.txt               # Configuração para crawlers
│
├── src/                         # Código-fonte principal
│   ├── assets/                  # Assets importados pelo build
│   │   ├── hero-map.jpg         # Imagem de fundo do Hero
│   │   └── logo.png             # Logo da empresa
│   │
│   ├── components/              # Componentes React reutilizáveis
│   │   ├── About.tsx            # Seção "Sobre" da landing page
│   │   ├── Contact.tsx          # Seção "Contato" com formulário
│   │   ├── Footer.tsx           # Rodapé do site
│   │   ├── Hero.tsx             # Banner principal da landing page
│   │   ├── Industries.tsx       # Seção "Setores que atendemos"
│   │   ├── LanguageSelector.tsx # Seletor de idioma (EN/PT)
│   │   ├── Navbar.tsx           # Barra de navegação com menu hambúrguer
│   │   ├── Services.tsx         # Seção "O que fazemos"
│   │   ├── WhyChoose.tsx        # Seção "Por que nos escolher"
│   │   ├── blog/                # Componentes específicos do blog
│   │   │   └── RichTextEditor.tsx  # Editor visual/HTML dual-mode
│   │   └── ui/                  # Componentes shadcn/ui (não editar manualmente)
│   │
│   ├── contexts/                # Contextos React
│   │   └── AuthContext.tsx      # Contexto de autenticação + roles
│   │
│   ├── hooks/                   # Hooks personalizados
│   │   ├── use-mobile.tsx       # Detecção de dispositivo mobile
│   │   └── use-toast.ts         # Hook para notificações toast
│   │
│   ├── i18n/                    # Internacionalização
│   │   ├── LanguageContext.tsx   # Provider de idioma com auto-detecção
│   │   └── translations.ts     # Strings traduzidas (EN/PT)
│   │
│   ├── integrations/supabase/   # ⚠️ NÃO EDITAR - Auto-gerado
│   │   ├── client.ts            # Cliente Supabase configurado
│   │   └── types.ts             # Types do banco de dados
│   │
│   ├── lib/                     # Utilitários
│   │   └── utils.ts             # Função cn() para classes condicionais
│   │
│   ├── pages/                   # Páginas/rotas da aplicação
│   │   ├── Index.tsx            # Landing page principal
│   │   ├── Blog.tsx             # Listagem pública do blog
│   │   ├── BlogPost.tsx         # Visualização de artigo individual
│   │   ├── Login.tsx            # Página de login
│   │   ├── Register.tsx         # Página de cadastro
│   │   ├── NotFound.tsx         # Página 404
│   │   └── admin/               # Páginas administrativas
│   │       ├── AdminBlog.tsx    # Listagem de posts (admin)
│   │       ├── AdminBlogEditor.tsx  # Editor de post (admin)
│   │       └── AdminCategories.tsx  # Gerenciamento de categorias
│   │
│   ├── App.tsx                  # Componente raiz com rotas
│   ├── App.css                  # Estilos globais extras
│   ├── index.css                # Design system (tokens CSS)
│   ├── main.tsx                 # Entry point da aplicação
│   └── vite-env.d.ts            # Tipos do Vite
│
├── supabase/                    # Configuração Supabase
│   ├── config.toml              # Configuração das Edge Functions
│   ├── functions/               # Edge Functions (Deno)
│   │   ├── detect-language/     # Detecção automática de idioma por IP
│   │   │   └── index.ts
│   │   ├── generate-text/       # Geração de artigos via IA
│   │   │   └── index.ts
│   │   ├── generate-image/      # Geração de imagens de capa via IA
│   │   │   └── index.ts
│   │   └── publish-scheduled/   # Publicação automática de posts agendados
│   │       └── index.ts
│   └── migrations/              # ⚠️ NÃO EDITAR - Migrations do banco
│
├── .env                         # ⚠️ NÃO EDITAR - Variáveis de ambiente auto-geradas
├── components.json              # Configuração do shadcn/ui
├── tailwind.config.ts           # Configuração do Tailwind CSS
├── vite.config.ts               # Configuração do Vite
├── tsconfig.json                # Configuração do TypeScript
├── tsconfig.app.json            # TypeScript config (app)
├── tsconfig.node.json           # TypeScript config (node)
├── eslint.config.js             # Configuração do ESLint
└── postcss.config.js            # Configuração do PostCSS
```

---

## 5. Features Implementadas

### 5.1 Site Institucional
- **Hero Section**: Banner com imagem de fundo, título com gradiente, CTA "Partner With Us"
- **Sobre (About)**: Descrição da empresa
- **Serviços (Services)**: 5 serviços listados (Representação Local, Design Criativo, Conteúdo, Ads, Parcerias)
- **Setores (Industries)**: 5 setores atendidos (SaaS, Proxy, Betting, Apps, Digital)
- **Por que nos escolher (WhyChoose)**: 5 diferenciais da empresa
- **Contato (Contact)**: Formulário de contato
- **Footer**: Rodapé com links e copyright

### 5.2 Navegação
- **Navbar responsiva**: Menu desktop horizontal + menu hambúrguer mobile
- **Logo da empresa**: Exibido na navbar
- **Scroll suave**: Links de navegação fazem scroll para seções
- **Seletor de idioma**: Alternância entre EN/PT

### 5.3 Internacionalização (i18n)
- **Detecção automática por IP**: Edge Function `detect-language` usa ip-api.com
- **Persistência**: Idioma salvo no localStorage
- **Cobertura**: Todas as strings da UI traduzidas (nav, hero, about, services, industries, contact, blog, auth, admin)

### 5.4 Autenticação & Autorização
- **Login/Registro**: Formulários com email/senha via Supabase Auth
- **Sistema de Roles**: 4 roles (admin, editor, author, viewer)
- **Permissões**:
  - `admin`: Gerenciamento total (CRUD posts, categorias, roles, deletar posts)
  - `editor`: Edição de todos os posts, gerenciamento de categorias
  - `author`: Criar e editar seus próprios posts
  - `viewer`: Visualizar conteúdo público
- **RLS**: Todas as tabelas protegidas com Row Level Security
- **Funções de banco**: `has_role()`, `is_admin_or_editor()`, `has_any_blog_role()`

### 5.5 Blog Público
- **Listagem de posts**: Design Astra-inspired com post destaque + grid
- **Filtros**: Busca por texto + filtro por categoria (pills)
- **Artigo individual**: Layout tipográfico com imagem de capa, excerpt, FAQ, compartilhamento social
- **SEO**: Meta tags dinâmicas (title, description, OG image)
- **Compartilhamento**: Twitter, LinkedIn, Facebook, copiar link

### 5.6 Painel Administrativo do Blog
- **Listagem de posts**: Tabela com filtros por status e busca, ações rápidas (editar, publicar, arquivar, duplicar, deletar)
- **Editor de posts**: 
  - Editor dual-mode (Visual WYSIWYG + HTML)
  - Campos: título, slug (auto-gerado), briefing, excerpt, conteúdo, categoria, imagem de capa
  - Configurações SEO: meta title, meta description
  - Upload de imagem de capa
- **Geração de texto por IA**: Briefing → artigo completo (título otimizado, slug, excerpt, conteúdo HTML, FAQs, meta tags)
- **Geração de imagem por IA**: Descrição do tema → imagem de capa gerada e salva no Storage
- **Agendamento de publicação**: Selecionar data/hora para publicação automática
- **Gerenciamento de categorias**: CRUD completo com slug automático

### 5.7 Edge Functions
| Função | Descrição | Trigger |
|---|---|---|
| `detect-language` | Detecta país por IP e retorna idioma (pt/en) | Chamada do frontend ao carregar |
| `generate-text` | Gera artigo completo via Google Gemini | Ação do admin no editor |
| `generate-image` | Gera imagem de capa via Google Gemini | Ação do admin no editor |
| `publish-scheduled` | Publica posts agendados cuja data já passou | Cron job (pg_cron) |

---

## 6. Fluxos Principais

### 6.1 Fluxo de Criação de Post com IA
```
Admin → Novo Post → Preenche Título + Briefing + Configurações IA
  → Salva como Draft
  → Clica "Gerar com IA"
  → Edge Function generate-text:
    1. Cria registro em blog_jobs (status: running)
    2. Atualiza post (status: generating)
    3. Chama Lovable AI Gateway (Google Gemini)
    4. Recebe JSON: título refinado, slug, excerpt, contentHtml, meta tags, FAQs
    5. Atualiza post com conteúdo gerado (status: ready)
    6. Atualiza blog_jobs (status: success)
    7. Registra audit_log
  → Admin revisa/edita conteúdo
  → Publica ou Agenda
```

### 6.2 Fluxo de Publicação Agendada
```
Cron Job → Edge Function publish-scheduled:
  1. Busca posts com status=scheduled E scheduled_at <= agora
  2. Para cada post:
    a. Cria blog_job (publish_scheduled)
    b. Valida slug único entre publicados
    c. Atualiza status → published, published_at → agora
    d. Registra audit_log
  3. Em caso de falha: status → failed, registra erro
```

### 6.3 Fluxo de Detecção de Idioma
```
Usuário acessa site → LanguageContext:
  1. Verifica localStorage (preferência salva)
  2. Se não há preferência → chama Edge Function detect-language
  3. Edge Function extrai IP dos headers (x-forwarded-for, cf-connecting-ip)
  4. Consulta ip-api.com para obter countryCode
  5. Retorna "pt" se Brasil, "en" caso contrário
  6. Frontend salva preferência no localStorage
```

### 6.4 Fluxo de Autenticação
```
Usuário → Login → Supabase Auth (signInWithPassword)
  → onAuthStateChange dispara
  → AuthContext busca roles em user_roles
  → Deriva permissões (isAdmin, isEditor, isAuthor, canManageBlog)
  → Habilita/desabilita acesso às rotas admin
```

---

## 7. Variáveis de Ambiente

### Frontend (.env)
| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase (ex: `https://xxx.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave anônima (pública) do Supabase |
| `VITE_SUPABASE_PROJECT_ID` | ID do projeto Supabase |

### Secrets do Backend (Edge Functions)
| Secret | Descrição |
|---|---|
| `SUPABASE_URL` | URL do Supabase (injetada automaticamente) |
| `SUPABASE_ANON_KEY` | Chave anônima do Supabase (injetada automaticamente) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço do Supabase (acesso admin ao banco) |
| `SUPABASE_DB_URL` | URL de conexão direta ao PostgreSQL |
| `LOVABLE_API_KEY` | Chave para acessar o Lovable AI Gateway (geração de texto/imagem) |

---

## 8. Banco de Dados

### Tabelas

| Tabela | Descrição | RLS |
|---|---|---|
| `blog_posts` | Posts do blog com todos os metadados | ✅ Sim |
| `blog_categories` | Categorias dos posts | ✅ Sim |
| `blog_tags` | Tags para posts | ✅ Sim |
| `blog_post_tags` | Relação N:N entre posts e tags | ✅ Sim |
| `blog_jobs` | Registro de jobs assíncronos (geração IA) | ✅ Sim |
| `audit_logs` | Log de auditoria de ações | ✅ Sim |
| `user_roles` | Roles dos usuários (admin, editor, author, viewer) | ✅ Sim |

### Enums
- `app_role`: admin, editor, author, viewer
- `blog_post_status`: draft, generating, ready, scheduled, published, failed, archived, deleted
- `blog_job_type`: generate_text, generate_image, publish_scheduled
- `blog_job_status`: queued, running, success, failed

### Funções do Banco
- `has_role(user_id, role)` — Verifica se usuário possui determinada role
- `is_admin_or_editor(user_id)` — Verifica se é admin ou editor
- `has_any_blog_role(user_id)` — Verifica se tem qualquer role de blog (admin/editor/author)
- `generate_slug(title)` — Gera slug URL-friendly a partir de um título
- `update_updated_at_column()` — Trigger para atualizar timestamps

### Storage Buckets
- `blog-images` (público) — Armazena imagens de capa dos posts

---

## 9. Integrações Externas

### Lovable AI Gateway
- **URL**: `https://ai.gateway.lovable.dev/v1/chat/completions`
- **Autenticação**: Bearer token (`LOVABLE_API_KEY`)
- **Modelos utilizados**:
  - `google/gemini-3-flash-preview` — Geração de texto (artigos)
  - `google/gemini-2.5-flash-image` — Geração de imagens
- **⚠️ ATENÇÃO para migração**: Esta API é exclusiva do Lovable. Para migrar, será necessário substituir por chamadas diretas à API do Google AI (Vertex AI ou Google AI Studio) ou OpenAI.

### ip-api.com
- **URL**: `http://ip-api.com/json/{ip}?fields=countryCode`
- **Autenticação**: Nenhuma (API gratuita)
- **Uso**: Detecção de país por IP para auto-seleção de idioma
- **Limitação**: 45 requisições/minuto no plano gratuito

---

## 10. Regras de Negócio Importantes

1. **Slug único**: Posts publicados devem ter slug único. Validado no edge function `publish-scheduled`.
2. **Soft delete**: Posts não são deletados fisicamente — o campo `deleted_at` é preenchido e status muda para "deleted".
3. **Hierarquia de roles**: Admin > Editor > Author > Viewer. Cada nível herda permissões do anterior para leitura.
4. **Geração de conteúdo**: Requer que o post já esteja salvo (tenha ID) antes de gerar texto/imagem.
5. **Publicação agendada**: Posts com status "scheduled" são automaticamente publicados quando `scheduled_at <= now()`.
6. **Detecção de idioma**: O idioma do usuário é detectado uma vez e salvo no localStorage. A preferência manual sobrescreve a detecção.
7. **Auto-slug**: Ao criar ou editar um post draft, o slug é gerado automaticamente a partir do título.

---

## 11. Pontos de Atenção

### Dependência do Lovable AI Gateway
A geração de texto e imagem usa a API `ai.gateway.lovable.dev`, que é **exclusiva do Lovable**. Para migrar para infraestrutura própria:
- Substituir por Google Vertex AI, Google AI Studio, ou OpenAI API
- Atualizar os Edge Functions `generate-text` e `generate-image`
- Configurar nova chave de API como secret

### Edge Functions sem JWT Verification
Todas as Edge Functions estão com `verify_jwt = false` em `supabase/config.toml`. As funções `generate-text` e `generate-image` fazem validação manual do token. A função `detect-language` é pública (sem autenticação).

### RLS com políticas RESTRICTIVE
Todas as políticas RLS são `RESTRICTIVE` (Permissive: No), o que significa que TODAS as políticas aplicáveis devem retornar true para permitir acesso. Isso é mais seguro mas pode causar bloqueios inesperados se não configurado corretamente.

### Sem triggers de updated_at
A função `update_updated_at_column()` existe mas **não há triggers** associados a ela nas tabelas atuais. O `updated_at` pode não ser atualizado automaticamente.

### Hero Section não usa i18n
O componente `Hero.tsx` tem textos hardcoded em inglês em vez de usar o sistema de traduções.

### Formulário de contato
O componente `Contact.tsx` pode não estar conectado a um backend para envio de emails. Verificar implementação.

### Sem proteção de rota no admin
As rotas `/admin/*` fazem redirect para `/login` via JavaScript, mas não há proteção no nível de roteamento (Route Guards). Um usuário pode brevemente ver a página antes do redirect.
