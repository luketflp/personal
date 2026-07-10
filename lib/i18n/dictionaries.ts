export type Language = 'pt' | 'en' | 'es'

export type Dictionary = {
  role: string
  nav: {
    about: string
    skills: string
    projects: string

    contact: string
  }
  theme: {
    light: string
    dark: string
    system: string
  }
  hero: {
    description: string
    getInTouch: string
    viewWork: string
  }
  about: {
    title: string
    paragraph1: string
    paragraph2: string
  }
  skills: {
    title: string
    description: string
    frontend: {
      title: string
      description: string
    }
    backend: {
      title: string
      description: string
    }
    tools: {
      title: string
      description: string
    }
  }
  projects: {
    title: string
    description: string
  }
  contact: {
    title: string
    description: string
    emailMe: string
    linkedin: string
  }
  quoteRequest: {
    title: string
    description: string
    name: string
    email: string
    phone: string
    phoneInvalid: string
    message: string
    submit: string
    sending: string
    success: string
    error: string
  }
  footer: {
    rights: string
  }
}

export const dictionaries: Record<Language, Dictionary> = {
  pt: {
    role: 'Engenheiro de Software',
    nav: {
      about: 'Sobre',
      skills: 'Habilidades',
      projects: 'Projetos',

      contact: 'Contato',
    },
    theme: {
      light: 'Claro',
      dark: 'Escuro',
      system: 'Sistema',
    },
    hero: {
      description:
        'Engenheiro full-stack construindo produtos web completos, de ponta a ponta.',
      getInTouch: 'Entre em Contato',
      viewWork: 'Ver Meu Trabalho',
    },
    about: {
      title: 'Sobre Mim',
      paragraph1:
        'Comecei a mexer com código ainda adolescente, configurando plugins em um servidor de Minecraft que eu mantinha — foi ali que peguei gosto por resolver problemas com programação. Hoje sou engenheiro full-stack com 6 anos de experiência, a maior parte em marketplaces com pagamentos: fluxos de reserva, precificação, checkout e reconciliação. Na Binamik, evoluí de estagiário a engenheiro full-stack, revisei mais de 2.000 PRs e mentorei desenvolvedores mais juniors.',
      paragraph2:
        'Construí sozinho um SaaS completo — backend, frontend, infraestrutura e checkout — usado por clientes reais. Mais recentemente, venho criando ferramentas com LLMs sobre esses sistemas, como um agente que responde perguntas de disponibilidade em linguagem natural.',
    },
    skills: {
      title: 'Habilidades & Especialidades',
      description:
        'Aqui estão algumas das tecnologias e ferramentas com as quais trabalho regularmente.',
      frontend: {
        title: 'Desenvolvimento Frontend',
        description: 'React, Next.js, TypeScript, Tailwind CSS',
      },
      backend: {
        title: 'Backend & Pagamentos',
        description:
          'Ruby on Rails, Python (FastAPI, Flask), Node.js, PostgreSQL, Redis, Sidekiq, Braspag, Pagar.me, Pix',
      },
      tools: {
        title: 'Infra & IA',
        description:
          'Kubernetes (GKE), AWS (Lambda, S3), GCP, Vercel, CI/CD, agentes LLM (GPT), n8n, MCP',
      },
    },
    projects: {
      title: 'Meus Projetos',
      description:
        'Aqui estão alguns dos projetos em que trabalhei recentemente.',
    },
    contact: {
      title: 'Entre em Contato',
      description:
        'Sinta-se à vontade para entrar em contato se tiver alguma pergunta ou quiser trabalhar junto.',
      emailMe: 'Me Envie um Email',
      linkedin: 'LinkedIn',
    },
    quoteRequest: {
      title: 'Envie uma mensagem',
      description: 'Conte o que você precisa e eu retorno em breve.',
      name: 'Nome',
      email: 'E-mail',
      phone: 'Telefone (opcional)',
      phoneInvalid: 'Telefone inválido',
      message: 'Mensagem',
      submit: 'Enviar mensagem',
      sending: 'Enviando…',
      success: 'Mensagem enviada! Retorno em breve.',
      error: 'Não foi possível enviar. Tente novamente.',
    },
    footer: {
      rights: 'Todos os direitos reservados.',
    },
  },
  en: {
    role: 'Software Engineer',
    nav: {
      about: 'About',
      skills: 'Skills',
      projects: 'Projects',

      contact: 'Contact',
    },
    theme: {
      light: 'Light',
      dark: 'Dark',
      system: 'System',
    },
    hero: {
      description:
        'Full-stack engineer building complete web products, end to end.',
      getInTouch: 'Get in Touch',
      viewWork: 'View My Work',
    },
    about: {
      title: 'About Me',
      paragraph1:
        "I started tinkering with code as a teenager, configuring plugins on a Minecraft server I ran — that's where I got hooked on solving problems with programming. Today I'm a full-stack engineer with 6 years of experience, most of it on marketplaces with payments: booking flows, pricing, checkout, and reconciliation. At Binamik, I grew from backend intern to full-stack engineer, reviewed 2,000+ PRs, and mentored more junior developers.",
      paragraph2:
        "I built a complete SaaS product solo — backend, frontend, infrastructure, and checkout — used by real customers. More recently I've been building LLM-powered tooling on top of these systems, like an agent that answers availability questions in natural language.",
    },
    skills: {
      title: 'Skills & Expertise',
      description:
        'Here are some of the technologies and tools I work with regularly.',
      frontend: {
        title: 'Frontend Development',
        description: 'React, Next.js, TypeScript, Tailwind CSS',
      },
      backend: {
        title: 'Backend & Payments',
        description:
          'Ruby on Rails, Python (FastAPI, Flask), Node.js, PostgreSQL, Redis, Sidekiq, Braspag, Pagar.me, Pix',
      },
      tools: {
        title: 'Infrastructure & AI',
        description:
          'Kubernetes (GKE), AWS (Lambda, S3), GCP, Vercel, CI/CD, LLM agents (GPT), n8n, MCP',
      },
    },
    projects: {
      title: 'My Projects',
      description: "Here are some of the projects I've worked on recently.",
    },
    contact: {
      title: 'Get in Touch',
      description:
        'Feel free to reach out if you have any questions or want to work together.',
      emailMe: 'Email Me',
      linkedin: 'LinkedIn',
    },
    quoteRequest: {
      title: 'Send a message',
      description: 'Tell me what you need and I’ll get back to you soon.',
      name: 'Name',
      email: 'Email',
      phone: 'Phone (optional)',
      phoneInvalid: 'Invalid phone number',
      message: 'Message',
      submit: 'Send message',
      sending: 'Sending…',
      success: 'Message sent! I’ll be in touch soon.',
      error: 'Could not send. Please try again.',
    },
    footer: {
      rights: 'All rights reserved.',
    },
  },
  es: {
    role: 'Ingeniero de Software',
    nav: {
      about: 'Sobre Mí',
      skills: 'Habilidades',
      projects: 'Proyectos',

      contact: 'Contacto',
    },
    theme: {
      light: 'Claro',
      dark: 'Oscuro',
      system: 'Sistema',
    },
    hero: {
      description:
        'Ingeniero full-stack creando productos web completos, de punta a punta.',
      getInTouch: 'Contáctame',
      viewWork: 'Ver Mi Trabajo',
    },
    about: {
      title: 'Sobre Mí',
      paragraph1:
        'Empecé a programar siendo adolescente, configurando plugins en un servidor de Minecraft que yo administraba — ahí me enganché a resolver problemas con código. Hoy soy ingeniero full-stack con 6 años de experiencia, la mayor parte en marketplaces con pagos: flujos de reserva, precios, checkout y reconciliación. En Binamik, pasé de pasante a ingeniero full-stack, revisé más de 2.000 PRs y mentoré a desarrolladores más junior.',
      paragraph2:
        'Construí solo un SaaS completo — backend, frontend, infraestructura y checkout — usado por clientes reales. Más recientemente he creado herramientas con LLMs sobre estos sistemas, como un agente que responde preguntas de disponibilidad en lenguaje natural.',
    },
    skills: {
      title: 'Habilidades & Experiencia',
      description:
        'Aquí hay algunas de las tecnologías y herramientas con las que trabajo regularmente.',
      frontend: {
        title: 'Desarrollo Frontend',
        description: 'React, Next.js, TypeScript, Tailwind CSS',
      },
      backend: {
        title: 'Backend & Pagos',
        description:
          'Ruby on Rails, Python (FastAPI, Flask), Node.js, PostgreSQL, Redis, Sidekiq, Braspag, Pagar.me, Pix',
      },
      tools: {
        title: 'Infraestructura & IA',
        description:
          'Kubernetes (GKE), AWS (Lambda, S3), GCP, Vercel, CI/CD, agentes LLM (GPT), n8n, MCP',
      },
    },
    projects: {
      title: 'Mis Proyectos',
      description:
        'Aquí hay algunos de los proyectos en los que he trabajado recientemente.',
    },
    contact: {
      title: 'Contáctame',
      description:
        'No dudes en contactarme si tienes alguna pregunta o quieres trabajar juntos.',
      emailMe: 'Envíame un Email',
      linkedin: 'LinkedIn',
    },
    quoteRequest: {
      title: 'Envía un mensaje',
      description: 'Cuéntame qué necesitas y te responderé pronto.',
      name: 'Nombre',
      email: 'Correo',
      phone: 'Teléfono (opcional)',
      phoneInvalid: 'Teléfono inválido',
      message: 'Mensaje',
      submit: 'Enviar mensaje',
      sending: 'Enviando…',
      success: '¡Mensaje enviado! Te contactaré pronto.',
      error: 'No se pudo enviar. Inténtalo de nuevo.',
    },
    footer: {
      rights: 'Todos los derechos reservados.',
    },
  },
}

export const getLanguageName = (lang: Language): string => {
  switch (lang) {
    case 'pt':
      return 'Português'
    case 'en':
      return 'English'
    case 'es':
      return 'Español'
    default:
      return 'Português'
  }
}
