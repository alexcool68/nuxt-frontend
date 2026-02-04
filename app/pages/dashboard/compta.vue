<script setup lang="ts">
definePageMeta({
  layout: "dashboard",
});

useSeoMeta({
  title: "Dashboard - Compta",
  description: "",
});
import type { NavigationMenuItem } from "@nuxt/ui";

const links = [
  [
    {
      label: "DP01",
      to: "/dashboard/compta/DP01",
      exact: true,
    },
  ],
  [],
] satisfies NavigationMenuItem[][];
</script>

<template>
  <UDashboardPanel id="compta" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar title="Compta">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <!-- NOTE: The `-mx-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
        <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div
        class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-4xl mx-auto"
      >
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
