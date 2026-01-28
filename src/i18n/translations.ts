export type Language = "en" | "pt";

export interface Translations {
  // Navigation
  nav: {
    home: string;
    about: string;
    services: string;
    industries: string;
    blog: string;
    contact: string;
    admin: string;
  };
  // Hero
  hero: {
    headline: string;
    subheadline: string;
    cta: string;
  };
  // About
  about: {
    title: string;
    description: string;
  };
  // Services
  services: {
    title: string;
    subtitle: string;
    items: {
      support: { title: string; description: string };
      creative: { title: string; description: string };
      content: { title: string; description: string };
      ads: { title: string; description: string };
      partnerships: { title: string; description: string };
    };
  };
  // Industries
  industries: {
    title: string;
    subtitle: string;
    items: {
      saas: string;
      proxy: string;
      betting: string;
      apps: string;
      digital: string;
    };
  };
  // Why Choose
  whyChoose: {
    title: string;
    items: string[];
  };
  // Contact
  contact: {
    title: string;
    subtitle: string;
    form: {
      name: string;
      company: string;
      email: string;
      message: string;
      submit: string;
      success: string;
    };
  };
  // Blog
  blog: {
    title: string;
    subtitle: string;
    readMore: string;
    minRead: string;
    search: string;
    categories: string;
    tags: string;
    allCategories: string;
    noPosts: string;
    by: string;
    sharePost: string;
    relatedPosts: string;
  };
  // Footer
  footer: {
    rights: string;
    privacy: string;
    terms: string;
  };
  // Auth
  auth: {
    login: string;
    logout: string;
    register: string;
    email: string;
    password: string;
    confirmPassword: string;
    forgotPassword: string;
    noAccount: string;
    hasAccount: string;
    loginSuccess: string;
    registerSuccess: string;
    error: string;
  };
  // Admin
  admin: {
    dashboard: string;
    posts: string;
    newPost: string;
    editPost: string;
    settings: string;
    title: string;
    slug: string;
    status: string;
    author: string;
    actions: string;
    save: string;
    saveDraft: string;
    publish: string;
    schedule: string;
    generateText: string;
    generateImage: string;
    preview: string;
    archive: string;
    delete: string;
    confirmDelete: string;
    brief: string;
    content: string;
    excerpt: string;
    category: string;
    categories: string;
    categoriesDescription: string;
    newCategory: string;
    editCategory: string;
    coverImage: string;
    seo: string;
    metaTitle: string;
    metaDescription: string;
    scheduledFor: string;
    publishedAt: string;
    aiSettings: string;
    tone: string;
    length: string;
    targetAudience: string;
    keywords: string;
    generating: string;
    uploadImage: string;
    visualEditor: string;
    htmlEditor: string;
    statuses: {
      draft: string;
      generating: string;
      ready: string;
      scheduled: string;
      published: string;
      failed: string;
      archived: string;
    };
    tones: {
      neutral: string;
      informal: string;
      professional: string;
      persuasive: string;
      educational: string;
    };
    lengths: {
      short: string;
      medium: string;
      long: string;
    };
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    nav: {
      home: "Home",
      about: "About",
      services: "Services",
      industries: "Industries",
      blog: "Blog",
      contact: "Contact",
      admin: "Admin",
    },
    hero: {
      headline: "Your Gateway to Latin America.",
      subheadline:
        "Bravion Global helps international companies expand into Brazil and Latin America with local teams, creative power, and marketing expertise.",
      cta: "Partner With Us",
    },
    about: {
      title: "About Bravion Global",
      description:
        "Based in Brazil, Bravion Global represents international companies that want to establish, promote, and grow their operations in Latin America. Our multicultural team bridges global innovation with local expertise, helping tech brands connect with millions of new users.",
    },
    services: {
      title: "What We Do",
      subtitle: "Complete solutions to establish your brand in Latin America",
      items: {
        support: {
          title: "Local Representation & Support",
          description:
            "We represent your brand with customer service in Portuguese and Spanish for the Latin audience.",
        },
        creative: {
          title: "Creative Design & Video Production",
          description:
            "Professional visual content and campaigns adapted to local culture.",
        },
        content: {
          title: "Copywriting & Content Creation",
          description:
            "SEO-optimized texts, captions and articles tailored to the Brazilian market.",
        },
        ads: {
          title: "Social Media Ads & Campaign Management",
          description:
            "Planning, setup and optimization of campaigns on Facebook, Google and TikTok Ads.",
        },
        partnerships: {
          title: "Affiliate & Partnership Acquisition",
          description:
            "We connect your company with influencers, affiliates and business partners in Brazil and Latin America.",
        },
      },
    },
    industries: {
      title: "Industries We Serve",
      subtitle: "Specialized experience in technology and digital sectors",
      items: {
        saas: "SaaS & Software Companies",
        proxy: "Proxy & Multilogin Platforms",
        betting: "Betting & Gaming Brands",
        apps: "Mobile Apps & Tech Startups",
        digital: "Digital Product Businesses",
      },
    },
    whyChoose: {
      title: "Why Choose Bravion Global",
      items: [
        "Local expertise in Brazil and Latin America",
        "Complete creative and operational team",
        "Fast communication in English, Portuguese, and Spanish",
        "Experience with technology and betting sectors",
        "Cost-effective outsourcing model",
      ],
    },
    contact: {
      title: "Let's Connect",
      subtitle:
        "Ready to expand your business into Latin America? Let Bravion Global be your local partner.",
      form: {
        name: "Your Name",
        company: "Company",
        email: "Email",
        message: "Message",
        submit: "Send Message",
        success: "Message sent successfully! We'll get back to you soon.",
      },
    },
    blog: {
      title: "Blog",
      subtitle: "Insights, news and tips about expanding to Latin America",
      readMore: "Read More",
      minRead: "min read",
      search: "Search articles...",
      categories: "Categories",
      tags: "Tags",
      allCategories: "All Categories",
      noPosts: "No posts found",
      by: "By",
      sharePost: "Share this post",
      relatedPosts: "Related Posts",
    },
    footer: {
      rights: "All rights reserved.",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
    },
    auth: {
      login: "Login",
      logout: "Logout",
      register: "Register",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      forgotPassword: "Forgot password?",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      loginSuccess: "Login successful!",
      registerSuccess: "Registration successful!",
      error: "An error occurred. Please try again.",
    },
    admin: {
      dashboard: "Dashboard",
      posts: "Posts",
      newPost: "New Post",
      editPost: "Edit Post",
      settings: "Settings",
      title: "Title",
      slug: "Slug",
      status: "Status",
      author: "Author",
      actions: "Actions",
      save: "Save",
      saveDraft: "Save Draft",
      publish: "Publish Now",
      schedule: "Schedule",
      generateText: "Generate with AI",
      generateImage: "Generate Cover",
      preview: "Preview",
      archive: "Archive",
      delete: "Delete",
      confirmDelete: "Are you sure you want to delete this post?",
      brief: "Brief / Description",
      content: "Content",
      excerpt: "Excerpt",
      category: "Category",
      categories: "Categories",
      categoriesDescription: "Manage blog categories",
      newCategory: "New Category",
      editCategory: "Edit Category",
      coverImage: "Cover Image",
      seo: "SEO Settings",
      metaTitle: "Meta Title",
      metaDescription: "Meta Description",
      scheduledFor: "Scheduled for",
      publishedAt: "Published at",
      aiSettings: "AI Generation Settings",
      tone: "Tone",
      length: "Length",
      targetAudience: "Target Audience",
      keywords: "SEO Keywords",
      generating: "Generating...",
      uploadImage: "Upload Image",
      visualEditor: "Visual",
      htmlEditor: "HTML",
      statuses: {
        draft: "Draft",
        generating: "Generating",
        ready: "Ready",
        scheduled: "Scheduled",
        published: "Published",
        failed: "Failed",
        archived: "Archived",
      },
      tones: {
        neutral: "Neutral",
        informal: "Informal",
        professional: "Professional",
        persuasive: "Persuasive",
        educational: "Educational",
      },
      lengths: {
        short: "Short (500-800 words)",
        medium: "Medium (1000-1500 words)",
        long: "Long (2000-3000 words)",
      },
    },
  },
  pt: {
    nav: {
      home: "Início",
      about: "Sobre",
      services: "Serviços",
      industries: "Setores",
      blog: "Blog",
      contact: "Contato",
      admin: "Admin",
    },
    hero: {
      headline: "Sua Porta de Entrada para a América Latina.",
      subheadline:
        "A Bravion Global ajuda empresas internacionais a expandir para o Brasil e América Latina com equipes locais, poder criativo e expertise em marketing.",
      cta: "Seja Nosso Parceiro",
    },
    about: {
      title: "Sobre a Bravion Global",
      description:
        "Sediada no Brasil, a Bravion Global representa empresas internacionais que desejam estabelecer, promover e expandir suas operações na América Latina. Nossa equipe multicultural conecta inovação global com expertise local, ajudando marcas de tecnologia a alcançar milhões de novos usuários.",
    },
    services: {
      title: "O Que Fazemos",
      subtitle: "Soluções completas para estabelecer sua marca na América Latina",
      items: {
        support: {
          title: "Representação & Suporte Local",
          description:
            "Representamos sua marca com atendimento ao cliente em português e espanhol para o público latino.",
        },
        creative: {
          title: "Design Criativo & Produção de Vídeo",
          description:
            "Conteúdo visual profissional e campanhas adaptadas à cultura local.",
        },
        content: {
          title: "Redação & Criação de Conteúdo",
          description:
            "Textos otimizados para SEO, legendas e artigos adaptados ao mercado brasileiro.",
        },
        ads: {
          title: "Anúncios em Redes Sociais & Gestão de Campanhas",
          description:
            "Planejamento, configuração e otimização de campanhas no Facebook, Google e TikTok Ads.",
        },
        partnerships: {
          title: "Captação de Afiliados & Parcerias",
          description:
            "Conectamos sua empresa a influenciadores, afiliados e parceiros comerciais no Brasil e América Latina.",
        },
      },
    },
    industries: {
      title: "Setores que Atendemos",
      subtitle: "Experiência especializada em tecnologia e setores digitais",
      items: {
        saas: "Empresas SaaS & Software",
        proxy: "Plataformas de Proxy & Multilogin",
        betting: "Marcas de Apostas & Gaming",
        apps: "Apps Mobile & Startups Tech",
        digital: "Negócios de Produtos Digitais",
      },
    },
    whyChoose: {
      title: "Por Que Escolher a Bravion Global",
      items: [
        "Expertise local no Brasil e América Latina",
        "Equipe criativa e operacional completa",
        "Comunicação rápida em inglês, português e espanhol",
        "Experiência com setores de tecnologia e apostas",
        "Modelo de terceirização com custo-benefício",
      ],
    },
    contact: {
      title: "Vamos Conversar",
      subtitle:
        "Pronto para expandir seu negócio para a América Latina? Deixe a Bravion Global ser seu parceiro local.",
      form: {
        name: "Seu Nome",
        company: "Empresa",
        email: "E-mail",
        message: "Mensagem",
        submit: "Enviar Mensagem",
        success: "Mensagem enviada com sucesso! Retornaremos em breve.",
      },
    },
    blog: {
      title: "Blog",
      subtitle: "Insights, notícias e dicas sobre expansão para a América Latina",
      readMore: "Leia Mais",
      minRead: "min de leitura",
      search: "Buscar artigos...",
      categories: "Categorias",
      tags: "Tags",
      allCategories: "Todas as Categorias",
      noPosts: "Nenhum post encontrado",
      by: "Por",
      sharePost: "Compartilhar este post",
      relatedPosts: "Posts Relacionados",
    },
    footer: {
      rights: "Todos os direitos reservados.",
      privacy: "Política de Privacidade",
      terms: "Termos de Serviço",
    },
    auth: {
      login: "Entrar",
      logout: "Sair",
      register: "Cadastrar",
      email: "E-mail",
      password: "Senha",
      confirmPassword: "Confirmar Senha",
      forgotPassword: "Esqueceu a senha?",
      noAccount: "Não tem uma conta?",
      hasAccount: "Já tem uma conta?",
      loginSuccess: "Login realizado com sucesso!",
      registerSuccess: "Cadastro realizado com sucesso!",
      error: "Ocorreu um erro. Tente novamente.",
    },
    admin: {
      dashboard: "Painel",
      posts: "Posts",
      newPost: "Novo Post",
      editPost: "Editar Post",
      settings: "Configurações",
      title: "Título",
      slug: "Slug",
      status: "Status",
      author: "Autor",
      actions: "Ações",
      save: "Salvar",
      saveDraft: "Salvar Rascunho",
      publish: "Publicar Agora",
      schedule: "Agendar",
      generateText: "Gerar com IA",
      generateImage: "Gerar Capa",
      preview: "Visualizar",
      archive: "Arquivar",
      delete: "Excluir",
      confirmDelete: "Tem certeza que deseja excluir este post?",
      brief: "Briefing / Descrição",
      content: "Conteúdo",
      excerpt: "Resumo",
      category: "Categoria",
      categories: "Categorias",
      categoriesDescription: "Gerenciar categorias do blog",
      newCategory: "Nova Categoria",
      editCategory: "Editar Categoria",
      coverImage: "Imagem de Capa",
      seo: "Configurações de SEO",
      metaTitle: "Meta Título",
      metaDescription: "Meta Descrição",
      scheduledFor: "Agendado para",
      publishedAt: "Publicado em",
      aiSettings: "Configurações de Geração com IA",
      tone: "Tom",
      length: "Tamanho",
      targetAudience: "Público-alvo",
      keywords: "Palavras-chave SEO",
      generating: "Gerando...",
      uploadImage: "Enviar Imagem",
      visualEditor: "Visual",
      htmlEditor: "HTML",
      statuses: {
        draft: "Rascunho",
        generating: "Gerando",
        ready: "Pronto",
        scheduled: "Agendado",
        published: "Publicado",
        failed: "Falhou",
        archived: "Arquivado",
      },
      tones: {
        neutral: "Neutro",
        informal: "Informal",
        professional: "Profissional",
        persuasive: "Persuasivo",
        educational: "Educativo",
      },
      lengths: {
        short: "Curto (500-800 palavras)",
        medium: "Médio (1000-1500 palavras)",
        long: "Longo (2000-3000 palavras)",
      },
    },
  },
};
