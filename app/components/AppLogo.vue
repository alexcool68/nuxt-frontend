<script setup lang="ts">
defineProps<{
  collapsed?: boolean;
}>();
</script>

<template>
  <div class="text-xl flex items-center gap-2">
    <UIcon name="i-lucide-code-xml" class="w-8 h-8 text-primary" />
    <span v-if="!collapsed" class="font-bold">Alexis L.</span>
  </div>
</template>
