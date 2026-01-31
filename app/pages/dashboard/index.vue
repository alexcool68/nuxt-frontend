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
const userStore = useUserStore();
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
      <h1 class="font-bold text-3xl">Somes data</h1>

      <UPageGrid class="lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-px">
        <UPageCard
          variant="subtle"
          title="Session data"
          description="This is the session auth data"
          key="1"
          icon="i-lucide-book"
          :ui="{
            container: 'gap-y-1.5',
            wrapper: 'items-start',
            leading:
              'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
            title: 'font-normal text-muted text-xs uppercase',
          }"
          class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
        >
          <pre>{{ JSON.stringify(data, null, 2) }}</pre>
        </UPageCard>
        <UPageCard
          variant="subtle"
          title="Pinia auth data"
          description="This is the pinia store user data"
          icon="i-lucide-store"
          key="2"
          :ui="{
            container: 'gap-y-1.5',
            wrapper: 'items-start',
            leading:
              'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
            title: 'font-normal text-muted text-xs uppercase',
          }"
          class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
        >
          <pre>{{ JSON.stringify(userStore.$state, null, 2) }}</pre>
        </UPageCard>
      </UPageGrid>
    </template>
  </UDashboardPanel>
</template>
