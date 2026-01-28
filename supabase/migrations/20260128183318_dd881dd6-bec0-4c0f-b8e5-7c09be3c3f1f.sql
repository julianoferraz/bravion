-- Fix security warnings: set search_path on functions

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix generate_slug function
CREATE OR REPLACE FUNCTION public.generate_slug(title TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  slug TEXT;
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

-- Fix audit_logs insert policy - restrict to authenticated users only
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (actor_user_id = auth.uid() OR public.is_admin_or_editor(auth.uid()));