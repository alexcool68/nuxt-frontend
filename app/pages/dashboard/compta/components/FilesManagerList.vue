<script setup lang="ts">
import type { File } from "~/types/compta";

const props = defineProps<{
  files?: File[] | null;
}>();

const sortedFiles = computed(() => {
  if (!props.files) {
    return [];
  }
  return [...props.files].sort((a, b) => {
    if (a.direction === "IN" && b.direction === "OUT") {
      return -1;
    }
    if (a.direction === "OUT" && b.direction === "IN") {
      return 1;
    }
    return 0;
  });
});

const emit = defineEmits<{
  (e: "delete-file", file: File): void;
}>();

function deleteFile(file: File) {
  emit("delete-file", file);
}
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="file in sortedFiles"
      :key="file.id"
      class="p-3 border rounded-md text-sm relative group"
      :class="`border-${getFileColor(file)}`"
    >
      <div class="flex items-center gap-5">
        <!-- Icon et IN OUT -->
        <div class="flex gap-2 w-18 shrink-0 items-center">
          <UIcon
            :name="
              file.direction === 'IN'
                ? 'i-lucide-arrow-down-right'
                : 'i-lucide-arrow-up-right'
            "
            class="size-8"
            :class="`text-${getFileColor(file)}`"
          />
          <UBadge size="md" :color="getFileColor(file)" variant="soft">
            {{ file.direction }}
          </UBadge>
        </div>

        <!-- Logicalname et defaultPhysicalName -->
        <div class="flex-1 min-w-0">
          <div class="font-medium">
            <span>{{ file.logicalName }}</span>
          </div>

          <div class="text-muted text-xs truncate uppercase tracking-wider">
            {{ file.defaultPhysicalName || "Pas de fichier par défaut" }}
          </div>
        </div>

        <!-- Copybook et suppression -->
        <div class="flex items-center gap-2 shrink-1">
          <UTooltip text="Copybook">
            <UButton
              size="xs"
              color="neutral"
              variant="subtle"
              class="w-22"
              icon="i-lucide-book-copy"
              :label="file.defaultCopybook || 'NO CPY'"
            />
          </UTooltip>
          <UButton
            size="xs"
            color="error"
            variant="ghost"
            icon="i-lucide-trash"
            @click="deleteFile(file)"
            label="Delete"
          />
        </div>
      </div>
    </div>

    <UEmpty
      v-if="!sortedFiles.length"
      icon="i-lucide-file"
      title="Aucun fichier configuré."
      description="Il semble que vous n'ayez ajouté aucun fichier à cette étape. Créez-en un pour commencer."
    />
  </div>
</template>
