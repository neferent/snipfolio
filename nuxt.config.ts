import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },

  app: {
    head: {
      title: 'Snipfolio',
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

  modules: ['@pinia/nuxt', '@vercel/speed-insights', '@vercel/analytics', 'vue-sonner/nuxt'],

  components: [{ path: '~/components', pathPrefix: false }],

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  hooks: {
    'vite:extendConfig': (config) => {
      config.build ??= {}
      config.build.rollupOptions ??= {}
      config.build.rollupOptions.onwarn = (warning, warn) => {
        if (warning.code === 'SOURCEMAP_ERROR') return
        if (warning.message?.includes('Sourcemap is likely to be incorrect')) return
        if (warning.code === 'INVALID_ANNOTATION') return
        warn(warning)
      }
    },
  },

  runtimeConfig: {
    supabaseServiceKey: process.env.NUXT_SUPABASE_SERVICE_KEY ?? '',
    lsApiKey: process.env.NUXT_LS_API_KEY ?? '',
    lsWebhookSecret: process.env.NUXT_LS_WEBHOOK_SECRET ?? '',
    public: {
      appEnabled: process.env.NUXT_PUBLIC_APP_ENABLED === 'true',
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL ?? '',
      supabaseKey: process.env.NUXT_PUBLIC_SUPABASE_KEY ?? '',
      authMode: process.env.NUXT_PUBLIC_AUTH_MODE ?? 'local',
      lsStoreId: process.env.NUXT_PUBLIC_LS_STORE_ID ?? '',
      lsProVariantId: process.env.NUXT_PUBLIC_LS_PRO_VARIANT_ID ?? '',
      lsProEarlyVariantId: process.env.NUXT_PUBLIC_LS_PRO_EARLY_VARIANT_ID ?? '',
      lsDayPassVariantId: process.env.NUXT_PUBLIC_LS_DAY_PASS_VARIANT_ID ?? '',
      lsDayPassVariantIdTest: process.env.NUXT_PUBLIC_LS_DAY_PASS_VARIANT_ID_TEST ?? '',
      lsStoreSlug: process.env.NUXT_PUBLIC_LS_STORE_SLUG ?? '',
    },
  },

  // Auth-protected routes are fully client-rendered to avoid hydration mismatches
  // from auth state (user email, isPro, etc.) being empty during SSR.
  routeRules: {
    '/dashboard': { ssr: false },
    '/project/**': { ssr: false },
    '/admin': { ssr: false },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },
})
