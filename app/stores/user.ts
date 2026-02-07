import { defineStore } from "pinia";

import type { SessionData } from "#auth";

export const useUserStore = defineStore("user", {
  state: () => ({
    user: null as Partial<SessionData> | null,
    isLoading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
  },
  actions: {
    setUser(userData: Partial<SessionData> | null) {
      this.user = userData;
    },
    async fetchUser() {
      this.isLoading = true;
      try {
        const { data, getSession } = useAuth();
        const session = await getSession();

        if (session && data.value) {
          this.user = data.value as Partial<SessionData>;
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération de l'utilisateur:",
          error,
        );
        this.user = null;
      } finally {
        this.isLoading = false;
      }
    },

    clearUser() {
      this.user = null;
    },
  },
});
