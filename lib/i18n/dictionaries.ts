export type Language = "pt" | "en" | "es"

export type Dictionary = {
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
    greeting: string
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
    project1: {
      title: string
      description: string
      viewDemo: string
      github: string
    }
    project2: {
      title: string
      description: string
      viewDemo: string
      github: string
    }
  }
  contact: {
    title: string
    description: string
    emailMe: string
    linkedin: string
  }
  footer: {
    rights: string
  }
}

export const dictionaries: Record<Language, Dictionary> = {
  pt: {
    nav: {
      about: "Sobre",
      skills: "Habilidades",
      projects: "Projetos",
      contact: "Contato",
    },
    theme: {
      light: "Claro",
      dark: "Escuro",
      system: "Sistema",
    },
    hero: {
      greeting: "Olá, eu sou Lucas",
      description: "Um desenvolvedor apaixonado e focado em criar experiências web bonitas e funcionais.",
      getInTouch: "Entre em Contato",
      viewWork: "Ver Meu Trabalho",
    },
    about: {
      title: "Sobre Mim",
      paragraph1:
        "Sou um desenvolvedor apaixonado com um olhar atento para design e amor por criar experiências de usuário intuitivas. Com experiência em desenvolvimento web, me especializo em construir sites e aplicações modernas e responsivas que não apenas parecem ótimas, mas também têm desempenho excepcional.",
      paragraph2:
        "Quando não estou codificando, você pode me encontrar explorando novas tecnologias ou aproveitando atividades ao ar livre para manter um equilíbrio saudável entre trabalho e vida pessoal.",
    },
    skills: {
      title: "Habilidades & Especialidades",
      description: "Aqui estão algumas das tecnologias e ferramentas com as quais trabalho regularmente.",
      frontend: {
        title: "Desenvolvimento Frontend",
        description: "React, Next.js, Tailwind CSS, HTML5, CSS3, JavaScript, TypeScript",
      },
      backend: {
        title: "Desenvolvimento Backend",
        description: "Node.js, Express, RESTful APIs, GraphQL, MongoDB, PostgreSQL",
      },
      tools: {
        title: "Ferramentas & Outros",
        description: "Git, GitHub, VS Code, Figma, Design Responsivo, Otimização de Performance",
      },
    },
    projects: {
      title: "Meus Projetos",
      description: "Aqui estão alguns dos projetos em que trabalhei recentemente.",
      project1: {
        title: "Projeto Um",
        description:
          "Uma aplicação web responsiva construída com React e Next.js, apresentando uma UI limpa e experiência de usuário perfeita.",
        viewDemo: "Ver Demo",
        github: "GitHub",
      },
      project2: {
        title: "Projeto Dois",
        description:
          "Uma plataforma de e-commerce com foco em performance e acessibilidade, construída com tecnologias web modernas.",
        viewDemo: "Ver Demo",
        github: "GitHub",
      },
    },
    contact: {
      title: "Entre em Contato",
      description: "Sinta-se à vontade para entrar em contato se tiver alguma pergunta ou quiser trabalhar junto.",
      emailMe: "Me Envie um Email",
      linkedin: "LinkedIn",
    },
    footer: {
      rights: "Todos os direitos reservados.",
    },
  },
  en: {
    nav: {
      about: "About",
      skills: "Skills",
      projects: "Projects",
      contact: "Contact",
    },
    theme: {
      light: "Light",
      dark: "Dark",
      system: "System",
    },
    hero: {
      greeting: "Hi, I'm Lucas",
      description: "A passionate developer focused on creating beautiful and functional web experiences.",
      getInTouch: "Get in Touch",
      viewWork: "View My Work",
    },
    about: {
      title: "About Me",
      paragraph1:
        "I'm a passionate developer with a keen eye for design and a love for creating intuitive user experiences. With a background in web development, I specialize in building modern, responsive websites and applications that not only look great but also perform exceptionally well.",
      paragraph2:
        "When I'm not coding, you can find me exploring new technologies, contributing to open-source projects, or enjoying outdoor activities to maintain a healthy work-life balance.",
    },
    skills: {
      title: "Skills & Expertise",
      description: "Here are some of the technologies and tools I work with regularly.",
      frontend: {
        title: "Frontend Development",
        description: "React, Next.js, Tailwind CSS, HTML5, CSS3, JavaScript, TypeScript",
      },
      backend: {
        title: "Backend Development",
        description: "Node.js, Express, RESTful APIs, GraphQL, MongoDB, PostgreSQL",
      },
      tools: {
        title: "Tools & Others",
        description: "Git, GitHub, VS Code, Figma, Responsive Design, Performance Optimization",
      },
    },
    projects: {
      title: "My Projects",
      description: "Here are some of the projects I've worked on recently.",
      project1: {
        title: "Project One",
        description:
          "A responsive web application built with React and Next.js, featuring a clean UI and seamless user experience.",
        viewDemo: "View Demo",
        github: "GitHub",
      },
      project2: {
        title: "Project Two",
        description:
          "An e-commerce platform with a focus on performance and accessibility, built with modern web technologies.",
        viewDemo: "View Demo",
        github: "GitHub",
      },
    },
    contact: {
      title: "Get in Touch",
      description: "Feel free to reach out if you have any questions or want to work together.",
      emailMe: "Email Me",
      linkedin: "LinkedIn",
    },
    footer: {
      rights: "All rights reserved.",
    },
  },
  es: {
    nav: {
      about: "Sobre Mí",
      skills: "Habilidades",
      projects: "Proyectos",
      contact: "Contacto",
    },
    theme: {
      light: "Claro",
      dark: "Oscuro",
      system: "Sistema",
    },
    hero: {
      greeting: "Hola, soy Lucas",
      description: "Un desarrollador apasionado enfocado en crear experiencias web hermosas y funcionales.",
      getInTouch: "Contáctame",
      viewWork: "Ver Mi Trabajo",
    },
    about: {
      title: "Sobre Mí",
      paragraph1:
        "Soy un desarrollador apasionado con un ojo agudo para el diseño y un amor por crear experiencias de usuario intuitivas. Con experiencia en desarrollo web, me especializo en construir sitios web y aplicaciones modernas y responsivas que no solo se ven geniales, sino que también funcionan excepcionalmente bien.",
      paragraph2:
        "Cuando no estoy programando, puedes encontrarme explorando nuevas tecnologías, contribuyendo a proyectos de código abierto o disfrutando de actividades al aire libre para mantener un equilibrio saludable entre el trabajo y la vida personal.",
    },
    skills: {
      title: "Habilidades & Experiencia",
      description: "Aquí hay algunas de las tecnologías y herramientas con las que trabajo regularmente.",
      frontend: {
        title: "Desarrollo Frontend",
        description: "React, Next.js, Tailwind CSS, HTML5, CSS3, JavaScript, TypeScript",
      },
      backend: {
        title: "Desarrollo Backend",
        description: "Node.js, Express, RESTful APIs, GraphQL, MongoDB, PostgreSQL",
      },
      tools: {
        title: "Herramientas & Otros",
        description: "Git, GitHub, VS Code, Figma, Diseño Responsivo, Optimización de Rendimiento",
      },
    },
    projects: {
      title: "Mis Proyectos",
      description: "Aquí hay algunos de los proyectos en los que he trabajado recientemente.",
      project1: {
        title: "Proyecto Uno",
        description:
          "Una aplicación web responsiva construida con React y Next.js, con una interfaz de usuario limpia y una experiencia de usuario perfecta.",
        viewDemo: "Ver Demo",
        github: "GitHub",
      },
      project2: {
        title: "Proyecto Dos",
        description:
          "Una plataforma de comercio electrónico con enfoque en el rendimiento y la accesibilidad, construida con tecnologías web modernas.",
        viewDemo: "Ver Demo",
        github: "GitHub",
      },
    },
    contact: {
      title: "Contáctame",
      description: "No dudes en contactarme si tienes alguna pregunta o quieres trabajar juntos.",
      emailMe: "Envíame un Email",
      linkedin: "LinkedIn",
    },
    footer: {
      rights: "Todos los derechos reservados.",
    },
  },
}

export const getLanguageName = (lang: Language): string => {
  switch (lang) {
    case "pt":
      return "Português"
    case "en":
      return "English"
    case "es":
      return "Español"
    default:
      return "Português"
  }
}

