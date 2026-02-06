<script setup lang="ts">
import type { Chain, Step, StepFile } from "~/types/compta";

useSeoMeta({
  title: "Dashboard - Compta - Catalogue",
  description: "",
});

// --- STATE ---
const config = useRuntimeConfig();
const baseURL = config.public.authBaseUrl || "http://localhost:3333"; // Ajuste selon ton .env
const toast = useToast();

// Chargement des données
const {
  data: chains,
  error,
  refresh,
} = await useFetch<Chain[]>(`${baseURL}/api/chains`);

// État des Modales
const isChainModalOpen = ref(false);
const isStepModalOpen = ref(false);

const isChainDeleteModalOpen = ref(false);
const isStepDeleteModalOpen = ref(false);
const isStepFileDeleteModalOpen = ref(false);

const isFileSlideoverOpen = ref(false);

// Données temporaires pour les formulaires
const newChain = ref({ code: "", description: "" });
const newStep = ref({ name: "", rank: 10, chainId: 0 });
const newFile = ref({
  direction: "IN",
  logicalName: "",
  defaultPhysicalName: "",
  defaultCopybook: "",
});

const currentStep = ref<Step | null>(null);
const currentChain = ref<Chain | null>(null);
const currentStepFile = ref<StepFile | null>(null);

// 1. CRÉER
async function createChain() {
  if (!newChain.value.code) return;

  try {
    await $fetch(`${baseURL}/api/chains`, {
      method: "POST",
      body: newChain.value,
    });

    isChainModalOpen.value = false;
    newChain.value = { code: "", description: "" };

    await refresh();
  } catch (e: any) {
    formatAndDisplayErrors(e);
  }
}

async function createStep() {
  if (!newStep.value.name) return;

  try {
    await $fetch(`${baseURL}/api/chains/${newStep.value.chainId}/steps`, {
      method: "POST",
      body: { name: newStep.value.name, rank: newStep.value.rank },
    });

    isStepModalOpen.value = false;

    await refresh();
  } catch (e: any) {
    formatAndDisplayErrors(e);
  }
}

async function createFileStep() {
  if (!currentStep.value) return;

  const stepId = currentStep.value.id;

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

    await refresh();

    updateCurrentStep(stepId!);
  } catch (e: any) {
    formatAndDisplayErrors(e);
  }
}

// 2. OUVRIR MODAL
function openStepModal(chain: Chain) {
  if (!chain.id) return;

  newStep.value = {
    name: "",
    rank: (chain.steps.length + 1) * 10,
    chainId: chain.id,
  };
  isStepModalOpen.value = true;
}

function confirmDeleteChain(chain: Chain) {
  currentChain.value = chain;
  isChainDeleteModalOpen.value = true;
}

function confirmDeleteStep(step: Step) {
  currentStep.value = step;
  isStepDeleteModalOpen.value = true;
}

function confirmDeleteStepFile(stepFile: StepFile) {
  currentStepFile.value = stepFile;
  isStepFileDeleteModalOpen.value = true;
}

// 3. SLIDEOVER
function manageFiles(step: Step) {
  currentStep.value = step;
  isFileSlideoverOpen.value = true;
}

function updateCurrentStep(stepId: number) {
  if (!chains.value) return;

  const updatedStep = chains.value
    .flatMap((chain) => chain.steps)
    .find((step) => step.id === stepId);

  currentStep.value = updatedStep || null;
}

// 4. SUPPRIMER
async function deleteChain() {
  if (!currentChain.value) return;

  try {
    await $fetch(`${baseURL}/api/chains/${currentChain.value.id}`, {
      method: "DELETE",
    });

    isChainDeleteModalOpen.value = false;
    currentChain.value = null;

    await refresh();
  } catch (e: any) {
    formatAndDisplayErrors(e);
  }
}

async function deleteStep() {
  if (!currentStep.value) return;

  const stepId = currentStep.value.id;

  try {
    await $fetch(`${baseURL}/api/steps/${stepId}`, {
      method: "DELETE",
    });

    isStepDeleteModalOpen.value = false;
    currentStep.value = null;

    await refresh();
  } catch (e: any) {
    formatAndDisplayErrors(e);
  }
}

