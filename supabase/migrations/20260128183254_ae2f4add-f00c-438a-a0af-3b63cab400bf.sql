-- =====================================================
-- BLOG SYSTEM DATABASE SCHEMA
-- =====================================================

-- 1. ENUMS
-- =====================================================

-- Role types for user permissions
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'author', 'viewer');

-- Blog post status (state machine)
CREATE TYPE public.blog_post_status AS ENUM (
  'draft',
  'generating',
  'ready',
  'scheduled',
  'published',
  'failed',
  'archived',
  'deleted'
);

-- Job types for async tasks
CREATE TYPE public.blog_job_type AS ENUM (
  'generate_text',
  'generate_image',
  'publish_scheduled'
);

-- Job status
CREATE TYPE public.blog_job_status AS ENUM (
  'queued',
  'running',
  'success',
  'failed'
);

-- 2. USER ROLES TABLE (separate from profiles for security)
-- =====================================================

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. SECURITY DEFINER FUNCTION FOR ROLE CHECKS
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Helper: check if user has any of admin/editor roles
CREATE OR REPLACE FUNCTION public.is_admin_or_editor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'editor')
  )
$$;

-- Helper: check if user has any blog role
CREATE OR REPLACE FUNCTION public.has_any_blog_role(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'editor', 'author')
  )
$$;

-- 4. BLOG CATEGORIES
-- =====================================================

CREATE TABLE public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

-- 5. BLOG TAGS
-- =====================================================

CREATE TABLE public.blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;

-- 6. BLOG POSTS
-- =====================================================

CREATE TABLE public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  brief TEXT, -- briefing/description for AI
  excerpt TEXT, -- summary
  content_html TEXT, -- final rendered content
  content_json JSONB, -- for rich editor state
  status blog_post_status NOT NULL DEFAULT 'draft',
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  cover_image_url TEXT,
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  -- AI generation settings
  ai_tone TEXT, -- neutral, informal, professional, persuasive, educational
  ai_length TEXT, -- short, medium, long
  ai_target_audience TEXT,
  ai_keywords TEXT[], -- SEO keywords
  ai_language TEXT DEFAULT 'pt-BR'
);

CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_author ON public.blog_posts(author_id);
CREATE INDEX idx_blog_posts_scheduled ON public.blog_posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_blog_posts_published ON public.blog_posts(published_at) WHERE status = 'published';

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- 7. BLOG POST TAGS (JUNCTION)
-- =====================================================

CREATE TABLE public.blog_post_tags (
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES public.blog_tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (post_id, tag_id)
);

ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;

-- 8. BLOG JOBS (ASYNC TASK QUEUE)
-- =====================================================

CREATE TABLE public.blog_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type blog_job_type NOT NULL,
  post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE NOT NULL,
  status blog_job_status NOT NULL DEFAULT 'queued',
  payload JSONB, -- parameters
  result JSONB, -- response summary
  error_message TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_jobs_status ON public.blog_jobs(status);
CREATE INDEX idx_blog_jobs_post ON public.blog_jobs(post_id);

ALTER TABLE public.blog_jobs ENABLE ROW LEVEL SECURITY;

-- 9. AUDIT LOGS
-- =====================================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs(actor_user_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 10. TRIGGER FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_categories_updated_at
  BEFORE UPDATE ON public.blog_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 11. SLUG GENERATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_slug(title TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  slug TEXT;
BEGIN
  -- Lowercase, replace spaces with hyphens, remove special chars
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

-- 12. RLS POLICIES
-- =====================================================

-- USER ROLES POLICIES
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- BLOG CATEGORIES POLICIES
CREATE POLICY "Anyone can view categories"
  ON public.blog_categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin/Editor can manage categories"
  ON public.blog_categories FOR ALL
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()))
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

-- BLOG TAGS POLICIES
CREATE POLICY "Anyone can view tags"
  ON public.blog_tags FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin/Editor can manage tags"
  ON public.blog_tags FOR ALL
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()))
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

-- BLOG POSTS POLICIES
-- Public: only published posts visible
CREATE POLICY "Public can view published posts"
  ON public.blog_posts FOR SELECT
  TO anon
  USING (
    status = 'published'
    AND deleted_at IS NULL
    AND published_at <= now()
  );

-- Authenticated users can view published posts
CREATE POLICY "Authenticated can view published posts"
  ON public.blog_posts FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    AND deleted_at IS NULL
    AND published_at <= now()
  );

-- Admin/Editor can view all posts
CREATE POLICY "Admin/Editor can view all posts"
  ON public.blog_posts FOR SELECT
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()));

-- Authors can view their own posts
CREATE POLICY "Authors can view own posts"
  ON public.blog_posts FOR SELECT
  TO authenticated
  USING (
    author_id = auth.uid()
    AND public.has_role(auth.uid(), 'author')
  );

-- Admin/Editor/Author can create posts
CREATE POLICY "Blog roles can create posts"
  ON public.blog_posts FOR INSERT
  TO authenticated
  WITH CHECK (public.has_any_blog_role(auth.uid()));

-- Admin/Editor can update any post
CREATE POLICY "Admin/Editor can update any post"
  ON public.blog_posts FOR UPDATE
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()))
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

-- Authors can update their own posts (except publish)
CREATE POLICY "Authors can update own posts"
  ON public.blog_posts FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid()
    AND public.has_role(auth.uid(), 'author')
  )
  WITH CHECK (
    author_id = auth.uid()
    AND public.has_role(auth.uid(), 'author')
  );

-- Only Admin can delete
CREATE POLICY "Admin can delete posts"
  ON public.blog_posts FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- BLOG POST TAGS POLICIES
CREATE POLICY "Anyone can view post tags"
  ON public.blog_post_tags FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin/Editor can manage post tags"
  ON public.blog_post_tags FOR ALL
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()))
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

-- BLOG JOBS POLICIES
CREATE POLICY "Admin/Editor can view all jobs"
  ON public.blog_jobs FOR SELECT
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Authors can view own post jobs"
  ON public.blog_jobs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.blog_posts
      WHERE blog_posts.id = blog_jobs.post_id
        AND blog_posts.author_id = auth.uid()
    )
  );

CREATE POLICY "Admin/Editor can manage jobs"
  ON public.blog_jobs FOR ALL
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()))
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

-- AUDIT LOGS POLICIES
CREATE POLICY "Admin/Editor can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 13. STORAGE BUCKET FOR BLOG IMAGES
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Storage policies
CREATE POLICY "Anyone can view blog images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'blog-images');

CREATE POLICY "Blog roles can upload images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'blog-images'
    AND public.has_any_blog_role(auth.uid())
  );

CREATE POLICY "Admin/Editor can delete images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'blog-images'
    AND public.is_admin_or_editor(auth.uid())
  );

CREATE POLICY "Admin/Editor can update images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'blog-images'
    AND public.is_admin_or_editor(auth.uid())
  );