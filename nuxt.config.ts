// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
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
    },
  },
})
