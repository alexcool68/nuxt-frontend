import { useFetch } from "nuxt/app";

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  // Access public variables
  const result = await useFetch(`/api/auth/change-fullname`, {
    baseURL: "http://localhost:3333",
    headers: { "Content-Type": "application/json" },
    method: "PATCH",
  });
  return {};
});
