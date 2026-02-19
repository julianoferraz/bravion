# 🚀 Guia de Migração — Bravion Global para VPS

Este guia detalha o processo completo para migrar o projeto Bravion Global para uma VPS Ubuntu com Docker.

---

## ETAPA 1 — Preparação Local

### 1.1 Clonar o Repositório

**Via GitHub Desktop:**
1. Abra o GitHub Desktop
2. Clique em `File > Clone Repository`
3. Selecione o repositório do Bravion Global
4. Escolha o diretório local de destino
5. Clique em `Clone`

**Via terminal:**
```bash
git clone https://github.com/SEU_USUARIO/SEU_REPO.git bravion-global
cd bravion-global
```

### 1.2 Verificar o Projeto Localmente

```bash
# Instalar dependências
npm install

# Verificar se builda sem erros
npm run build

# Testar localmente (opcional)
npm run dev
```

### 1.3 Conectar VSCode à VPS via SSH

1. Instale a extensão **Remote - SSH** no VSCode
2. Pressione `Ctrl+Shift+P` → `Remote-SSH: Connect to Host`
3. Configure o host: `ssh usuario@IP_DA_VPS`
4. Abra o diretório do projeto na VPS após o deploy

---

## ETAPA 2 — Configuração do Supabase

### Opções Disponíveis

| Opção | Prós | Contras |
|---|---|---|
| **A) Manter Supabase Cloud** | Zero manutenção, backups automáticos, free tier disponível, CDN global | Limites do plano gratuito (500MB banco, 1GB storage), dependência do serviço |
| **B) Supabase Self-Hosted (Docker)** | Controle total, sem limites, dados na sua VPS | Mais complexo, requer manutenção, backups manuais, mais recursos da VPS |

### Opção A — Manter no Supabase Cloud (Recomendado para começar)

#### 2A.1 Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto (escolha região mais próxima do seu público)
3. Anote:
   - **Project URL**: `https://SEU_PROJECT_ID.supabase.co`
   - **Anon Key**: Encontrada em Settings > API
   - **Service Role Key**: Encontrada em Settings > API (⚠️ nunca exponha no frontend)

#### 2A.2 Exportar Schema do Banco Atual

Conecte ao banco atual e exporte:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Linkar ao projeto atual
supabase link --project-ref nmbcifsqrbxhbvgssqtd

# Exportar schema completo
supabase db dump --schema public > schema_dump.sql

# Exportar dados (opcional)
supabase db dump --data-only --schema public > data_dump.sql
```

**Alternativa manual — SQL para recriar o schema:**

```sql
-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'author', 'viewer');
CREATE TYPE public.blog_post_status AS ENUM ('draft', 'generating', 'ready', 'scheduled', 'published', 'failed', 'archived', 'deleted');
CREATE TYPE public.blog_job_type AS ENUM ('generate_text', 'generate_image', 'publish_scheduled');
CREATE TYPE public.blog_job_status AS ENUM ('queued', 'running', 'success', 'failed');

