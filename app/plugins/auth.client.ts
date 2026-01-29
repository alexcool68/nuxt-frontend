export default defineNuxtPlugin(async () => {
  const { status, data } = useAuth();
  const userStore = useUserStore();

  // Surveiller les changements de session
  watch(
    status,
    async (newStatus) => {
      if (newStatus === "authenticated" && data.value) {
        userStore.setUser(data.value.user);
      } else if (newStatus === "unauthenticated") {
        userStore.clearUser();
      }
    },
    { immediate: true },
  );
});
