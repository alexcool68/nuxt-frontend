<script setup lang="ts">
import type { File } from "~/types/compta";

const emit = defineEmits<{
  (e: "submit"): void;
}>();

function handleSubmit() {
  emit("submit");
}

const newFile = defineModel<Partial<File>>({ required: true });
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="p-4 rounded-md border bg-elevated border-default space-y-3">
      <div class="text-xs font-bold uppercase text-muted tracking-wider">
        Ajouter un fichier
      </div>

      <div class="flex gap-2">
        <UFormField class="w-20" label="direction" required>
          <USelect
            v-model="newFile.direction"
            :items="['IN', 'OUT']"
            class="w-full"
          />
        </UFormField>
        <UFormField class="flex-1" label="Logical name" required>
          <UInput
            v-model="newFile.logicalName"
            placeholder="ex : BECT"
            class="w-full"
          />
        </UFormField>
      </div>
      <UFormField class="flex-1" label="Physical name" hint="Optional">
        <UInput
          v-model="newFile.defaultPhysicalName"
          class="w-full"
          placeholder="ex: SPE.GJ01005"
        />
      </UFormField>
      <UFormField class="flex-1" label="Copy for this file" hint="Recommanded">
        <UInput
          v-model="newFile.defaultCopybook"
          class="w-full"
          placeholder="ex: CFDP008R"
        />
      </UFormField>

      <UButton block icon="i-lucide-plus" type="submit" label="Ajouter" />
    </div>
  </form>
</template>