async function deleteStepFile() {
  if (!currentStepFile.value || !currentStep.value) return;

  const stepId = currentStep.value.id;
  const fileId = currentStepFile.value.id;

  try {
    await $fetch(`${baseURL}/api/steps/${stepId}/files/${fileId}`, {
      method: "DELETE",
    });

    isStepFileDeleteModalOpen.value = false;
    currentStepFile.value = null;

    await refresh();

    updateCurrentStep(stepId!);
  } catch (e: any) {
    formatAndDisplayErrors(e);
  }
}

// 5. HELPERS
function getFileCountByDirection(step: Step, direction: "IN" | "OUT"): number {
  return (
    step.possibleFiles?.filter((f) => f.direction === direction).length || 0
  );
}

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
  <!-- <div v-if="status === 'pending'" class="space-y-4">
    <USkeleton class="h-64 w-full" />
  </div> -->

  <div v-if="error">
    <UAlert
      title="Erreur de chargement"
      :description="`Impossible de récupérer les chaines.`"
      icon="i-lucide-terminal"
      color="error"
      variant="subtle"
    />
  </div>

  <div class="space-y-6 min-h-screen">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold">Catalogue JCL</h1>
        <p>Définition physique des chaînes et programmes.</p>
      </div>
      <UButton icon="i-lucide-plus" size="lg" @click="isChainModalOpen = true">
        Nouvelle Chaîne
      </UButton>
    </div>

    <UEmpty
      v-if="chains?.length === 0"
      icon="i-lucide-link-2-off"
      title="Aucune chaine en base."
      description="It looks like you haven't added any chain to this step. Create one to get started."
    />

    <div class="grid grid-cols-1 gap-5">
      <UCard v-for="chain in chains" :key="chain.id">
        <template #header>
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-5">
              <UBadge size="lg" color="neutral" variant="solid">{{
                chain.code
              }}</UBadge>
              <span class="font-medium">{{ chain.description }}</span>
            </div>
            <div>
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-lucide-plus"
                @click="openStepModal(chain)"
              >
                Ajouter Step
              </UButton>
              <UButton
                size="xs"
                color="error"
                variant="ghost"
                icon="i-lucide-trash"
                @click="confirmDeleteChain(chain)"
                label="Delete"
              />
            </div>
          </div>
        </template>

        <div v-if="chain.steps?.length" class="space-y-2">
          <UCard v-for="step in chain.steps" :key="step.id">
            <div
              class="grid grid-cols-1 items-center gap-4 md:grid-cols-3 md:gap-5"
            >
              <div class="flex justify-start items-center gap-5">
                <UBadge color="neutral" variant="soft" size="md">{{
                  step.rank
                }}</UBadge>
                <span class="font-mono font-bold">{{ step.name }}</span>
              </div>

              <div
                class="flex items-center gap-10 justify-start md:justify-center"
              >
                <div class="flex items-center">
                  <div class="flex items-center justify-center shrink-0">
                    <UIcon
                      name="i-lucide-arrow-down-right"
                      color="primary"
                      class="size-8 text-primary"
                    />
                  </div>

                  <div class="ml-2 text-center">
                    <p class="text-xl font-bold">
                      {{ getFileCountByDirection(step, "IN") }}
                    </p>
                    <p class="text-sm font-medium text-muted">
                      Entrées (Input)
                    </p>
                  </div>
                </div>

                <div class="flex items-center">
                  <div class="flex items-center justify-center shrink-0">
                    <UIcon
                      name="i-lucide-arrow-up-right"
                      class="size-8 text-secondary"
                    />
                  </div>

                  <div class="ml-2 text-center">
                    <p class="text-xl font-bold">
                      {{ getFileCountByDirection(step, "OUT") }}
                    </p>
                    <p class="text-sm font-medium text-muted">
                      Sorties (Output)
                    </p>
                  </div>
                </div>
              </div>
              <div class="flex justify-start gap-2 md:justify-end">
                <UButton
                  size="sm"
                  color="primary"
                  variant="solid"
                  icon="i-lucide-file-stack"
                  @click="manageFiles(step)"
                  label="Fichiers"
                />
                <UButton
                  size="xs"
                  color="error"
                  variant="ghost"
                  icon="i-lucide-trash"
                  @click="confirmDeleteStep(step)"
                  label="Delete"
                />
              </div>
            </div>
          </UCard>
        </div>

        <div v-else class="text-sm text-muted italic text-center py-4">
          <UEmpty
            icon="i-lucide-redo-dot"
            title="Aucun step configuré."
            description="It looks like you haven't added any step to this chain. Create one to get started."
          />
        </div>
      </UCard>
    </div>

    <UModal v-model:open="isChainModalOpen" :ui="{ footer: 'justify-end' }">
      <template #header>Nouvelle Chaîne</template>
      <template #body>
        <div class="space-y-4">
          <form @submit.prevent="createChain" class="space-y-4">
            <UFormField label="Code JCL" help="Exemple : GJ01">
              <UInput
                v-model="newChain.code"
                placeholder="GJ..."
                autofocus
                class="w-full"
              />
            </UFormField>

            <UFormField label="Description">
              <UInput
                v-model="newChain.description"
                placeholder="Traitement Comptable..."
                class="w-full"
              />
            </UFormField>
          </form>
        </div>
      </template>
      <template #footer>
        <UButton
          color="neutral"
          variant="ghost"
          @click="isChainModalOpen = false"
          >Annuler</UButton
        >
        <UButton @click="createChain">Créer</UButton>
      </template>
    </UModal>

    <UModal v-model:open="isStepModalOpen" :ui="{ footer: 'justify-end' }">
      <template #header>Nouveau Step</template>
      <template #body>
        <div class="space-y-4">
          <form @submit.prevent="createStep" class="space-y-4">
            <UFormField label="Ordre (Rank)">
              <UInput v-model="newStep.rank" type="number" />
            </UFormField>

            <UFormField
              label="Nom du Programme"
              help="Nom exact du PGM"
              class="flex-1"
            >
              <UInput
                v-model="newStep.name"
                placeholder="GJ01005"
                autofocus
                class="w-full"
              />
            </UFormField>
          </form>
        </div>
      </template>
      <template #footer>
        <UButton
          color="neutral"
          variant="ghost"
          @click="isStepModalOpen = false"
          >Annuler</UButton
        >
        <UButton @click="createStep">Ajouter</UButton>
      </template>
    </UModal>

    <UModal
      v-model:open="isChainDeleteModalOpen"
      :ui="{ footer: 'justify-end' }"
    >
      <template #header>
        <UIcon name="i-lucide-triangle-alert" class="size-6 text-primary" />
        Supprimer la chaîne ?
      </template>
      <template #body>
        <div class="space-y-4">
          <p>
            Vous êtes sur le point de supprimer la chaîne
            <strong>{{ currentChain?.code }}</strong
            >.
          </p>
          <p class="text-sm text-muted">
            Cette action est irréversible et supprimera tous les steps et
            configurations associés.
          </p>
        </div>
      </template>
      <template #footer>
        <UButton
          color="neutral"
          variant="ghost"
          @click="isChainDeleteModalOpen = false"
          label="Annuler"
        >
        </UButton>
        <UButton
          color="error"
          variant="solid"
          @click="deleteChain"
          label="Confirmer la suppression"
        >
        </UButton>
      </template>
    </UModal>

    <UModal
      v-model:open="isStepDeleteModalOpen"
      :ui="{ footer: 'justify-end' }"
    >
      <template #header>
        <UIcon name="i-lucide-triangle-alert" class="size-6 text-primary" />
        Supprimer le step ?
      </template>
      <template #body>
        <div class="space-y-4">
          <p>
            Vous êtes sur le point de supprimer le step
            <strong>{{ currentStep?.name }}</strong
            >.
          </p>
          <p class="text-sm text-muted">
            Cette action est irréversible et supprimera tous les steps et
            configurations associés.
          </p>
        </div>
      </template>
      <template #footer>
        <UButton
          color="neutral"
          variant="ghost"
          @click="isStepDeleteModalOpen = false"
          label="Annuler"
        >
        </UButton>
        <UButton
          color="error"
          variant="solid"
          @click="deleteStep"
          label="Confirmer la suppression"
        >
        </UButton>
      </template>
    </UModal>

    <UModal
      v-model:open="isStepFileDeleteModalOpen"
      class="z-50"
      :ui="{ footer: 'justify-end' }"
    >
      <template #header>
        <UIcon
          name="i-lucide-triangle-alert"
          class="size-6 text-primary"
        />
        Supprimer le fichier de l'étape ?
      </template>
      <template #body>
        <div class="space-y-4">
          <p>
            Vous êtes sur le point de supprimer du step <span class="text-primary font-bold">{{  currentStep?.name }}</span> le fichier suivant : </P>
            <ul class="list-disc ml-5">
              <li>{{ currentStepFile?.logicalName }}</li>
              <li v-if="currentStepFile?.defaultPhysicalName">{{ currentStepFile?.defaultPhysicalName }}</li>
            </ul>
          
          <p class="text-sm text-muted">
            Cette action est irréversible et supprimera tous le fichier
            associés.
          </p>
        </div>
      </template>
      <template #footer>
        <UButton
          color="neutral"
          variant="ghost"
          @click="isStepFileDeleteModalOpen = false"
          label="Annuler"
        >
        </UButton>
        <UButton
          color="error"
          variant="solid"
          @click="deleteStepFile"
          label="Confirmer la suppression"
        >
        </UButton>
      </template>
    </UModal>

    <USlideover
      v-model:open="isFileSlideoverOpen"
      :ui="{ content: 'w-screen !max-w-lg' }"
    >
      <template #title>
        Fichiers du Step
        <p class="text-primary font-mono text-sm mt-1">
          {{ currentStep?.name }}
        </p>
      </template>
      <template #body>
        <div class="flex flex-col gap-5">
          <div
            class="p-4 rounded-md border bg-elevated border-default space-y-3"
          >
            <div class="text-xs font-bold uppercase text-muted tracking-wider">
              Ajouter un fichier
            </div>

            <div class="flex gap-2">
              <UFormField class="w-18" label="direction">
                <USelect
                  v-model="newFile.direction"
                  :items="['IN', 'OUT']"
                  class="w-full"
                />
              </UFormField>
              <UFormField class="flex-1" label="Logical name">
                <UInput
                  v-model="newFile.logicalName"
                  placeholder="ex : BECT"
                  class="w-full"
                />
              </UFormField>
            </div>
            <UFormField class="flex-1" label="Physical name">
              <UInput
                class="w-full"
                v-model="newFile.defaultPhysicalName"
                placeholder="ex: SPE.GJ01005"
              />
            </UFormField>
            <UFormField class="flex-1" label="Copy for this file">
              <UInput
                class="w-full"
                v-model="newFile.defaultCopybook"
                placeholder="ex: CFDP008R"
              />
            </UFormField>

            <UButton block icon="i-lucide-plus" @click="createFileStep">
              Ajouter le fichier
            </UButton>
          </div>

          <USeparator orientation="horizontal" />
          <div class="space-y-2">
            <div
              v-for="file in currentStep?.possibleFiles"
              :key="file.id"
              class="p-3 border rounded-md text-sm relative group"
              :class="
                file.direction === 'IN' ? 'border-primary ' : 'border-secondary'
              "
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
                    :color="file.direction === 'IN' ? 'primary' : 'secondary'"
                  />
                  <UBadge
                    size="md"
                    class=""
                    :color="file.direction === 'IN' ? 'primary' : 'secondary'"
                    variant="soft"
                  >
                    {{ file.direction }}
                  </UBadge>
                </div>

                <!-- Logicalname et defaultPhysicalName -->
                <div class="flex-1 min-w-0">
                  <div class="font-medium">
                    <span>{{ file.logicalName }}</span>
                  </div>

                  <div
                    class="text-muted text-xs truncate uppercase tracking-wider"
                  >
                    {{
                      file.defaultPhysicalName || "Pas de fichier par défaut"
                    }}
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
                    @click="confirmDeleteStepFile(file)"
                    label="Delete"
                  />
                </div>
              </div>
            </div>

            <UEmpty
              v-if="!currentStep?.possibleFiles?.length"
              icon="i-lucide-file"
              title="Aucun fichier configuré."
              description="It looks like you haven't added any file to this step. Create one to get started."
            />
          </div>
        </div>
      </template>
    </USlideover>
  </div>
</template>
