import type { Language } from './i18n/dictionaries'

export type ProfileCopy = {
  headline: string
  headlineLines: string[]
  summary: string
  primaryCta: string
  secondaryCta: string
  strengthsTitle: string
  strengths: Array<{ title: string; description: string }>
  skillsHeading: string
  projectsIntro: string
  projectsHeading: string
  projectsRailDescription: string
  projectsRailCta: string
  sceneTitle: string
  sceneHint: string
  sceneStatus: string
  projects: Array<{
    title: string
    description: string
    stack: string[]
    url?: string
  }>
  contactTitle: string
  contactHeading: string
  contactSupport: string
}

export const PROFILE_COPY = {
  pt: {
    headline:
      'Engenheiro full-stack criando produtos web completos, de ponta a ponta.',
    headlineLines: [
      'Engenheiro full-stack',
      'criando produtos web',
      'completos, de ponta',
      'a ponta.',
    ],
    summary:
      'Construo sistemas web do zero, da infraestrutura à aplicação, com foco em performance e escalabilidade. Nos últimos 6 anos, a maior parte em marketplaces com pagamentos — reservas, precificação e checkout em Ruby on Rails, com React e Next.js no frontend. Entreguei um produto inteiro sozinho (backend, frontend e infra em Kubernetes, AWS e GCP).',
    primaryCta: 'Falar comigo',
    secondaryCta: 'Ver projetos',
    strengthsTitle: 'O que eu entrego',
    strengths: [
      {
        title: 'Produto de ponta a ponta',
        description:
          'Construí um SaaS completo sozinho: backend FastAPI, frontend Next.js, infraestrutura GKE com deploys sem downtime e Postgres com mais de 24 milhões de linhas.',
      },
      {
        title: 'Pagamentos e marketplaces',
        description:
          'Checkout com cartão e Pix via Braspag e Pagar.me, webhooks, reconciliação e o ciclo completo de reservas: criação, alteração, cancelamento e reembolso.',
      },
      {
        title: 'Ferramentas com IA',
        description:
          'Agentes LLM que consultam APIs de produção em linguagem natural, orquestrados com n8n e MCP.',
      },
    ],
    skillsHeading: 'Stack principal e forma de atuação',
    projectsIntro:
      'Projetos selecionados para mostrar decisões de interface, execução técnica e qualidade de entrega.',
    projectsHeading: 'Projetos relevantes',
    projectsRailDescription:
      'No GitHub, você pode revisar estrutura, componentes e decisões de implementação com mais detalhe.',
    projectsRailCta: 'Abrir GitHub',
    sceneTitle: 'Retrato interativo',
    sceneHint: 'Um painel visual com movimento sutil e foco na apresentação.',
    sceneStatus: 'Em destaque',
    projects: [
      {
        title: 'Binamik Photos',
        description:
          'Marketplace SaaS onde participantes de eventos compram fotos dos organizadores — construído sozinho: backend, frontend, infraestrutura e checkout. Pipeline AWS Lambda processa ~1.000 fotos por dia e o Postgres principal passa de 24 milhões de linhas.',
        stack: ['FastAPI', 'Next.js', 'PostgreSQL', 'Kubernetes', 'AWS Lambda'],
        url: 'https://photos.binamik.com.br',
      },
      {
        title: 'Roxo Events',
        description:
          'Site institucional para empresa de eventos com galeria, formulário de contato, seção de serviços e suporte multilíngue. Interface moderna com animações e design responsivo.',
        stack: ['Next.js', 'React', 'TypeScript', 'Tailwind', 'Framer Motion'],
        url: 'https://www.roxoevents.com/',
      },
    ],
    contactTitle: 'Contato',
    contactHeading:
      'Se meu perfil faz sentido para a sua necessidade, vamos conversar.',
    contactSupport:
      'LinkedIn é o melhor caminho para iniciar a conversa; no GitHub, você pode revisar projetos e exemplos reais de implementação.',
  },
  en: {
    headline: 'Full-stack engineer building complete web products, end to end.',
    headlineLines: [
      'Full-stack engineer',
      'building complete',
      'web products,',
      'end to end.',
    ],
    summary:
      'I build web systems from the ground up, from infrastructure to application, with a focus on performance and scalability. Over the last 6 years, mostly on payments-heavy marketplaces — reservations, pricing, and checkout in Ruby on Rails, with React and Next.js on the frontend. I shipped a whole product solo (backend, frontend, and infra on Kubernetes, AWS, and GCP).',
    primaryCta: 'Contact me',
    secondaryCta: 'View projects',
    strengthsTitle: 'What I bring',
    strengths: [
      {
        title: 'End-to-end product delivery',
        description:
          'Built a full SaaS solo: FastAPI backend, Next.js frontend, GKE infrastructure with zero-downtime deploys, and Postgres at 24M+ rows.',
      },
      {
        title: 'Payments & marketplaces',
        description:
          'Credit card and Pix checkout via Braspag and Pagar.me, webhooks, reconciliation, and the full reservation lifecycle: create, change, cancel, refund.',
      },
      {
        title: 'AI & LLM tooling',
        description:
          'LLM agents that query production APIs in natural language, orchestrated with n8n and MCP.',
      },
    ],
    skillsHeading: 'Core stack and working approach',
    projectsIntro:
      'Selected projects that show interface decisions, technical execution, and delivery quality.',
    projectsHeading: 'Relevant projects',
    projectsRailDescription:
      'GitHub is where the implementation detail lives: structure, components, and delivery decisions.',
    projectsRailCta: 'Open GitHub',
    sceneTitle: 'Interactive portrait',
    sceneHint: 'A visual panel with subtle motion and focus on presentation.',
    sceneStatus: 'Featured',
    projects: [
      {
        title: 'Binamik Photos',
        description:
          'SaaS marketplace where event participants buy photos from organizers — built solo: backend, frontend, infrastructure, and checkout. An AWS Lambda pipeline processes ~1,000 photos per day and the main Postgres table holds 24M+ rows.',
        stack: ['FastAPI', 'Next.js', 'PostgreSQL', 'Kubernetes', 'AWS Lambda'],
        url: 'https://photos.binamik.com.br',
      },
      {
        title: 'Roxo Events',
        description:
          'Institutional website for an events company with gallery, contact form, services section, and multilingual support. Modern interface with animations and responsive design.',
        stack: ['Next.js', 'React', 'TypeScript', 'Tailwind', 'Framer Motion'],
        url: 'https://www.roxoevents.com/',
      },
    ],
    contactTitle: 'Contact',
    contactHeading: 'If my profile fits your needs, let’s talk.',
    contactSupport:
      'LinkedIn is the best place to start the conversation, and GitHub is where you can review projects and real implementation samples.',
  },
  es: {
    headline:
      'Ingeniero full-stack creando productos web completos, de punta a punta.',
    headlineLines: [
      'Ingeniero full-stack',
      'creando productos web',
      'completos, de punta',
      'a punta.',
    ],
    summary:
      'Construyo sistemas web desde cero, de la infraestructura a la aplicación, con foco en rendimiento y escalabilidad. En los últimos 6 años, en su mayoría en marketplaces con pagos — reservas, precios y checkout en Ruby on Rails, con React y Next.js en el frontend. Entregué un producto entero yo solo (backend, frontend e infraestructura en Kubernetes, AWS y GCP).',
    primaryCta: 'Contactarme',
    secondaryCta: 'Ver proyectos',
    strengthsTitle: 'Lo que aporto',
    strengths: [
      {
        title: 'Producto de punta a punta',
        description:
          'Construí un SaaS completo solo: backend FastAPI, frontend Next.js, infraestructura GKE con deploys sin downtime y Postgres con más de 24 millones de filas.',
      },
      {
        title: 'Pagos y marketplaces',
        description:
          'Checkout con tarjeta y Pix vía Braspag y Pagar.me, webhooks, reconciliación y el ciclo completo de reservas: crear, cambiar, cancelar y reembolsar.',
      },
      {
        title: 'Herramientas con IA',
        description:
          'Agentes LLM que consultan APIs de producción en lenguaje natural, orquestados con n8n y MCP.',
      },
    ],
    skillsHeading: 'Stack principal y forma de trabajar',
    projectsIntro:
      'Proyectos seleccionados para mostrar decisiones de interfaz, ejecución técnica y calidad de entrega.',
    projectsHeading: 'Proyectos relevantes',
    projectsRailDescription:
      'En GitHub puedes revisar con más detalle la estructura, los componentes y las decisiones de implementación.',
    projectsRailCta: 'Abrir GitHub',
    sceneTitle: 'Retrato interactivo',
    sceneHint:
      'Un panel visual con movimiento sutil y foco en la presentación.',
    sceneStatus: 'Destacado',
    projects: [
      {
        title: 'Binamik Photos',
        description:
          'Marketplace SaaS donde participantes de eventos compran fotos de los organizadores — construido solo: backend, frontend, infraestructura y checkout. Un pipeline de AWS Lambda procesa ~1.000 fotos por día y la tabla principal de Postgres supera los 24 millones de filas.',
        stack: ['FastAPI', 'Next.js', 'PostgreSQL', 'Kubernetes', 'AWS Lambda'],
        url: 'https://photos.binamik.com.br',
      },
      {
        title: 'Roxo Events',
        description:
          'Sitio institucional para empresa de eventos con galería, formulario de contacto, sección de servicios y soporte multilingüe. Interfaz moderna con animaciones y diseño responsivo.',
        stack: ['Next.js', 'React', 'TypeScript', 'Tailwind', 'Framer Motion'],
        url: 'https://www.roxoevents.com/',
      },
    ],
    contactTitle: 'Contacto',
    contactHeading: 'Si mi perfil encaja con tus necesidades, conversemos.',
    contactSupport:
      'LinkedIn es la mejor vía para iniciar la conversación, y en GitHub puedes revisar proyectos y ejemplos reales de implementación.',
  },
} satisfies Record<Language, ProfileCopy>
