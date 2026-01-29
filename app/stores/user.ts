import { defineStore } from "pinia";

//import type User from "~/types/user-types";

interface User {
  id: number;
  email: string;
  fullName?: string;
}

export const useUserStore = defineStore("user", {
  state: () => ({
    user: null as User | null,
    isLoading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
  },
  actions: {
    setUser(userData: User | null) {
      this.user = userData;
    },
    async fetchUser() {
      this.isLoading = true;
      try {
        const { data, getSession } = useAuth();
        const session = await getSession();

        if (session && data.value) {
          this.user = data.value.user as User;
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
