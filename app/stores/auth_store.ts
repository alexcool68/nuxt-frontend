import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", () => {
  const auth = useAuth();

  // État réactif synchronisé
  const user = ref(auth.data.value?.user ?? null);
  const isAuthenticated = computed(() => auth.status.value === "authenticated");

  // Synchronisation automatique quand la session change
  watch(
    () => auth.data.value,
    (newData) => {
      user.value = newData?.user ?? null;
    },
    { deep: true },
  );

  // Méthodes
  const signIn = async (
    providerOrCredentials: Credential | object,
    options?: Record<string, string>,
  ) => {
    try {
      await auth.signIn(providerOrCredentials, options);
      return true;
    } catch (error) {
      return false;
    }
  };

  const signOut = async (options?: {
    callbackUrl?: string;
    redirect?: boolean;
    external?: boolean;
  }) => {
    return auth.signOut(options);
  };

  const getSession = async (bypass?: boolean) => {
    return auth.getSession({ force: bypass });
  };

  return {
    user,
    isAuthenticated,
    status: computed(() => auth.status.value), // 'loading' | 'authenticated' | 'unauthenticated'
    signIn,
    signOut,
    getSession,
    // Si tu veux accéder directement au composable original
    rawAuth: auth,
  };
});
