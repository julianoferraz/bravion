# 🤖 Guia para Agente de IA — Bravion Global

## Resumo Executivo

Bravion Global é uma aplicação web SPA (Single Page Application) construída com **React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui**, com backend em **Supabase** (PostgreSQL + Edge Functions + Auth + Storage). O projeto consiste em um site institucional para uma empresa de marketing/representação na América Latina, com um **sistema de blog completo** que inclui geração de conteúdo por IA, gerenciamento de categorias e sistema de roles para autores/editores/admins.

**Documento de referência para agentes de IA e desenvolvedores.**
> Consulte este arquivo antes de implementar, corrigir ou atualizar qualquer parte do projeto.

Regra obrigatória: Antes de implementar, atualizar, modificar ou corrigir qualquer parte deste sistema, você deve consultar este arquivo localizado na raiz do projeto e seguir estritamente e à risca todas as instruções, diretrizes e padrões definidos nele. Nenhuma alteração deve ser feita sem antes ter lido e compreendido completamente o conteúdo desse arquivo. Qualquer decisão técnica, estrutural ou de fluxo deve estar em conformidade com o que está documentado aqui e ao final de cada seção, há um lembrete para consultar este guia novamente antes de prosseguir. O não cumprimento desta regra resultará em erros, inconsistências e falhas no sistema, pois este guia é a fonte definitiva de verdade para o projeto. Portanto, antes de qualquer ação, leia este arquivo cuidadosamente e mantenha-o como referência constante durante todo o processo de desenvolvimento e manutenção do sistema. O guia deve ser atualizado sempre que houver mudanças significativas, mas até lá, ele é a única fonte de verdade para todas as decisões relacionadas a este projeto.

🚀 Deploy e Ambiente

- Todo código editado deve ser salvo com Ctrl+S (auto-commit para GitHub automático)
- O deploy na VPS acontece automaticamente após o push (GitHub Actions)
- Aguardar 30 segundos após salvar para o deploy concluir

## ✅ Verificação do deploy

Após salvar e aguardar, verificar se funcionou:
1. Acessar a URL do projeto no navegador e  verificar os logs via terminal:
   ssh root@161.97.171.94 "docker logs NOME_CONTAINER --tail 20"
   ou
   ssh root@161.97.171.94 "pm2 logs NOME_PROJETO --lines 20"

---

## Padrões de Código

### Convenções de Nomenclatura
- **Componentes React**: PascalCase (ex: `AdminBlogEditor.tsx`)
- **Hooks**: camelCase com prefixo `use` (ex: `useAuth`, `useLanguage`)
- **Arquivos de página**: PascalCase em `src/pages/` (ex: `BlogPost.tsx`)
- **Funções utilitárias**: camelCase (ex: `generateSlug`)
- **Variáveis de estado**: camelCase (ex: `isLoading`, `coverImageUrl`)
- **Tipos/Interfaces**: PascalCase (ex: `BlogPost`, `Category`)
- **Edge Functions**: kebab-case para nomes de pasta (ex: `generate-text/`)
- **Tabelas do banco**: snake_case (ex: `blog_posts`, `user_roles`)
- **Colunas do banco**: snake_case (ex: `cover_image_url`, `published_at`)

### Estrutura de Componentes
```tsx
// 1. Imports (React, libs, componentes internos, hooks, types)
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";

// 2. Types/Interfaces locais
interface MyComponentProps { /* ... */ }

// 3. Componente (export default function ou const)
export default function MyComponent() {
  // 3a. Hooks
  const { user, canManageBlog } = useAuth();
  const { t } = useLanguage();
  
  // 3b. Estado local
  const [isLoading, setIsLoading] = useState(true);
  
  // 3c. Effects
  useEffect(() => { /* ... */ }, []);
  
  // 3d. Handlers
  const handleAction = async () => { /* ... */ };
  
  // 3e. Render
  return <div>...</div>;
}
```

