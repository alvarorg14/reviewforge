// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

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
