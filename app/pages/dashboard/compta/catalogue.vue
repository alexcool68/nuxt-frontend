<script setup lang="ts">
import type { Chain, Step } from "~/types/compta";

import FilesManager from "./components/FilesManager.vue";
import AddChain from "./forms/AddChain.vue";
import AddStepToChain from "./forms/AddStepToChain.vue";

useSeoMeta({
  title: "Dashboard - Compta - Catalogue",
  description: "",
});

// DIVERS
const config = useRuntimeConfig();
const toast = useToast();

const baseURL = config.public.authBaseUrl || "http://localhost:3333";

// Chargement des données
const {
  data: chains,
  error,
  refresh,
} = await useFetch<Chain[]>(`${baseURL}/api/v1/formatted-chains`);

// loading
const isLoading = ref(false);

// État des Modales
const isChainModalOpen = ref(false);
const isStepModalOpen = ref(false);
const isChainDeleteModalOpen = ref(false);
const isStepDeleteModalOpen = ref(false);
const isFileSlideoverOpen = ref(false);

// Données temporaires pour les formulaires
const newChain = ref<Partial<Chain>>({ code: "", description: "" });
const newStep = ref<Partial<Step>>({ chainId: 0, name: "", rank: 10 });

// Current data
const currentStep = ref<Step | undefined>(undefined);
const currentChain = ref<Chain | undefined>(undefined);

// watch for updated step and file
watch(chains, (newChains) => {
  if (currentStep.value && newChains) {
    const updatedStep = newChains
      .flatMap((chain) => chain.steps)
      .find((step) => step.id === currentStep.value!.id);
    currentStep.value = updatedStep;
  }
});

// FONCTIONS
async function createChain() {
  if (!newChain.value.code) return;

  try {
    await $fetch(`${baseURL}/api/v1/chains`, {
      method: "POST",
      body: newChain.value,
    });

    isChainModalOpen.value = false;
    newChain.value = {};

    await refresh();
  } catch (e: any) {
    formatAndDisplayErrors(e);
  }
}

async function createStep() {
  if (!newStep.value.chainId) return;

  try {
    await $fetch(`${baseURL}/api/v1/steps`, {
      method: "POST",
      body: {
        chainId: newStep.value.chainId,
        name: newStep.value.name,
        rank: newStep.value.rank,
      },
    });

    isStepModalOpen.value = false;
    newStep.value = {};

    await refresh();
  } catch (e: any) {
    formatAndDisplayErrors(e);
  }
}

async function deleteChain() {
  if (!currentChain.value) return;

  try {
    await $fetch(`${baseURL}/api/v1/chains/${currentChain.value.id}`, {
      method: "DELETE",
    });

    await refresh();

    isChainDeleteModalOpen.value = false;
    currentChain.value = undefined;
  } catch (e: any) {
    formatAndDisplayErrors(e);
  }
}

async function deleteStep() {
  if (!currentStep.value) return;

  try {
    await $fetch(`${baseURL}/api/v1/steps/${currentStep.value.id}`, {
      method: "DELETE",
    });

    await refresh();

    isStepDeleteModalOpen.value = false;
    currentStep.value = undefined;
  } catch (e: any) {
    formatAndDisplayErrors(e);
  }
}

// OUVRIR MODAL
function openStepModal(chain: Chain) {
  if (!chain) return;

  newStep.value = {
    name: "",
    rank: (chain.steps.length + 1) * 10,
    chainId: chain.id,
  };
  isStepModalOpen.value = true;
}

function confirmDeleteChain(chain: Chain) {
  if (!currentChain) return;

  currentChain.value = chain;
  isChainDeleteModalOpen.value = true;
}

function confirmDeleteStep(step: Step) {
  if (!currentStep) return;

  currentStep.value = step;
  isStepDeleteModalOpen.value = true;
}