### Padrão de Estilização
- **SEMPRE** usar tokens semânticos do Tailwind definidos em `src/index.css`
- **NUNCA** usar cores hardcoded (ex: `text-white`, `bg-black`)
- **SEMPRE** usar variáveis CSS: `text-foreground`, `bg-background`, `text-primary`, `bg-card`, `text-muted-foreground`, etc.
- Todas as cores devem ser HSL
- Componentes shadcn/ui estão em `src/components/ui/` — não editar manualmente

```tsx
// ✅ Correto
<div className="bg-card text-foreground border-border">
<p className="text-muted-foreground">

// ❌ Errado
<div className="bg-gray-900 text-white border-gray-700">
<p className="text-gray-400">
```

### Padrão de Internacionalização
- Todas as strings visíveis devem usar o sistema de traduções via `useLanguage()`
- Adicionar novas strings em ambos os idiomas em `src/i18n/translations.ts`

```tsx
const { t } = useLanguage();
// ✅
<h1>{t.admin.title}</h1>
// ❌
<h1>Title</h1>
```

---

## Como Adicionar uma Nova Feature

### 1. Definir escopo
- Identificar se precisa de novas tabelas/colunas no banco
- Identificar se precisa de novas Edge Functions
- Identificar se precisa de novas rotas
- Identificar se precisa de novas traduções

### 2. Banco de dados (se necessário)
- Criar migration SQL com tabelas + RLS policies
- Adicionar tipos correspondentes (atualizar via Supabase CLI)

### 3. Backend (se necessário)
- Criar Edge Function em `supabase/functions/nome-da-funcao/index.ts`
- Registrar em `supabase/config.toml` com `verify_jwt` adequado
- Configurar secrets necessários

### 4. Frontend
- Criar componentes em `src/components/`
- Criar páginas em `src/pages/`
- Adicionar rota em `src/App.tsx`
- Adicionar traduções em `src/i18n/translations.ts`

### 5. Testar
- Verificar RLS (acesso autenticado vs anônimo)
- Testar em ambos os idiomas
- Verificar responsividade (mobile + desktop)

---

## Como Adicionar uma Nova Rota/Página

1. **Criar o componente da página** em `src/pages/NomeDaPagina.tsx`
2. **Importar e adicionar a rota** em `src/App.tsx`:

```tsx
import NovaPagina from "./pages/NovaPagina";

// Dentro de <Routes>:
<Route path="/nova-pagina" element={<NovaPagina />} />
```

3. **Se for página admin**, adicionar verificação de permissão:
```tsx
useEffect(() => {
  if (!canManageBlog) {
    navigate("/login");
  }
}, [canManageBlog]);
```

4. **Adicionar link de navegação** se necessário (em `Navbar.tsx` ou onde aplicável)
5. **Adicionar traduções** para textos da nova página

---

## Como Adicionar uma Nova Tabela ou Coluna

### Nova Tabela
```sql
-- 1. Criar tabela
CREATE TABLE public.nome_tabela (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- se for dados por usuário
  -- colunas...
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.nome_tabela ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas RLS apropriadas
CREATE POLICY "Descrição da política"
ON public.nome_tabela
FOR SELECT
USING (/* condição */);

-- 4. Trigger para updated_at (opcional)
CREATE TRIGGER update_nome_tabela_updated_at
BEFORE UPDATE ON public.nome_tabela
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
```

### Nova Coluna
```sql
ALTER TABLE public.nome_tabela
ADD COLUMN nova_coluna TEXT DEFAULT 'valor_default';
```

### Após alterações no banco:
- Os types em `src/integrations/supabase/types.ts` serão regenerados automaticamente pelo Supabase
- Aguardar regeneração antes de usar os novos tipos no código

---

## Como Adicionar uma Nova Integração Externa

