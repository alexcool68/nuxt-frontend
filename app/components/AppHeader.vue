<script setup lang="ts">
import AppLogo from "~/components/AppLogo.vue";

const items = computed(() => [
  {
    label: "Home",
    to: "/",
  },
  {
    label: "Dashboard",
    to: "/dashboard",
  },
]);

const authStore = useAuthStore();
const { status, isAuthenticated } = authStore;
</script>

<template>
  <UHeader>
    <template #left>
      <NuxtLink to="/"><AppLogo /></NuxtLink>
    </template>

    <UNavigationMenu :items="items" variant="pill" />

    <template #right>
      <UColorModeButton />

      <div v-if="status === 'loading'">
        <USkeleton class="h-8 w-20" :ui="{ rounded: 'rounded-md' }" />
      </div>
      <div v-else-if="isAuthenticated">
        <UButton
          label="Sign out"
          color="neutral"
          variant="outline"
          class="hidden lg:inline-flex"
          @click="() => authStore.signOut({ callbackUrl: '/login' })"
        />
      </div>
      <div v-else>
        <UButton
          icon="i-lucide-log-in"
          color="neutral"
          variant="ghost"
          to="/login"
          class="lg:hidden"
        />

        <UButton
          label="Sign in"
          color="neutral"
          variant="outline"
          to="/login"
          class="hidden lg:inline-flex me-2"
        />

        <UButton
          label="Sign up"
          color="neutral"
          trailing-icon="i-lucide-arrow-right"
          class="hidden lg:inline-flex"
          to="/signup"
        />
      </div>
    </template>

    <template #body>
      <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />

      <USeparator class="my-6" />
      <div v-if="status === 'loading'">
        <USkeleton
          class="lg:inline-flex h-8 mb-3"
          block
          :ui="{ rounded: 'rounded-md' }"
        />
        <USkeleton
          class="lg:inline-flex h-8 mb-3"
          block
          :ui="{ rounded: 'rounded-md' }"
        />
      </div>
      <div v-else-if="isAuthenticated">
        <UButton
          label="Sign out"
          color="neutral"
          variant="subtle"
          block
          @click="() => authStore.signOut({ callbackUrl: '/login' })"
        />
      </div>
      <div v-else>
        <UButton
          label="Sign in"
          color="neutral"
          variant="subtle"
          to="/login"
          block
          class="mb-3"
        />
        <UButton label="Sign up" color="neutral" to="/signup" block />
      </div>
    </template>
  </UHeader>
</template>