// SLIDEOVER
function manageFiles(step: Step) {
  if (!currentStep) return;

  currentStep.value = step;
  isFileSlideoverOpen.value = true;
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
  <div v-if="error">
    <UAlert
      title="Erreur de chargement"
      :description="`Impossible de récupérer les chaines.`"
      icon="i-lucide-terminal"
      color="error"
      variant="subtle"
    />
  </div>

  <div v-else class="space-y-6 min-h-screen">
    <!-- TITLE -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold">Catalogue JCL</h1>
        <p>Définition physique des chaînes et programmes.</p>
      </div>
      <UButton icon="i-lucide-plus" size="md" @click="isChainModalOpen = true">
        Nouvelle Chaîne
      </UButton>
    </div>

    <!-- CHAIN EMPTY -->
    <UEmpty
      v-if="chains?.length === 0"
      icon="i-lucide-link-2-off"
      title="Aucune chaine en base."
      description="It looks like you haven't added any chain to this step. Create one to get started."
    />

    <div class="grid grid-cols-1 gap-5">
      <UCard v-for="chain in chains" :key="chain.id" variant="soft">
        <template #header>
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-5">
              <UBadge size="lg" color="neutral" variant="solid">{{
                chain.code
              }}</UBadge>
              <span class="font-medium">{{ chain.description }}</span>
            </div>
            <div class="flex justify-items-center gap-2">
              <UButton
                size="sm"
                color="neutral"
                variant="ghost"
                icon="i-lucide-plus"
                label="Ajouter Step"
                @click="openStepModal(chain)"
              >
              </UButton>
              <UButton
                size="sm"
                color="error"
                variant="ghost"
                icon="i-lucide-trash"
                label="Delete"
                @click="confirmDeleteChain(chain)"
              />
            </div>
          </div>
        </template>

        <!-- STEP CONTENT -->
        <div v-if="chain.steps && chain.steps.length" class="space-y-2">
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
                      {{ getTotalFilestepByDirection(step, "IN") }}
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
                      {{ getTotalFilestepByDirection(step, "OUT") }}
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
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-file-stack"
                  @click="manageFiles(step)"
                  label="Fichiers"
                />
                <UButton
                  size="sm"
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

        <!-- STEP EMPTY -->
        <div v-else class="text-sm text-muted italic text-center py-4">
          <UEmpty
            icon="i-lucide-redo-dot"
            title="Aucun step configuré."
            description="It looks like you haven't added any step to this chain. Create one to get started."
          />
        </div>
      </UCard>
    </div>

    <!-- isChainModalOpen -->
    <AppModal
      v-model="isChainModalOpen"
      :ui="{ footer: 'justify-end' }"
      title="Add a new chain"
      description="Please fill the form below"
    >
      <AddChain v-model="newChain" @submit="createChain" />

      <template #footer>
        <UButton
          color="neutral"
          variant="ghost"
          @click="isChainModalOpen = false"
          label="Annuler"
        />

        <UButton @click="createChain">Créer</UButton>
      </template>
    </AppModal>

    <!-- isStepModalOpen -->
    <AppModal
      v-model="isStepModalOpen"
      :ui="{ footer: 'justify-end' }"
      title="Add a new step"
      description="Please select a rank and a name for this step"
    >
      <AddStepToChain v-model="newStep" @submit="createStep" />

      <template #footer>
        <UButton
          color="neutral"
          variant="ghost"
          @click="isStepModalOpen = false"
          label="Annuler"
        />
        <UButton @click="createStep">Ajouter</UButton>
      </template>
    </AppModal>

    <!-- isChainDeleteModalOpen -->
    <AppModal
      v-model="isChainDeleteModalOpen"
      title="Suppression d'une chaîne"
      description="Êtes-vous sûr de vouloir supprimer cet élément ?"
      confirm-label="Oui, supprimer"
      cancel-label="Non, retour"
      confirm-color="red"
      :loading="isLoading"
      @confirm="deleteChain"
    >
      <div class="space-y-4">
        <p>
          <strong class="text-error">{{ currentChain?.code }}</strong>
        </p>

        <p class="text-sm text-muted">
          Cette action est irréversible et supprimera tous les steps et
          configurations associés.
        </p>
      </div>
    </AppModal>

    <!-- isStepDeleteModalOpen -->
    <AppModal
      v-model="isStepDeleteModalOpen"
      title="Suppression d'un STEP"
      description="Êtes-vous sûr de vouloir supprimer cet élément ?"
      confirm-label="Oui, supprimer"
      cancel-label="Non, retour"
      confirm-color="red"
      :loading="isLoading"
      @confirm="deleteStep"
    >
      <div class="space-y-4">
        <p>
          <strong class="text-error">{{ currentStep?.name }}</strong>
        </p>

        <p class="text-sm text-muted">
          Cette action est irréversible et supprimera tous les steps et
          configurations associés.
        </p>
      </div>
    </AppModal>

    <FilesManager
      v-model:open="isFileSlideoverOpen"
      :step="currentStep"
      @refresh="refresh"
    />
  </div>
</template>