1. **Criar Edge Function** em `supabase/functions/nome-integracao/index.ts`
2. **Registrar** em `supabase/config.toml`:
```toml
[functions.nome-integracao]
verify_jwt = false  # ou true, dependendo do caso
```
3. **Adicionar secrets** necessários (chaves de API)
4. **Implementar a lógica** seguindo o padrão existente:
   - CORS headers
   - Validação de auth (se aplicável)
   - Try/catch com erro estruturado
   - Audit log (se aplicável)
5. **Chamar do frontend**:
```tsx
const { data, error } = await supabase.functions.invoke("nome-integracao", {
  body: { /* payload */ },
});
```

---

## O que NUNCA Modificar Sem Análise Cuidadosa

### ⛔ Arquivos Auto-Gerados (NÃO editar)
- `src/integrations/supabase/client.ts` — Cliente Supabase
- `src/integrations/supabase/types.ts` — Types do banco
- `.env` — Variáveis de ambiente
- `supabase/migrations/` — Migrations executadas

### ⚠️ Arquivos Críticos (editar com cuidado)
- `src/contexts/AuthContext.tsx` — Lógica de autenticação e roles
- `src/i18n/LanguageContext.tsx` — Provider de idioma
- `src/index.css` — Design tokens (impacta todo o visual)
- `tailwind.config.ts` — Configuração de temas
- `supabase/config.toml` — Configuração das Edge Functions
- Políticas RLS no banco — Segurança de dados

### ⚠️ Lógica de Negócio Crítica
- Hierarquia de roles (`has_role`, `is_admin_or_editor`, `has_any_blog_role`)
- Fluxo de publicação agendada (`publish-scheduled`)
- Soft delete de posts (campo `deleted_at`)
- Geração de slug único

---

## Dependências Críticas e Relações

```
App.tsx
├── LanguageProvider (i18n/LanguageContext.tsx)
│   └── detect-language Edge Function
├── AuthProvider (contexts/AuthContext.tsx)
│   └── Supabase Auth + user_roles table
├── BrowserRouter (react-router-dom)
│   ├── Index → Navbar, Hero, About, Services, Industries, WhyChoose, Contact, Footer
│   ├── Blog → supabase(blog_posts, blog_categories)
│   ├── BlogPost → supabase(blog_posts, blog_categories)
│   ├── Login → AuthContext.signIn
│   ├── Register → AuthContext.signUp
│   ├── AdminBlog → AuthContext.canManageBlog + supabase(blog_posts)
│   ├── AdminBlogEditor → RichTextEditor + supabase(blog_posts, blog_categories) + Edge Functions
│   └── AdminCategories → supabase(blog_categories)
```

---

## Comandos Úteis

```bash
# Desenvolvimento local
npm install          # Instalar dependências
npm run dev          # Iniciar servidor de desenvolvimento (porta 8080)
npm run build        # Build de produção
npm run preview      # Preview do build de produção

# Linting
npm run lint         # Verificar erros de lint

# Supabase CLI (se instalado)
supabase start       # Iniciar Supabase local
supabase db push     # Aplicar migrations
supabase functions serve  # Servir Edge Functions localmente
supabase functions deploy # Fazer deploy das Edge Functions
supabase gen types typescript --local > src/integrations/supabase/types.ts  # Regenerar types
```

---

## Padrão de Edge Function

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // 1. CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 2. Autenticação (se necessário)
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );

    // 3. Lógica principal
    const body = await req.json();
    // ... processar

    // 4. Resposta de sucesso
    return new Response(JSON.stringify({ success: true, data: {} }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    // 5. Tratamento de erro
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

---

## Checklist para Pull Requests

- [ ] Novas strings de UI estão em ambos os idiomas (EN/PT)?
- [ ] Cores usam tokens semânticos (não hardcoded)?
- [ ] Componentes responsivos (mobile + desktop)?
- [ ] RLS policies adequadas para novas tabelas?
- [ ] Edge Functions com CORS e tratamento de erro?
- [ ] Audit log para ações administrativas?
- [ ] Types do Supabase atualizados?
