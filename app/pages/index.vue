<script setup lang="ts">
definePageMeta({
  auth: false,
});

useSeoMeta({
  title: "Index",
  description: "",
});
</script>

<template>
  <UPageHero>
    <!-- <template #top>
      <HeroBackground />
      <UPageSection> </UPageSection>
    </template> -->
    <template #title> Welcome to my APP !!</template>
  </UPageHero>
</template>
