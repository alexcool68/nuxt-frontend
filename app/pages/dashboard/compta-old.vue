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
    // {
    //   label: "DP01",
    //   to: "/dashboard/compta/DP01",
    //   exact: true,
    // },
  ],
  [],
] satisfies NavigationMenuItem[][];
</script>

<template>
  <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full mx-auto p-4">
    <NuxtPage />
  </div>
</template>
