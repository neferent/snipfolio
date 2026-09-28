import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  future: { compatibilityVersion: 4 },
  devtools: { enabled: true },

  // Snipfolio-local ships as a static SPA loaded from disk inside Electron
  // (`nuxt generate` → .output/public/index.html via loadFile), not served by
  // a Nitro server — so the whole app is client-rendered.
  ssr: false,

  // Hash-based routing (`#/dashboard` instead of `/dashboard`) so client-side
  // navigation works when the app is loaded via `file://` — there's no server
  // to resolve a deep path back to index.html on a hard reload.
  router: {
    options: { hashMode: true },
  },

  app: {
    // Relative asset URLs ('./_nuxt/...' instead of '/_nuxt/...') are required
    // for the static build to load via `file://` in Electron — an absolute
    // '/_nuxt/...' path resolves against the filesystem root under file://,
    // not index.html's directory, and 404s silently (blank white screen, no
    // console error). Setting `baseURL` here does NOT reliably take effect in
    // `nuxt generate` output — the actual fix is building with the
    // NUXT_APP_BASE_URL=./ env var (see the `generate:electron` script in
    // package.json, used by electron:build/electron:pack). Left unset here
    // deliberately so `pnpm dev`/`pnpm build` (hosted-style, unused by
    // Electron) keep normal absolute paths.
    pageTransition: { name: 'fade', mode: 'out-in' },
    layoutTransition: { name: 'fade', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Snipfolio',
      meta: [
        { name: 'theme-color', content: '#ffffff' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: './icons/logo_36.svg' },
        { rel: 'icon', type: 'image/png', sizes: '48x48', href: './icons/logo_48.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: './icons/logo_32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: './icons/logo_16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: './icons/logo_180.png' },
      ],
      script: [
        {
          // Runs before hydration/paint so the correct theme class is present
          // immediately — avoids a light→dark (or dark→light) flash on load.
          innerHTML: `try{if(localStorage.getItem('sf-theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}`,
        },
      ],
    },
  },

  modules: ['@pinia/nuxt'],

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

  typescript: {
    strict: true,
    typeCheck: false,
  },
})
