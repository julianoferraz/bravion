-- ============================================
-- Bravion Global — Database Schema
-- Para Supabase Self-Hosted
-- ============================================

-- ============================================
-- ENUMS (usar DO block para ignorar se já existem)
-- ============================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'author', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.blog_post_status AS ENUM ('draft', 'generating', 'ready', 'scheduled', 'published', 'failed', 'archived', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.blog_job_type AS ENUM ('generate_text', 'generate_image', 'publish_scheduled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.blog_job_status AS ENUM ('queued', 'running', 'success', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blog_posts (
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

CREATE TABLE IF NOT EXISTS public.blog_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blog_post_tags (
  post_id UUID NOT NULL REFERENCES public.blog_posts(id),
  tag_id UUID NOT NULL REFERENCES public.blog_tags(id),
  PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.blog_jobs (
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

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- TRIGGERS para updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_blog_categories_updated_at ON public.blog_categories;
CREATE TRIGGER update_blog_categories_updated_at
BEFORE UPDATE ON public.blog_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES - blog_categories
-- ============================================
DROP POLICY IF EXISTS "Anyone can view categories" ON public.blog_categories;
CREATE POLICY "Anyone can view categories" ON public.blog_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin/Editor can manage categories" ON public.blog_categories;
CREATE POLICY "Admin/Editor can manage categories" ON public.blog_categories FOR ALL USING (is_admin_or_editor(auth.uid())) WITH CHECK (is_admin_or_editor(auth.uid()));

-- ============================================
-- RLS POLICIES - blog_posts
-- ============================================
DROP POLICY IF EXISTS "Public can view published posts" ON public.blog_posts;
CREATE POLICY "Public can view published posts" ON public.blog_posts FOR SELECT USING (status = 'published' AND deleted_at IS NULL AND published_at <= now());

DROP POLICY IF EXISTS "Admin/Editor can view all posts" ON public.blog_posts;
CREATE POLICY "Admin/Editor can view all posts" ON public.blog_posts FOR SELECT USING (is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Authors can view own posts" ON public.blog_posts;
CREATE POLICY "Authors can view own posts" ON public.blog_posts FOR SELECT USING (author_id = auth.uid() AND has_role(auth.uid(), 'author'));

DROP POLICY IF EXISTS "Blog roles can create posts" ON public.blog_posts;
CREATE POLICY "Blog roles can create posts" ON public.blog_posts FOR INSERT WITH CHECK (has_any_blog_role(auth.uid()));

DROP POLICY IF EXISTS "Admin/Editor can update any post" ON public.blog_posts;
CREATE POLICY "Admin/Editor can update any post" ON public.blog_posts FOR UPDATE USING (is_admin_or_editor(auth.uid())) WITH CHECK (is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Authors can update own posts" ON public.blog_posts;
CREATE POLICY "Authors can update own posts" ON public.blog_posts FOR UPDATE USING (author_id = auth.uid() AND has_role(auth.uid(), 'author')) WITH CHECK (author_id = auth.uid() AND has_role(auth.uid(), 'author'));

DROP POLICY IF EXISTS "Admin can delete posts" ON public.blog_posts;
CREATE POLICY "Admin can delete posts" ON public.blog_posts FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES - blog_tags
-- ============================================
DROP POLICY IF EXISTS "Anyone can view tags" ON public.blog_tags;
CREATE POLICY "Anyone can view tags" ON public.blog_tags FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin/Editor can manage tags" ON public.blog_tags;
CREATE POLICY "Admin/Editor can manage tags" ON public.blog_tags FOR ALL USING (is_admin_or_editor(auth.uid())) WITH CHECK (is_admin_or_editor(auth.uid()));

-- ============================================
-- RLS POLICIES - blog_post_tags
-- ============================================
DROP POLICY IF EXISTS "Anyone can view post tags" ON public.blog_post_tags;
CREATE POLICY "Anyone can view post tags" ON public.blog_post_tags FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin/Editor can manage post tags" ON public.blog_post_tags;
CREATE POLICY "Admin/Editor can manage post tags" ON public.blog_post_tags FOR ALL USING (is_admin_or_editor(auth.uid())) WITH CHECK (is_admin_or_editor(auth.uid()));

-- ============================================
-- RLS POLICIES - blog_jobs
-- ============================================
DROP POLICY IF EXISTS "Admin/Editor can view all jobs" ON public.blog_jobs;
CREATE POLICY "Admin/Editor can view all jobs" ON public.blog_jobs FOR SELECT USING (is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Admin/Editor can manage jobs" ON public.blog_jobs;
CREATE POLICY "Admin/Editor can manage jobs" ON public.blog_jobs FOR ALL USING (is_admin_or_editor(auth.uid())) WITH CHECK (is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Authors can view own post jobs" ON public.blog_jobs;
CREATE POLICY "Authors can view own post jobs" ON public.blog_jobs FOR SELECT USING (EXISTS (SELECT 1 FROM blog_posts WHERE blog_posts.id = blog_jobs.post_id AND blog_posts.author_id = auth.uid()));

-- ============================================
-- RLS POLICIES - audit_logs
-- ============================================
DROP POLICY IF EXISTS "Admin/Editor can view audit logs" ON public.audit_logs;
CREATE POLICY "Admin/Editor can view audit logs" ON public.audit_logs FOR SELECT USING (is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (actor_user_id = auth.uid() OR is_admin_or_editor(auth.uid()));

-- ============================================
-- STORAGE
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view blog images" ON storage.objects;
CREATE POLICY "Public can view blog images" ON storage.objects FOR SELECT USING (bucket_id = 'blog-images');

DROP POLICY IF EXISTS "Authenticated users can upload blog images" ON storage.objects;
CREATE POLICY "Authenticated users can upload blog images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'blog-images' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update blog images" ON storage.objects;
CREATE POLICY "Authenticated users can update blog images" ON storage.objects FOR UPDATE USING (bucket_id = 'blog-images' AND auth.role() = 'authenticated');
