<script setup lang="ts">
import type { Chain, Step } from "~/types/compta";
import { watch } from "vue";

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
const isLoading = ref(false);
const isChainModalOpen = ref(false);
const isStepModalOpen = ref(false);

const isChainDeleteModalOpen = ref(false);
const isStepDeleteModalOpen = ref(false);

const isFileSlideoverOpen = ref(false);

// Données temporaires pour les formulaires
const newChain = ref({ code: "", description: "" });
const newStep = ref({ name: "", rank: 10, chainId: 0 });

const currentStep = ref<Step | null>(null);
const currentChain = ref<Chain | null>(null);
// Le step nest pas supprimer la premiere fois mais apres OK, bizzare ....
watch(
  chains,
  (newChains) => {
    console.log("currentStep.value", currentStep.value);

    if (currentStep.value && newChains) {
      const updatedStep = newChains
        .flatMap((chain) => chain.steps)
        .find((step) => step.id === currentStep.value!.id);
      currentStep.value = updatedStep || null;
    }
  },
  { deep: true },
);
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

// 3. SLIDEOVER
function manageFiles(step: Step) {
  currentStep.value = step;
  isFileSlideoverOpen.value = true;
}

// 4. SUPPRIMER
async function deleteChain() {
  if (!currentChain.value) return;

  try {
    await $fetch(`${baseURL}/api/chains/${currentChain.value.id}`, {
      method: "DELETE",
    });

    await refresh();

    isChainDeleteModalOpen.value = false;
    currentChain.value = null;
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

    await refresh();

    isStepDeleteModalOpen.value = false;
    currentStep.value = null;
  } catch (e: any) {
    formatAndDisplayErrors(e);
  }
}

// 5. HELPERS

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
      <UButton icon="i-lucide-plus" size="md" @click="isChainModalOpen = true">
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
    <UModal
      v-model:open="isChainModalOpen"
      :ui="{ footer: 'justify-end' }"
      title="Ajouter une nouvelle chaîne"
      description=""
    >
      <template #description></template>
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

    <!-- isStepModalOpen -->
    <UModal
      v-model:open="isStepModalOpen"
      :ui="{ footer: 'justify-end' }"
      title="Ajouter un nouveau Step"
      description=""
    >
      <template #description></template>
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

    <DashboardComptaStepFilesManager
      v-model:open="isFileSlideoverOpen"
      :step="currentStep"
      @refresh="refresh"
    />
  </div>
</template>
