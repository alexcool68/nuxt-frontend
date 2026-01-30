<script setup lang="ts">
definePageMeta({
  layout: "dashboard",
});

useSeoMeta({
  title: "Dashboard",
  description: "",
});

import type { DropdownMenuItem } from "@nuxt/ui";

const { isNotificationsSlideoverOpen } = useDashboard();

const items = [
  [
    {
      label: "New mail",
      icon: "i-lucide-send",
      to: "/inbox",
    },
    {
      label: "New customer",
      icon: "i-lucide-user-plus",
      to: "/customers",
    },
  ],
] satisfies DropdownMenuItem[][];

const { data } = useAuth();
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Home" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UTooltip text="Notifications" :shortcuts="['N']">
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip color="error" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>

          <UDropdownMenu :items="items">
            <UButton icon="i-lucide-plus" size="md" class="rounded-full" />
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <!-- NOTE: The `-ms-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
          <!-- <HomeDateRangePicker v-model="range" class="-ms-1" /> -->

          <!-- <HomePeriodSelect v-model="period" :range="range" /> -->
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <UCard variant="subtle">
        <template #header>
          <h2>Session data</h2>
        </template>
        <pre>{{ JSON.stringify(data, null, 2) }}</pre>
        <template #footer>
          <div>
            <span>{{ data?.email }}</span>
          </div>
        </template>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
