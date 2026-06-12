import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },

  app: {
    pageTransition: { name: 'fade', mode: 'out-in' },
    layoutTransition: { name: 'fade', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Snipfolio',
      meta: [
        { name: 'theme-color', content: '#0f172a' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/icons/logo_36.svg' },
        { rel: 'icon', type: 'image/png', sizes: '48x48', href: '/icons/logo_48.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/icons/logo_16.png' },
      ],
      script: [
        { src: 'https://www.googletagmanager.com/gtag/js?id=G-C3XP5KTPSP', async: true },
        {
          innerHTML: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-C3XP5KTPSP');`,
        },
      ],
    },
  },

  modules: ['@pinia/nuxt', '@vercel/speed-insights', '@vercel/analytics'],

  components: [{ path: '~/components', pathPrefix: false }],

  css: ['~/assets/css/main.css', 'vue-sonner/style.css'],

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
