-- ============================================
-- Bravion Global — Schema Fix
-- Handles conflicts with existing kolmanager data
-- ============================================

-- Add missing values to existing app_role enum
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'author';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create user_roles table (was failing because enum didn't have the values)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Now recreate the functions that depend on user_roles
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

-- Add missing columns to audit_logs for Bravion compatibility
DO $$ BEGIN
  ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor_user_id UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_type TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_id UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS details JSONB;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Now create the RLS policies that depend on the functions
-- user_roles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- blog_categories policies (recreate failed ones)
DROP POLICY IF EXISTS "Admin/Editor can manage categories" ON public.blog_categories;
CREATE POLICY "Admin/Editor can manage categories" ON public.blog_categories FOR ALL USING (is_admin_or_editor(auth.uid())) WITH CHECK (is_admin_or_editor(auth.uid()));

-- blog_posts policies (recreate failed ones)
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

-- blog_tags policies
DROP POLICY IF EXISTS "Admin/Editor can manage tags" ON public.blog_tags;
CREATE POLICY "Admin/Editor can manage tags" ON public.blog_tags FOR ALL USING (is_admin_or_editor(auth.uid())) WITH CHECK (is_admin_or_editor(auth.uid()));

-- blog_post_tags policies
DROP POLICY IF EXISTS "Admin/Editor can manage post tags" ON public.blog_post_tags;
CREATE POLICY "Admin/Editor can manage post tags" ON public.blog_post_tags FOR ALL USING (is_admin_or_editor(auth.uid())) WITH CHECK (is_admin_or_editor(auth.uid()));

-- blog_jobs policies
DROP POLICY IF EXISTS "Admin/Editor can view all jobs" ON public.blog_jobs;
CREATE POLICY "Admin/Editor can view all jobs" ON public.blog_jobs FOR SELECT USING (is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Admin/Editor can manage jobs" ON public.blog_jobs;
CREATE POLICY "Admin/Editor can manage jobs" ON public.blog_jobs FOR ALL USING (is_admin_or_editor(auth.uid())) WITH CHECK (is_admin_or_editor(auth.uid()));

-- audit_logs policies
DROP POLICY IF EXISTS "Admin/Editor can view audit logs" ON public.audit_logs;
CREATE POLICY "Admin/Editor can view audit logs" ON public.audit_logs FOR SELECT USING (is_admin_or_editor(auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (actor_user_id = auth.uid() OR is_admin_or_editor(auth.uid()));
