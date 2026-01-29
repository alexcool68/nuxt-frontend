export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  const result = await $fetch(`/api/auth/change-fullname`, {
    baseURL: "http://127.0.0.1:3333",
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });
  return {};
});
