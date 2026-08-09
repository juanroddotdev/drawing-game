// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },
  runtimeConfig: {
    resendApiKey: '',
    resendFromEmail: '',
    public: {
      supabaseUrl: '',
      supabaseAnonKey: '',
      /**
       * When set, shows beta Dev mode UI (Play next, /dev, inspector).
       * LAUNCH: remove or re-gate to local-only before public launch.
       */
      devInspectorKey: '',
    },
  },
  app: {
    head: {
      title: 'DoodleLoop',
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
        },
        {
          name: 'description',
          content: 'DoodleLoop — async friends drawing & guessing game',
        },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,500&family=Shantell+Sans:ital,wght@0,400;0,600;0,700;1,400&display=swap',
        },
      ],
    },
  },
})
