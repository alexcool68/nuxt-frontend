<script setup lang="ts">
import type { Chain } from "~/types/compta";

const emit = defineEmits<{
  (e: "submit"): void;
}>();

function handleSubmit() {
  emit("submit");
}

const newChain = defineModel<Partial<Chain>>({ required: true });
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <UFormField label="Code JCL" help="Exemple : GJ01" required>
      <UInput
        v-model="newChain.code"
        placeholder="GJ..."
        autofocus
        class="w-full"
      />
    </UFormField>

    <UFormField label="Description" hint="Optional">
      <UInput
        v-model="newChain.description"
        placeholder="Traitement Comptable..."
        class="w-full"
      />
    </UFormField>
  </form>
</template>
