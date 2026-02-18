<script setup lang="ts">
import type { Step } from "~/types/compta";

const emit = defineEmits<{
  (e: "submit"): void;
}>();

function handleSubmit() {
  emit("submit");
}

const newStep = defineModel<Partial<Step>>({ required: true });
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <UFormField label="Ordre (Rank)" required>
      <UInput v-model="newStep.rank" type="number" />
    </UFormField>

    <UFormField
      label="Nom du Programme"
      help="Nom exact du PGM"
      class="w-full"
      required
    >
      <UInput
        v-model="newStep.name"
        placeholder="GJ01005"
        autofocus
        class="w-full"
      />
    </UFormField>
  </form>
</template>
