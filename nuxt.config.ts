// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
        { rel: 'shortcut icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
      meta: [
        {
          name: 'theme-color',
          content: '#FAFBFC',
          media: '(prefers-color-scheme: light)',
        },
        {
          name: 'theme-color',
          content: '#0F1115',
          media: '(prefers-color-scheme: dark)',
        },
      ],
    },
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxtjs/color-mode',
    '@vueuse/nuxt',
    'nuxt-auth-utils',
  ],

  css: ['~/assets/css/main.css'],

  typescript: {
    strict: true,
    typeCheck: false,
  },

  runtimeConfig: {
    databaseUrl:
      process.env.NUXT_DATABASE_URL || process.env.DATABASE_URL || '',
    githubWebhookSecret:
      process.env.NUXT_GITHUB_WEBHOOK_SECRET ||
      process.env.GITHUB_WEBHOOK_SECRET ||
      '',
    githubAppId: process.env.NUXT_GITHUB_APP_ID || process.env.GITHUB_APP_ID || '',
    githubAppPrivateKey:
      process.env.NUXT_GITHUB_APP_PRIVATE_KEY ||
      process.env.GITHUB_APP_PRIVATE_KEY ||
      '',
    cursorApiKey:
      process.env.NUXT_CURSOR_API_KEY || process.env.CURSOR_API_KEY || '',
    /** AI PR review: GitHub hosted MCP (Cursor SDK `type: http`). */
    githubMcpRemoteUrl:
      process.env.NUXT_GITHUB_MCP_REMOTE_URL ||
      process.env.GITHUB_MCP_REMOTE_URL ||
      'https://api.githubcopilot.com/mcp/',
    public: {
      appName: 'ReviewForge',
      baseUrl:
        process.env.NUXT_PUBLIC_BASE_URL ||
        process.env.PUBLIC_BASE_URL ||
        'http://localhost:3000',
      githubAppSlug:
        process.env.NUXT_PUBLIC_GITHUB_APP_SLUG ||
        process.env.GITHUB_APP_SLUG ||
        '',
    },
  },

  vite: {
    server: {
      // Cloudflare quick tunnels (e.g. *.trycloudflare.com) hit the dev server with a
      // non-localhost Host header; Vite 6 blocks those unless explicitly allowed.
      allowedHosts: ['.trycloudflare.com'],
    },
  },

  nitro: {
    storage: {
      cache: { driver: 'memory' },
    },
  },

  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'dark',
  },
})
