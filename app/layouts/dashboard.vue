<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import AppLogo from "~/components/AppLogo.vue";

import UserMenu from "~/components/dashboard/UserMenu.vue";
import NotificationsSlideover from "~/components/dashboard/NotificationsSlideover.vue";

import type { Chain } from "~/types/compta";
const route = useRoute();
const open = ref(false);

const config = useRuntimeConfig();

const baseURL = config.public.authBaseUrl || "http://localhost:3333";

const {
  data: movements,
  status,
  error,
  refresh,
} = await useFetch<Chain[]>(`${baseURL}/api/movements`);
const allMovementsLinks =
  movements.value?.map((movement) => ({
    label: movement.code,
    to: `/dashboard/compta/${movement.code}`,
    exact: true,
  })) || [];

const links = [
  [
    {
      label: "Home",
      icon: "i-lucide-layout-dashboard",
      to: "/dashboard",
      onSelect: () => {
        open.value = false;
      },
    },
    {
      label: "Compta",
      icon: "i-lucide-hand-coins",
      to: "/dashboard/compta",
      onSelect: () => {
        open.value = false;
      },
      type: "trigger",
      children: [
        {
          label: "Movements",
          exact: true,
          onSelect: () => {
            open.value = false;
          },
          children: allMovementsLinks,
        },
        {
          label: "Catalogue",
          to: "/dashboard/compta/catalogue",
          exact: true,
          onSelect: () => {
            open.value = false;
          },
        },
      ],
    },
    {
      label: "Settings",
      to: "/dashboard/settings",
      icon: "i-lucide-settings",
      defaultOpen: true,
      type: "trigger",
      children: [
        {
          label: "General",
          to: "/dashboard/settings",
          exact: true,
          onSelect: () => {
            open.value = false;
          },
        },
        {
          label: "Notifications",
          to: "/dashboard/settings/notifications",
          onSelect: () => {
            open.value = false;
          },
        },
        {
          label: "Security",
          to: "/dashboard/settings/security",
          onSelect: () => {
            open.value = false;
          },
        },
      ],
    },
  ],
  [
    {
      label: "External link 01 ",
      icon: "i-lucide-message-circle",
      to: "https://google.fr",
      target: "_blank",
    },
    {
      label: "External link 02 ",
      icon: "i-lucide-info",
      to: "https://google.fr",
      target: "_blank",
    },
  ],
] satisfies NavigationMenuItem[][];

const groups = computed(() => [
  {
    id: "links",
    label: "Go to",
    items: links.flat(),
  },
  {
    id: "code",
    label: "Code",
    items: [
      {
        id: "source",
        label: "View page source",
        icon: "i-simple-icons-github",
        to: `https://github.com/nuxt-ui-templates/dashboard/blob/main/app/pages${route.path === "/" ? "/index" : route.path}.vue`,
        target: "_blank",
      },
    ],
  },
]);
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <NuxtLink to="/dashboard"><AppLogo :collapsed="collapsed" /></NuxtLink>
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton
          :collapsed="collapsed"
          class="bg-transparent ring-default"
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>
    <UDashboardSearch :groups="groups" />

    <slot />

    <NotificationsSlideover />
  </UDashboardGroup>
</template>
