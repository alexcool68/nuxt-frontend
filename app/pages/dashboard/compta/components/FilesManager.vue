<script setup lang="ts">
import type { Step, File } from "~/types/compta";

import FilesList from "./FilesManagerList.vue";
import AddFileToStep from "../forms/AddFileToStep.vue";

const props = defineProps<{
  open: boolean;
  step: Step | undefined;
}>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "refresh"): void;
}>();

// COMPUTED
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit("update:open", value),
});

// STATE
const config = useRuntimeConfig();
const toast = useToast();

const baseURL = config.public.authBaseUrl || "http://localhost:3333";

// État des Modales
const isFileDeleteModalOpen = ref(false);

// Données temporaires pour les formulaires
const newFile = ref<Partial<File>>({
  stepId: 0,
  direction: "IN",
  logicalName: "",
  defaultPhysicalName: "",
  defaultCopybook: "",
});

// Current data
const currentFile = ref<File | undefined>(undefined);

// FONCTIONS
async function createFile() {
  if (!props.step || !newFile) return;

  //const stepId = props.step.id;

  try {
    await $fetch(`${baseURL}/api/v1/files`, {
      method: "POST",
      body: { ...newFile.value, stepId: props.step.id },
    });

    newFile.value = {
      stepId: 0,
      direction: "IN",
      logicalName: "",
      defaultPhysicalName: "",
      defaultCopybook: "",
    };

    emit("refresh");
  } catch (e: any) {
    formatAndDisplayErrors(e);
  }
}

async function deleteFile() {
  if (!currentFile.value || !props.step) return;

  const fileId = currentFile.value.id;

  try {
    await $fetch(`${baseURL}/api/v1/files/${fileId}`, {
      method: "DELETE",
    });

    isFileDeleteModalOpen.value = false;
    currentFile.value = undefined;
    newFile.value = {
      direction: "IN",
      logicalName: "",
      defaultPhysicalName: "",
      defaultCopybook: "",
    };

    emit("refresh");
  } catch (e: any) {
    formatAndDisplayErrors(e);
  }
}

// OUVRIR MODAL
function confirmDeleteFile(file: File) {
  if (!file) return;

  currentFile.value = file;
  isFileDeleteModalOpen.value = true;
}

// HELPERS
function formatAndDisplayErrors(e: any) {
  let errorTitle = "Erreur";
  let errorDescription = "Une erreur inattendue est survenue.";
  if (
    e.data?.errors &&
    Array.isArray(e.data.errors) &&
    e.data.errors.length > 0
  ) {
    errorTitle =
      e.data.errors.length > 1
        ? "Erreurs de validation"
        : "Erreur de validation";
    errorDescription = e.data.errors
      .map((err: { message: string }) => `• ${err.message}`)
      .join("\n");
  } else if (e.data?.message) {
    errorDescription = e.data.message;
  }
  toast.add({
    title: errorTitle,
    description: errorDescription,
    color: "error",
    icon: "i-lucide-alert-circle",
  });
}
</script>

<template>
  <div>
    <AppModal
      v-model="isFileDeleteModalOpen"
      class="z-50"
      :ui="{ footer: 'justify-end' }"
      description="Modal for delete a File Step"
    >
      <template #header>
        <UIcon name="i-lucide-triangle-alert" class="size-6 text-primary" />
        Supprimer le fichier de l'étape ?
      </template>
      <!-- <template #body> -->
      <div class="space-y-4">
        <p>
          Vous êtes sur le point de supprimer du step
          <span class="font-bold text-primary">{{ step?.name }}</span> le
          fichier suivant :
        </p>
        <ul class="ml-5 list-disc">
          <li>Logical name : {{ currentFile?.logicalName }}</li>
          <li v-if="currentFile?.defaultPhysicalName">
            Physical name : {{ currentFile?.defaultPhysicalName }}
          </li>
        </ul>

        <p class="text-sm text-muted">
          Cette action est irréversible et supprimera tous le fichier associés.
        </p>
      </div>
      <!-- </template> -->
      <template #footer>
        <UButton
          color="neutral"
          variant="ghost"
          @click="isFileDeleteModalOpen = false"
          label="Annuler"
        />

        <UButton
          color="error"
          variant="solid"
          @click="deleteFile"
          label="Confirmer la suppression"
        />
      </template>
    </AppModal>

    <USlideover
      v-model:open="isOpen"
      :ui="{ content: 'w-screen !max-w-lg' }"
      description=""
    >
      <template #description></template>
      <template #title>
        Fichiers du Step
        <p class="text-primary font-mono text-sm mt-1">
          {{ step?.name }}
        </p>
      </template>
      <template #body>
        <div class="flex flex-col flex-1 h-full gap-5">
          <AddFileToStep @submit="createFile" v-model="newFile" />

          <USeparator orientation="horizontal" />

          <FilesList :files="step?.files" @delete-file="confirmDeleteFile" />
        </div>
      </template>
    </USlideover>
  </div>
</template>
