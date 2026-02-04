<script setup lang="ts">
import type {
  WorkflowResponse,
  WorkflowRule,
  Chain,
  Step,
  StepFile,
} from "~/types/compta";

useSeoMeta({
  title: "Dashboard - Compta - Catalogue",
  description: "",
});

// --- STATE ---
const config = useRuntimeConfig();
const baseURL = config.public.authBaseUrl || "http://localhost:3333"; // Ajuste selon ton .env

// Chargement des données
const {
  data: chains,
  status,
  error,
  refresh,
} = await useFetch<Chain[]>(`${baseURL}/api/chains`);

// État des Modales
const isChainModalOpen = ref(false);
const isStepModalOpen = ref(false);
const isFileSlideoverOpen = ref(false);
const isDeleteModalOpen = ref(false);

// Données temporaires pour les formulaires
const newChain = ref({ code: "", description: "" });
const newStep = ref({ name: "", rank: 10, chainId: 0 });
const currentStepForFiles = ref<Step | null>(null);
const newFile = ref({
  direction: "IN",
  logicalName: "",
  defaultPhysicalName: "",
  defaultCopybook: "",
});
const chainToDelete = ref<Chain | null>(null);

// 1. CRÉER UNE CHAINE
async function createChain() {
  await $fetch(`${baseURL}/api/chains`, {
    method: "POST",
    body: newChain.value,
  });
  isChainModalOpen.value = false;
  newChain.value = { code: "", description: "" };
  refresh(); // Rafraîchit la liste
}

// 2. OUVRIR MODAL STEP
function openStepModal(chain: Chain) {
  newStep.value = {
    name: "",
    rank: (chain.steps.length + 1) * 10,
    chainId: chain.id,
  };
  isStepModalOpen.value = true;
}

// 3. CRÉER UN STEP
async function createStep() {
  await $fetch(`${baseURL}/api/chains/${newStep.value.chainId}/steps`, {
    method: "POST",
    body: { name: newStep.value.name, rank: newStep.value.rank },
  });
  isStepModalOpen.value = false;
  refresh();
}

// 4. GÉRER LES FICHIERS (Ouvrir Slideover)
function manageFiles(step: Step) {
  console.log(step.id);
  currentStepForFiles.value = step;
  isFileSlideoverOpen.value = true;
}

// 5. AJOUTER UN FICHIER
async function addFileToStep() {
  if (!currentStepForFiles.value) return;

  await $fetch(`${baseURL}/api/steps/${currentStepForFiles.value.id}/files`, {
    method: "POST",
    body: { ...newFile.value },
  });

  // Reset form fichier
  newFile.value = {
    direction: "IN",
    logicalName: "",
    defaultPhysicalName: "",
    defaultCopybook: "",
  };
  refresh(); // Rafraîchit pour voir le nouveau fichier
  // On ferme pas le slideover pour permettre d'en ajouter d'autres à la suite
}

// 6. CONFIRMER LA SUPPRESSION
function confirmDeleteChain(chain: Chain) {
  chainToDelete.value = chain;
  isDeleteModalOpen.value = true;
}

// 7. Exécute la suppression
async function deleteChain() {
  if (!chainToDelete.value) return;

  try {
    await $fetch(`${baseURL}/api/chains/${chainToDelete.value.id}`, {
      method: "DELETE",
    });

    // Ferme la modale et rafraîchit la liste
    isDeleteModalOpen.value = false;
    chainToDelete.value = null;
    await refresh();
  } catch (e) {
    alert("Erreur lors de la suppression");
  }
}
</script>