-- ============================================
-- FUNÇÕES
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_editor(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin', 'editor'))
$$;

CREATE OR REPLACE FUNCTION public.has_any_blog_role(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin', 'editor', 'author'))
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.generate_slug(title text)
RETURNS text LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE slug TEXT;
BEGIN
  slug := lower(trim(title));
  slug := regexp_replace(slug, '[áàâãä]', 'a', 'g');
  slug := regexp_replace(slug, '[éèêë]', 'e', 'g');
  slug := regexp_replace(slug, '[íìîï]', 'i', 'g');
  slug := regexp_replace(slug, '[óòôõö]', 'o', 'g');
  slug := regexp_replace(slug, '[úùûü]', 'u', 'g');
  slug := regexp_replace(slug, '[ç]', 'c', 'g');
  slug := regexp_replace(slug, '[^a-z0-9\s-]', '', 'g');
  slug := regexp_replace(slug, '\s+', '-', 'g');
  slug := regexp_replace(slug, '-+', '-', 'g');
  slug := trim(both '-' from slug);
  RETURN slug;
END;
$$;

-- ============================================
-- TABELAS
-- ============================================
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.blog_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  brief TEXT,
  excerpt TEXT,
  content_html TEXT,
  content_json JSONB,
  status blog_post_status NOT NULL DEFAULT 'draft',
  author_id UUID,
  category_id UUID REFERENCES public.blog_categories(id),
  cover_image_url TEXT,
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  ai_tone TEXT,
  ai_length TEXT,
  ai_target_audience TEXT,
  ai_keywords TEXT[],
  ai_language TEXT DEFAULT 'pt-BR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.blog_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.blog_post_tags (
  post_id UUID NOT NULL REFERENCES public.blog_posts(id),
  tag_id UUID NOT NULL REFERENCES public.blog_tags(id),
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE public.blog_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type blog_job_type NOT NULL,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id),
  status blog_job_status NOT NULL DEFAULT 'queued',
  payload JSONB,
  result JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- RLS - HABILITAR
-- ============================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - user_roles
-- ============================================
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES - blog_categories
-- ============================================
CREATE POLICY "Anyone can view categories" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "Admin/Editor can manage categories" ON public.blog_categories FOR ALL USING (is_admin_or_editor(auth.uid())) WITH CHECK (is_admin_or_editor(auth.uid()));

-- ============================================
-- RLS POLICIES - blog_posts
-- ============================================
CREATE POLICY "Public can view published posts" ON public.blog_posts FOR SELECT USING (status = 'published' AND deleted_at IS NULL AND published_at <= now());
CREATE POLICY "Authenticated can view published posts" ON public.blog_posts FOR SELECT USING (status = 'published' AND deleted_at IS NULL AND published_at <= now());
CREATE POLICY "Admin/Editor can view all posts" ON public.blog_posts FOR SELECT USING (is_admin_or_editor(auth.uid()));
CREATE POLICY "Authors can view own posts" ON public.blog_posts FOR SELECT USING (author_id = auth.uid() AND has_role(auth.uid(), 'author'));
CREATE POLICY "Blog roles can create posts" ON public.blog_posts FOR INSERT WITH CHECK (has_any_blog_role(auth.uid()));
CREATE POLICY "Admin/Editor can update any post" ON public.blog_posts FOR UPDATE USING (is_admin_or_editor(auth.uid())) WITH CHECK (is_admin_or_editor(auth.uid()));
CREATE POLICY "Authors can update own posts" ON public.blog_posts FOR UPDATE USING (author_id = auth.uid() AND has_role(auth.uid(), 'author')) WITH CHECK (author_id = auth.uid() AND has_role(auth.uid(), 'author'));
CREATE POLICY "Admin can delete posts" ON public.blog_posts FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES - blog_tags
-- ============================================
CREATE POLICY "Anyone can view tags" ON public.blog_tags FOR SELECT USING (true);
CREATE POLICY "Admin/Editor can manage tags" ON public.blog_tags FOR ALL USING (is_admin_or_editor(auth.uid())) WITH CHECK (is_admin_or_editor(auth.uid()));

-- ============================================
-- RLS POLICIES - blog_post_tags
-- ============================================
CREATE POLICY "Anyone can view post tags" ON public.blog_post_tags FOR SELECT USING (true);
CREATE POLICY "Admin/Editor can manage post tags" ON public.blog_post_tags FOR ALL USING (is_admin_or_editor(auth.uid())) WITH CHECK (is_admin_or_editor(auth.uid()));

-- ============================================
-- RLS POLICIES - blog_jobs
-- ============================================
CREATE POLICY "Admin/Editor can view all jobs" ON public.blog_jobs FOR SELECT USING (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admin/Editor can manage jobs" ON public.blog_jobs FOR ALL USING (is_admin_or_editor(auth.uid())) WITH CHECK (is_admin_or_editor(auth.uid()));
CREATE POLICY "Authors can view own post jobs" ON public.blog_jobs FOR SELECT USING (EXISTS (SELECT 1 FROM blog_posts WHERE blog_posts.id = blog_jobs.post_id AND blog_posts.author_id = auth.uid()));

-- ============================================
-- RLS POLICIES - audit_logs
-- ============================================
CREATE POLICY "Admin/Editor can view audit logs" ON public.audit_logs FOR SELECT USING (is_admin_or_editor(auth.uid()));
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (actor_user_id = auth.uid() OR is_admin_or_editor(auth.uid()));

-- ============================================
-- STORAGE
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true);

CREATE POLICY "Public can view blog images" ON storage.objects FOR SELECT USING (bucket_id = 'blog-images');
CREATE POLICY "Authenticated users can upload blog images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'blog-images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update blog images" ON storage.objects FOR UPDATE USING (bucket_id = 'blog-images' AND auth.role() = 'authenticated');
```

#### 2A.3 Importar no Novo Projeto

```bash
# No SQL Editor do Supabase Dashboard, cole o schema acima
# OU via CLI:
supabase link --project-ref NOVO_PROJECT_ID
psql "postgresql://postgres:SUA_SENHA@db.NOVO_PROJECT_ID.supabase.co:5432/postgres" < schema_dump.sql

# Importar dados (se tiver)
psql "postgresql://postgres:SUA_SENHA@db.NOVO_PROJECT_ID.supabase.co:5432/postgres" < data_dump.sql
```

#### 2A.4 Deploy das Edge Functions

```bash
# Instalar Supabase CLI se necessário
npm install -g supabase

# Linkar ao novo projeto
supabase link --project-ref NOVO_PROJECT_ID

# Deploy de todas as functions
supabase functions deploy detect-language --no-verify-jwt
supabase functions deploy generate-text --no-verify-jwt
supabase functions deploy generate-image --no-verify-jwt
supabase functions deploy publish-scheduled --no-verify-jwt
```

#### 2A.5 Configurar Secrets

```bash
# Configurar a chave de IA (obter uma chave do Google AI Studio ou OpenAI)
supabase secrets set LOVABLE_API_KEY=sua_chave_aqui

# Os secrets SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
# são configurados automaticamente pelo Supabase
```

#### 2A.6 Configurar Storage

No Supabase Dashboard:
1. Vá em Storage > New Bucket
2. Nome: `blog-images`, marque como **Public**
3. As policies RLS já foram criadas no schema acima

---

### Opção B — Supabase Self-Hosted (Docker)

#### 2B.1 Preparar Diretórios

```bash
mkdir -p /opt/supabase
cd /opt/supabase
```

#### 2B.2 Clonar Supabase Docker

```bash
git clone --depth 1 https://github.com/supabase/supabase
cp -r supabase/docker/* .
cp .env.example .env
```

#### 2B.3 Configurar .env do Supabase

Edite o arquivo `.env` e configure:
```env
POSTGRES_PASSWORD=sua_senha_segura_aqui
JWT_SECRET=seu_jwt_secret_super_longo_aqui_min_32_caracteres
ANON_KEY=gerar_via_jwt.io_com_role_anon
SERVICE_ROLE_KEY=gerar_via_jwt.io_com_role_service_role
SITE_URL=https://seudominio.com
API_EXTERNAL_URL=https://api.seudominio.com
```

Para gerar as chaves JWT, use [jwt.io](https://jwt.io) com o payload:
```json
// ANON_KEY
{
  "role": "anon",
  "iss": "supabase",
  "iat": 1700000000,
  "exp": 2000000000
}

// SERVICE_ROLE_KEY
{
  "role": "service_role",
  "iss": "supabase",
  "iat": 1700000000,
  "exp": 2000000000
}
```

#### 2B.4 Iniciar Supabase

```bash
docker compose up -d
```

#### 2B.5 Importar Schema e Dados

```bash
# Conectar ao PostgreSQL do Supabase self-hosted
psql "postgresql://postgres:SUA_SENHA@localhost:5432/postgres" < schema_dump.sql
```

---

## ETAPA 3 — Configuração da VPS

### 3.1 Estrutura de Diretórios

```
/opt/
├── bravion-global/              # Projeto principal
│   ├── docker-compose.yml       # Orquestração Docker
│   ├── Dockerfile               # Build do frontend
│   ├── nginx.conf               # Configuração Nginx
│   ├── .env.production          # Variáveis de produção
│   └── src/                     # Código-fonte (clonado do GitHub)
│
├── supabase/                    # (Apenas se self-hosted)
│   ├── docker-compose.yml
│   └── .env
│
└── ssl/                         # Certificados SSL (gerenciado pelo Certbot)
```

### 3.2 Instalar Dependências na VPS

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar Docker e Docker Compose (se não instalado)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install -y docker-compose-plugin

# Instalar Nginx
sudo apt install -y nginx

# Instalar Certbot para SSL
sudo apt install -y certbot python3-certbot-nginx

# Instalar Git
sudo apt install -y git
```

### 3.3 Clonar Projeto na VPS

```bash
cd /opt
git clone https://github.com/SEU_USUARIO/SEU_REPO.git bravion-global
cd bravion-global
```

### 3.4 Configurar Variáveis de Ambiente

```bash
cp .env.example .env.production
nano .env.production
```

Preencha com os valores reais:
```env
VITE_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_anon_key_aqui
VITE_SUPABASE_PROJECT_ID=seu_project_id_aqui
```

### 3.5 Configurar Nginx

```bash
sudo cp nginx.conf /etc/nginx/sites-available/bravion-global
sudo ln -s /etc/nginx/sites-available/bravion-global /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 3.6 Configurar SSL com Certbot

```bash
# Certifique-se que o DNS do domínio aponta para o IP da VPS
sudo certbot --nginx -d seudominio.com -d www.seudominio.com

# Verificar renovação automática
sudo certbot renew --dry-run
```

### 3.7 Apontar Domínio

No painel do seu provedor DNS:
1. Crie um registro **A** apontando `seudominio.com` → `IP_DA_VPS`
2. Crie um registro **A** apontando `www.seudominio.com` → `IP_DA_VPS`
3. (Opcional) Crie registro **AAAA** para IPv6

---

## ETAPA 4 — Deploy

### 4.1 Build do Projeto

```bash
cd /opt/bravion-global

# Instalar dependências
npm install

# Build de produção (usa variáveis do .env.production)
cp .env.production .env
npm run build

# Os arquivos finais estarão em /opt/bravion-global/dist/
```

### 4.2 Deploy com Docker

```bash
# Build e iniciar containers
docker compose up -d --build

# Verificar status
docker compose ps

# Verificar logs
docker compose logs -f
```

### 4.3 Deploy sem Docker (alternativa mais simples)

Se preferir não usar Docker para o frontend (já que é apenas um SPA estático):

```bash
# Build
npm run build

# Copiar arquivos para o diretório do Nginx
sudo cp -r dist/* /var/www/bravion-global/

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 4.4 Checklist de Validação Pós-Deploy

- [ ] **Site acessível** via `https://seudominio.com`
- [ ] **HTTPS funcionando** (cadeado verde no navegador)
- [ ] **Redirecionamento HTTP → HTTPS** funcionando
- [ ] **Landing page** carregando com todas as seções
- [ ] **Navegação** (menu hambúrguer, scroll suave, links)
- [ ] **Seletor de idioma** funcionando (EN ↔ PT)
- [ ] **Blog** listando posts publicados
- [ ] **Login/Registro** funcionando
- [ ] **Painel admin** acessível após login com role adequada
- [ ] **Criação de post** funcionando
- [ ] **Geração de texto IA** funcionando
- [ ] **Geração de imagem IA** funcionando
- [ ] **Upload de imagem** funcionando
- [ ] **Publicação de post** funcionando
- [ ] **Gerenciamento de categorias** funcionando
- [ ] **Responsividade** (testar em mobile)
- [ ] **Favicon e meta tags** corretos
- [ ] **Console do navegador** sem erros críticos

---

## ETAPA 5 — CI/CD com GitHub Actions

### 5.1 Configurar Secrets no GitHub

No repositório GitHub → Settings → Secrets → Actions, adicione:

| Secret | Valor |
|---|---|
| `VPS_HOST` | IP ou hostname da VPS |
| `VPS_USER` | Usuário SSH (ex: `deploy`) |
| `VPS_SSH_KEY` | Chave SSH privada para conexão |
| `VPS_PORT` | Porta SSH (padrão: 22) |

### 5.2 Criar Usuário de Deploy na VPS

```bash
# Criar usuário
sudo adduser deploy
sudo usermod -aG docker deploy

# Configurar SSH key
sudo -u deploy mkdir -p /home/deploy/.ssh
# Cole a chave pública em /home/deploy/.ssh/authorized_keys

# Dar permissão ao diretório do projeto
sudo chown -R deploy:deploy /opt/bravion-global
```

### 5.3 Pipeline de Deploy

O arquivo `.github/workflows/deploy.yml` (criado na Tarefa 4) faz automaticamente:
1. Checkout do código
2. Instalar dependências
3. Build de produção
4. Copiar arquivos para a VPS via SSH/SCP
5. Reiniciar containers Docker

---

## ⚠️ Pontos Importantes para Migração

### Lovable AI Gateway
A API `ai.gateway.lovable.dev` é **exclusiva do Lovable** e não funcionará fora da plataforma. Você tem duas opções:

**Opção 1 — Google AI Studio (Recomendado)**
1. Acesse [aistudio.google.com](https://aistudio.google.com)
2. Gere uma API Key
3. Substitua a URL nas Edge Functions:
   - De: `https://ai.gateway.lovable.dev/v1/chat/completions`
   - Para: `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`
4. Substitua o header de autenticação:
   - De: `Authorization: Bearer ${LOVABLE_API_KEY}`
   - Para: `Authorization: Bearer ${GOOGLE_AI_KEY}`
5. Configure o secret: `supabase secrets set GOOGLE_AI_KEY=sua_chave`

**Opção 2 — OpenAI API**
1. Acesse [platform.openai.com](https://platform.openai.com)
2. Gere uma API Key
3. Substitua a URL: `https://api.openai.com/v1/chat/completions`
4. Atualize os modelos nos Edge Functions
5. Configure o secret: `supabase secrets set OPENAI_API_KEY=sua_chave`

### Cron Job para Publicação Agendada
A função `publish-scheduled` precisa ser chamada periodicamente. Configure no Supabase:
```sql
-- No SQL Editor do Supabase
SELECT cron.schedule(
  'publish-scheduled-posts',
  '*/5 * * * *',  -- A cada 5 minutos
  $$
  SELECT net.http_post(
    url := 'https://SEU_PROJECT_ID.supabase.co/functions/v1/publish-scheduled',
    headers := '{"Authorization": "Bearer SUA_SERVICE_ROLE_KEY"}'::jsonb
  )
  $$
);
```

### Backup do Banco
```bash
# Exportar backup completo
pg_dump "postgresql://postgres:SENHA@db.PROJECT_ID.supabase.co:5432/postgres" > backup_$(date +%Y%m%d).sql

# Automatizar backup diário (cron)
echo "0 3 * * * pg_dump 'postgresql://...' > /opt/backups/bravion_\$(date +\%Y\%m\%d).sql" | crontab -
```
