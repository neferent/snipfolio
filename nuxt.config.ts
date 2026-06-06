import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },

  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap' },
        { rel: 'icon', type: 'image/svg+xml', href: '/icons/logo_36.svg' },
        { rel: 'icon', type: 'image/png', sizes: '48x48', href: '/icons/logo_48.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/icons/logo_16.png' },
      ],
    },
  },

  modules: ['@pinia/nuxt'],

  components: [{ path: '~/components', pathPrefix: false }],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  runtimeConfig: {
    public: {
      authMode: process.env.NUXT_PUBLIC_AUTH_MODE ?? 'local',
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL ?? '',
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_KEY ?? '',
      // Local dev only — intentionally public, never used in supabase mode
      localDevEmail: process.env.LOCAL_DEV_EMAIL ?? '',
      localDevPassword: process.env.LOCAL_DEV_PASSWORD ?? '',
      localJwtSecret: process.env.LOCAL_JWT_SECRET ?? 'local-dev-secret-change-me',
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },
})
