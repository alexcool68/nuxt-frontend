// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@nuxt/ui",
    "@sidebase/nuxt-auth",
    "@pinia/nuxt",
    "@nuxt/devtools",
  ],

  runtimeConfig: {
    // baseURL: "BASE_URL",
  },

  auth: {
    isEnabled: true,
    disableServerSideAuth: false,
    globalAppMiddleware: true,
    originEnvKey: "AUTH_ORIGIN",
    baseURL: "http://localhost:3333/api/auth",
    // baseURL: "http://adonis-backend.vps-01.alexis-leroy.fr:15501/api/auth",
    session: {
      enableRefreshPeriodically: false,
      enableRefreshOnWindowFocus: false,
    },
    provider: {
      type: "local",
      endpoints: {
        signIn: { path: "/login", method: "post" },
        signOut: { path: "/logout", method: "post" },
        signUp: { path: "/register", method: "post" },
        getSession: { path: "/session", method: "get" },
      },
      token: {
        signInResponseTokenPointer: "/token",
        type: "Bearer",
        cookieName: "auth.token",
        headerName: "Authorization",
        maxAgeInSeconds: 1800,
        sameSiteAttribute: "lax",
        // secureCookieAttribute: false,
        // httpOnlyCookieAttribute: false,
      },
      session: {
        cookieName: "auth.session",
        maxAgeInSeconds: 1800,
        sameSiteAttribute: "lax",
        dataResponsePointer: "/user",
        // dataType: {
        //   id: "string | number",
        //   fullName: "string | null",
        //   email: "string",
        //   createdAt: "string",
        //   updatedAt: "string",
        // },
      },
    },
  },

  devtools: {
    disableAuthorization: true,
    enabled: true,
  },

  css: ["~/assets/css/main.css"],

  routeRules: {
    "/": { prerender: true },
  },

  compatibilityDate: "2025-01-15",

  eslint: {
    config: {
      stylistic: {
        commaDangle: "never",
        braceStyle: "1tbs",
      },
    },
  },
});
