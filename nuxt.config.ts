// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    "@nuxtjs/tailwindcss",
    "@vueuse/nuxt",
    "nuxt-icons",
    "@pinia/nuxt",
    ["nuxt-plotly", { inject: true }]
  ],
  nitro:{
    // preset: "bun",
    experimental:{
      websocket:true,
    }
  },
  devServer: {
    host: "0.0.0.0",
    port: 3000,
  },
  vite: {
    optimizeDeps: {
      include: ["plotly.js-dist-min"],
    },
  }
})