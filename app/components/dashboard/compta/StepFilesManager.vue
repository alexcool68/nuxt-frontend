<script setup lang="ts">
import type { Step, StepFile } from "~/types/compta";

const props = defineProps<{
  open: boolean;
  step: Step | null;
}>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "refresh"): void;
}>();

// --- STATE ---
const config = useRuntimeConfig();
const baseURL = config.public.authBaseUrl || "http://localhost:3333";
const toast = useToast();

const isStepFileDeleteModalOpen = ref(false);

const newFile = ref<StepFile>({
  direction: "IN",
  logicalName: "",
  defaultPhysicalName: "",
  defaultCopybook: "",
});

const currentStepFile = ref<StepFile | null>(null);

// --- COMPUTED ---
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit("update:open", value),
});

// --- METHODS ---

// 1. CRÉER
async function createFileStep() {
  if (!props.step) return;

  const stepId = props.step.id;

  try {
    await $fetch(`${baseURL}/api/steps/${stepId}/files`, {
      method: "POST",
      body: { ...newFile.value },
    });

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

// 2. OUVRIR MODAL
function confirmDeleteStepFile(stepFile: StepFile) {
  currentStepFile.value = stepFile;
  isStepFileDeleteModalOpen.value = true;
}

// 3. SUPPRIMER
async function deleteStepFile() {
  if (!currentStepFile.value || !props.step) return;

  const stepId = props.step.id;
  const fileId = currentStepFile.value.id;

  try {
    await $fetch(`${baseURL}/api/steps/${stepId}/files/${fileId}`, {
      method: "DELETE",
    });

    isStepFileDeleteModalOpen.value = false;
    currentStepFile.value = null;

    emit("refresh");
  } catch (e: any) {
    formatAndDisplayErrors(e);
  }
}

// 4. HELPERS
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
      v-model="isStepFileDeleteModalOpen"
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
          <li>Logical name : {{ currentStepFile?.logicalName }}</li>
          <li v-if="currentStepFile?.defaultPhysicalName">
            Physical name : {{ currentStepFile?.defaultPhysicalName }}
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
          @click="isStepFileDeleteModalOpen = false"
          label="Annuler"
        />

        <UButton
          color="error"
          variant="solid"
          @click="deleteStepFile"
          label="Confirmer la suppression"
        />
      </template>
    </AppModal>

    <USlideover
      v-model:open="isOpen"
      :ui="{ content: 'w-screen !max-w-lg' }"
      description="Slideover for handling the File Steps"
    >
      <template #title>
        Fichiers du Step
        <p class="text-primary font-mono text-sm mt-1">
          {{ step?.name }}
        </p>
      </template>
      <template #body>
        <div class="flex flex-col flex-1 h-full gap-5">
          <DashboardComptaFormFileForm
            @submit="createFileStep"
            v-model="newFile"
          />

          <USeparator orientation="horizontal" />

          <DashboardComptaFilesList
            :files="step?.possibleFiles"
            @delete-file="confirmDeleteStepFile"
          />
        </div>
      </template>
    </USlideover>
  </div>
</template>