<template>
  <div v-if="status === 'pending'" class="space-y-4">
    <USkeleton class="h-64 w-full" />
  </div>

  <div v-else-if="error">
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
      <UButton
        icon="i-heroicons-plus"
        size="lg"
        @click="isChainModalOpen = true"
      >
        Nouvelle Chaîne
      </UButton>
    </div>

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
                icon="i-heroicons-plus"
                @click="openStepModal(chain)"
              >
                Ajouter Step
              </UButton>
              <UButton
                size="xs"
                color="error"
                variant="ghost"
                icon="i-heroicons-trash"
                @click="confirmDeleteChain(chain)"
                label="Delete"
              />
            </div>
          </div>
        </template>

        <div v-if="chain.steps?.length" class="space-y-2">
          <UCard v-for="step in chain.steps" :key="step.id">
            <div class="flex justify-between items-start">
              <div class="flex gap-2">
                <UBadge color="neutral" variant="soft" size="md">{{
                  step.rank
                }}</UBadge>
                <span class="font-mono font-bold">{{ step.name }}</span>
              </div>

              <div class="flex gap-2 gap-5 uppercase tracking-wider">
                <UBadge
                  icon="i-lucide-arrow-down-0-1"
                  size="md"
                  color="primary"
                  variant="soft"
                  >Entrées (Input)
                  {{
                    step.possibleFiles?.filter((f) => f.direction === "IN")
                      .length || 0
                  }}</UBadge
                >
                <UBadge
                  icon="i-lucide-arrow-up-1-0"
                  size="md"
                  color="secondary"
                  variant="soft"
                  >Sorties (Output)
                  {{
                    step.possibleFiles?.filter((f) => f.direction === "OUT")
                      .length || 0
                  }}</UBadge
                >
              </div>
              <div>
                <UButton
                  size="sm"
                  color="primary"
                  variant="solid"
                  icon="i-heroicons-document-duplicate"
                  @click="manageFiles(step)"
                  label="Fichiers"
                />
              </div>
            </div>
          </UCard>
        </div>
        <div v-else class="text-sm text-muted italic text-center py-4">
          <UEmpty
            icon="i-lucide-step-forward"
            title="Aucun step configuré."
            description="It looks like you haven't added any step to this chain. Create one to get started."
          />
        </div>
      </UCard>
    </div>

    <UModal v-model:open="isChainModalOpen">
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
        <div class="flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="isChainModalOpen = false"
            >Annuler</UButton
          >
          <UButton @click="createChain">Créer</UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="isStepModalOpen">
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
        <div class="flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="isStepModalOpen = false"
            >Annuler</UButton
          >
          <UButton @click="createStep">Ajouter</UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="isDeleteModalOpen">
      <template #header>
        <UIcon
          name="i-heroicons-exclamation-triangle"
          class="size-6 text-primary"
        />
        Supprimer la chaîne ?
      </template>
      <template #body>
        <div class="space-y-4">
          <p>
            Vous êtes sur le point de supprimer la chaîne
            <strong>{{ chainToDelete?.code }}</strong
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
          @click="isDeleteModalOpen = false"
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

    <USlideover v-model:open="isFileSlideoverOpen">
      <template #title>
        Fichiers du Step
        <p class="text-primary font-mono text-sm mt-1">
          {{ currentStepForFiles?.name }}
        </p>
      </template>
      <template #body>
        <div class="flex flex-col gap-6">
          <div
            class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3"
          >
            <h4
              class="text-xs font-bold uppercase text-gray-500 tracking-wider"
            >
              Ajouter un fichier
            </h4>

            <div class="flex gap-2">
              <UFormField class="w-32">
                <USelect
                  v-model="newFile.direction"
                  :items="['IN', 'OUT']"
                  class="w-full"
                />
              </UFormField>
              <UFormField class="flex-1">
                <UInput
                  v-model="newFile.logicalName"
                  placeholder="DDNAME (ex: SORTECR)"
                  class="w-full"
                />
              </UFormField>
            </div>

            <UInput
              v-model="newFile.defaultPhysicalName"
              placeholder="DSNAME (ex: APP.FILE...)"
            />
            <UInput
              v-model="newFile.defaultCopybook"
              placeholder="COPYBOOK (ex: CGE001)"
            />

            <UButton block icon="i-heroicons-plus" @click="addFileToStep">
              Ajouter le fichier
            </UButton>
          </div>

          <div class="space-y-3">
            <div
              v-for="file in currentStepForFiles?.possibleFiles"
              :key="file.id"
              class="p-3 border rounded-md text-sm relative group"
              :class="
                file.direction === 'IN'
                  ? 'border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-900/20'
                  : 'border-orange-200 bg-orange-50/50 dark:border-orange-900 dark:bg-orange-900/20'
              "
            >
              <div class="flex justify-between items-start font-bold">
                <span class="">{{ file.logicalName }}</span>
                <UBadge
                  size="xs"
                  :color="file.direction === 'IN' ? 'primary' : 'secondary'"
                  variant="soft"
                >
                  {{ file.direction }}
                </UBadge>
              </div>

              <div
                class="text-xs mt-1 truncate"
                :title="file.defaultPhysicalName"
              >
                {{ file.defaultPhysicalName || "Pas de fichier par défaut" }}
              </div>

              <div class="mt-2 flex items-center gap-1">
                <UIcon name="i-heroicons-document-text" class="w-3 h-3" />
                <span class="text-xs font-mono">{{
                  file.defaultCopybook || "N/A"
                }}</span>
              </div>
            </div>

            <div
              v-if="!currentStepForFiles?.possibleFiles?.length"
              class="text-center text-sm py-4"
            >
              Aucun fichier déclaré.
            </div>
          </div>
        </div>
      </template>
    </USlideover>
  </div>
</template>
