import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },

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
