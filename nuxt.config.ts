// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@nuxt/eslint", "@nuxt/ui", "@pinia/nuxt", "@sidebase/nuxt-auth"],

  devtools: {
    enabled: true,
  },

  css: ["~/assets/css/main.css"],

  routeRules: {
    "/": { prerender: true },
    // "/api/auth/**": {
    //   cors: true,
    //   proxy: { to: "http://127.0.0.1:3333/api/auth/**" },
    // },
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

  runtimeConfig: {
    public: {
      apiBaseUrl: "http://127.0.0.1:3333",
      siteUrl: "http://localhost:3000",
    },
  },

  //* auth
  auth: {
    isEnabled: true,
    disableServerSideAuth: false,
    globalAppMiddleware: true,
    baseURL: "http://127.0.0.1:3333",
    session: {
      enableRefreshPeriodically: false,
      enableRefreshOnWindowFocus: false,
    },
    provider: {
      type: "local",
      endpoints: {
        signIn: { path: "/api/auth/login", method: "post" },
        signOut: { path: "/api/auth/logout", method: "post" },
        signUp: { path: "/api/auth/register", method: "post" },
        getSession: { path: "/api/auth/session", method: "get" },
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

  //* debug
  // sourcemap: {
  //   server: true,
  //   client: true,
  // },
});
