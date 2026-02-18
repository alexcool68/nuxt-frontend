<script setup lang="ts">
import type { CatalogChain } from "~/types/compta";

interface Props {
  items: CatalogChain[] | undefined;
  existingChains?: { id: number }[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  items: undefined,
  existingChains: () => [],
  loading: false,
});

const selectedChainToAdd = ref<number | undefined>(undefined);

const emit = defineEmits<{
  (e: "submit", value: number | undefined): void;
}>();

function handleSubmit() {
  emit("submit", selectedChainToAdd.value);
  // On réinitialise le champ après l'envoi pour une meilleure UX
  selectedChainToAdd.value = undefined;
}

const availableChains = computed(() => {
  if (!props.items) {
    return [];
  }
  if (!props.existingChains || props.existingChains.length === 0) {
    return props.items;
  }

  const existingChainIds = new Set(props.existingChains.map((c) => c.id));
  return props.items.filter(
    (catalogChain) => !existingChainIds.has(catalogChain.id),
  );
});
</script>

<template>
  <UForm @submit.prevent="handleSubmit" class="flex space-x-4">
    <UFormField
      label="Ajouter une chaîne au parcours"
      class="w-full"
      orientation="horizontal"
    >
      <USelect
        v-model="selectedChainToAdd"
        placeholder="Sélectionner une chaîne..."
        :items="
          availableChains?.map((c) => ({
            label: `${c.code}${c.description ? ` - ${c.description}` : ''}`,
            value: c.id,
          })) || []
        "
        :disabled="availableChains.length === 0"
        option-attribute="label"
        value-attribute="value"
        class="w-72"
      />
    </UFormField>

    <UButton
      color="primary"
      icon="i-lucide-plus"
      :disabled="!selectedChainToAdd"
      label="Add"
      type="submit"
    />
  </UForm>
</template>
