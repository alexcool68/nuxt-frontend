<script setup lang="ts">
import type { Movement } from "~/types/compta";

definePageMeta({
  layout: "dashboard",
});

useSeoMeta({
  title: "Dashboard - Configuration",
  description: "",
});

const config = useRuntimeConfig();
const baseURL = config.public.authBaseUrl || "http://localhost:3333";

const { data: movements, refresh: refreshMovements } = await useFetch<
  Movement[]
>(`${baseURL}/api/configurations/movements`);

const selectedMovementId = ref<number | null>(null);
</script>

<template>
  <UDashboardPanel
    id="chainMenu"
    :default-size="25"
    :min-size="20"
    :max-size="30"
    resizable
  >
    <template #header>
      <UDashboardNavbar title="Configuration">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <span class="text-muted">Total : 3 movements</span>
        </template>
        <template #right>
          <UButton
            icon="i-lucide-circle-plus"
            label="Add"
            size="sm"
            variant="outline"
          />
        </template>
      </UDashboardToolbar>
    </template>
    <template #body>
      <UCard
        v-for="movment in movements"
        :key="movment.id"
        @click="selectedMovementId = movment.id"
        variant="subtle"
        class="cursor-pointer"
      >
        <div class="flex justify-between items-center">
          <div class="flex flex-col justify-center">
            {{ movment.code }}
            <span
              v-if="movment.description"
              class="text-muted font-mono text-sm"
            >
              {{ movment.description }}
            </span>
          </div>
          <UIcon name="i-lucide-chevrons-right" size="32" class="text-muted" />
        </div>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
