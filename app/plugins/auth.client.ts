export default defineNuxtPlugin(async () => {
  const { status, data } = useAuth();
  const userStore = useUserStore();

  // Surveiller les changements de session
  watch(
    status,
    async (newStatus) => {
      if (newStatus === "authenticated" && data.value) {
        userStore.setUser({
          email: data.value.email,
          fullName: data.value.fullName,
          id: data.value.id as number,
        });
      } else if (newStatus === "unauthenticated") {
        userStore.clearUser();
      }
    },
    { immediate: true },
  );
});
