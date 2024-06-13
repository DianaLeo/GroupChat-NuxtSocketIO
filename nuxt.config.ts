// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss","@vueuse/nuxt","nuxt-icons","@pinia/nuxt"],
  nitro:{
    // preset: "bun",
    experimental:{
      websocket:true,
    }
  },
  devServer: {
    host: "0.0.0.0",
    port: 3000,
  }
})