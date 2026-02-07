<script setup lang="ts">
import type {
  CatalogChain,
  Chain,
  ConfigStep,
  Movement,
  Step,
  StepFile,
} from "~/types/compta";

useSeoMeta({
  title: "Dashboard - Compta - Configuration",
  description: "",
});

// --- STATE ---
const config = useRuntimeConfig();
const baseURL = config.public.authBaseUrl || "http://localhost:3333"; // Ajuste selon ton .env
const toast = useToast();

// Chargement des données
const { data: movements, refresh: refreshMovements } = await useFetch<
  Movement[]
>(`${baseURL}/api/configurations/movements`);
const { data: catalogChains } = await useFetch<CatalogChain[]>(
  `${baseURL}/api/chains`,
);

const selectedMovementId = ref<number | null>(null);
const selectedMovement = computed(() =>
  movements.value?.find((m) => m.id === selectedMovementId.value),
);

//////////////////////////////////////////////////////////////////////////////////////8
// État des Modales
const isCreatedMvtModalOpen = ref(false);
const isRuleModalOpen = ref(false);

// const isChainDeleteModalOpen = ref(false);
// const isStepDeleteModalOpen = ref(false);
// const isStepFileDeleteModalOpen = ref(false);

// const isFileSlideoverOpen = ref(false);

// Forms
const newMovement = ref({ code: "", description: "" });
const selectedChainToAdd = ref<number | undefined>(undefined);
const newRule = ref({ message: "", fixInstruction: "", movementStepFileId: 0 });

// Context pour la règle
const currentFileContext = ref<{
  logicalName: string;
  stepName: string;
} | null>(null);
// Données temporaires pour les formulaires

// const currentStep = ref<Step | null>(null);
// const currentChain = ref<Chain | null>(null);
// const currentStepFile = ref<StepFile | null>(null);

async function createMovement() {
  try {
    const mvt = await $fetch<Movement>(`${baseURL}/api/movements`, {
      method: "POST",
      body: newMovement.value,
    });
    isCreatedMvtModalOpen.value = false;
    newMovement.value = { code: "", description: "" };
    await refreshMovements();
    selectedMovementId.value = mvt.id; // On sélectionne direct le nouveau
  } catch (e: any) {
    console.log("Erreur création mouvement");
  }
}

async function addChainToMovement() {
  if (!selectedMovementId.value || selectedChainToAdd.value === undefined)
    return;
  console.log(selectedMovement.value);
  try {
    // On calcule l'ordre (dernier + 10)
    const currentOrders = selectedMovement.value?.chains.length || 0;

    await $fetch(`${baseURL}/api/links/chain`, {
      method: "POST",
      body: {
        movementId: selectedMovementId.value,
        chainId: selectedChainToAdd.value,
        executionOrder: (currentOrders + 1) * 10,
      },
    });
    selectedChainToAdd.value = undefined;
    await refreshMovements();
  } catch (e: any) {
    console.log(e);
  }
}

async function removeChainFromMovement(movementChainId: number) {
  if (
    !confirm(
      "Voulez-vous vraiment retirer cette chaîne et toute sa configuration ?",
    )
  )
    return;

  try {
    await $fetch(`${baseURL}/api/links/chain/${movementChainId}`, {
      method: "DELETE",
    });
    await refreshMovements();
  } catch (e) {
    console.error("Erreur lors de la suppression de la chaîne", e);
  }
}

async function toggleStep(step: ConfigStep) {
  if (!selectedMovementId.value) return;

  // CAS 1 : On veut ACTIVER (Création du lien)
  if (!step.isActive) {
    try {
      await $fetch(`${baseURL}/api/links/step`, {
        method: "POST",
        body: {
          movementId: selectedMovementId.value,
          stepId: step.id,
        },
      });
      await refreshMovements();
    } catch (e) {
      console.error(e);
    }
  }
  // CAS 2 : On veut DÉSACTIVER (Suppression du lien)
  else {
    // On a besoin de l'ID de la liaison pour supprimer
    if (!step.movementStepId) return;

    try {
      await $fetch(`${baseURL}/api/links/step/${step.movementStepId}`, {
        method: "DELETE",
      });
      await refreshMovements();
    } catch (e) {
      console.error("Erreur lors de la désactivation du step", e);
    }
  }
}

// 4. Ouvrir Modale Règle
// Note: Il faut d'abord que le fichier soit "configuré" (movement_step_file créé).
// Pour simplifier, on va dire que cliquer sur "Ajouter Règle" crée la config fichier à la volée si besoin.
async function openRuleModal(
  step: ConfigStep,
  fileCatalogId: number,
  logicalName: string,
) {
  if (!step.movementStepId) return alert("Activez le step d'abord !");

  // 1. On s'assure que le fichier est "monitored" (création liaison)
  // En vrai prod, on vérifierait si 'files' contient déjà ce fileCatalogId
  let configId = step.files.find((f) => f.stepFileId === fileCatalogId)?.id;

  if (!configId) {
    try {
      const res = await $fetch<any>(`${baseURL}/api/links/file`, {
        method: "POST",
        body: {
          movementStepId: step.movementStepId,
          stepFileId: fileCatalogId,
          isMonitored: true,
        },
      });
      configId = res.id;
      await refreshMovements(); // Pour mettre à jour l'ID localement
    } catch (e: any) {
      return;
    }
  }

  // 2. On ouvre la modale
  newRule.value = {
    message: "",
    fixInstruction: "",
    movementStepFileId: configId!,
  };
  currentFileContext.value = { logicalName, stepName: step.name };
  isRuleModalOpen.value = true;
}

// 5. Sauvegarder la Règle
async function saveRule() {
  try {
    await $fetch(`${baseURL}/api/rules`, {
      method: "POST",
      body: newRule.value,
    });
    isRuleModalOpen.value = false;
    await refreshMovements();
  } catch (e) {
    console.error(e);
  }
}
</script>

<template>
  <div class="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
    <div
      class="w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col"
    >
      <div
        class="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center"
      >
        <h2 class="font-bold text-lg">Mouvements</h2>
        <UButton
          icon="i-heroicons-plus"
          color="primary"
          variant="ghost"
          @click="isCreatedMvtModalOpen = true"
        />
      </div>

      <div class="flex-1 overflow-y-auto p-2 space-y-2">
        <div
          v-for="mvt in movements"
          :key="mvt.id"
          @click="selectedMovementId = mvt.id"
          class="p-3 rounded-lg cursor-pointer transition-colors border"
          :class="
            selectedMovementId === mvt.id
              ? 'bg-primary-50 border-primary-200 dark:bg-primary-900/20 dark:border-primary-800'
              : 'bg-white border-transparent hover:bg-gray-50 dark:bg-transparent dark:hover:bg-gray-900'
          "
        >
          <div class="font-bold flex justify-between">
            <span>{{ mvt.code }}</span>
            <UIcon name="i-heroicons-chevron-right" class="text-gray-400" />
          </div>
          <div class="text-xs text-gray-500 truncate">
            {{ mvt.description }}
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 flex flex-col overflow-hidden">
      <div
        v-if="selectedMovement"
        class="p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
      >
        <h1 class="text-2xl font-bold flex items-center gap-3">
          <span class="text-primary">{{ selectedMovement.code }}</span>
          <span class="text-gray-400 font-light text-lg">|</span>
          <span class="text-lg font-normal">{{
            selectedMovement.description
          }}</span>
        </h1>
      </div>

      <div v-if="selectedMovement" class="flex-1 overflow-y-auto p-6 space-y-8">
        <div
          class="flex items-end gap-4 bg-gray-100 dark:bg-gray-800/50 p-4 rounded-lg"
        >
          <UFormField label="Ajouter une chaîne au parcours" class="flex-1">
            <USelect
              v-model="selectedChainToAdd"
              placeholder="Sélectionner une chaîne..."
              :items="
                catalogChains?.map((c) => ({
                  label: `${c.code} - ${c.description}`,
                  value: c.id,
                })) || []
              "
              option-attribute="label"
              value-attribute="value"
              class="w-full"
            />
          </UFormField>
          <UButton
            color="secondary"
            icon="i-heroicons-plus"
            :disabled="!selectedChainToAdd"
            @click="addChainToMovement"
          >
            Ajouter
          </UButton>
        </div>

        <div class="space-y-6">
          <UCard
            v-for="(chain, index) in selectedMovement.chains"
            :key="chain.id"
            class="ring-1 ring-gray-200 dark:ring-gray-800"
          >
            <template #header>
              <div class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                  <UBadge
                    color="primary"
                    variant="solid"
                    size="lg"
                    class="rounded-full w-8 h-8 flex items-center justify-center"
                  >
                    {{ index + 1 }}
                  </UBadge>
                  <h3 class="font-bold text-lg">{{ chain.code }}</h3>
                </div>

                <UButton
                  color="error"
                  variant="ghost"
                  icon="i-lucide-trash"
                  size="sm"
                  @click="removeChainFromMovement(chain.movementChainId)"
                />
              </div>
            </template>

            <div class="space-y-4">
              <div
                v-for="step in chain.steps"
                :key="step.id"
                class="border rounded-md p-4 transition-all"
                :class="
                  step.isActive
                    ? 'border-green-200 bg-green-50/30 dark:border-green-900 dark:bg-green-900/10'
                    : 'border-gray-200 bg-gray-50 opacity-60 dark:border-gray-700 dark:bg-gray-800'
                "
              >
                <div class="flex justify-between items-center mb-4">
                  <div class="flex items-center gap-3">
                    <USwitch
                      :model-value="step.isActive"
                      @update:model-value="toggleStep(step)"
                      color="primary"
                    />
                    <span class="font-mono font-bold">{{ step.name }}</span>
                    <UBadge
                      v-if="!step.isActive"
                      color="neutral"
                      variant="soft"
                      size="xs"
                      >Inactif</UBadge
                    >
                    <UBadge v-else color="success" variant="soft" size="xs"
                      >Activé</UBadge
                    >
                  </div>
                </div>

                <div v-if="step.isActive" class="pl-10 space-y-2">
                  <p
                    class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2"
                  >
                    Configuration Fichiers & Règles
                  </p>

                  <div
                    v-if="step.files.length === 0"
                    class="text-sm text-gray-400 italic"
                  >
                    Aucune règle définie.
                  </div>

                  <div
                    v-for="fileConf in step.files"
                    :key="fileConf.id"
                    class="flex items-start gap-4 bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700"
                  >
                    <div class="pt-1">
                      <UIcon
                        name="i-heroicons-document-text"
                        class="text-gray-400"
                      />
                    </div>
                    <div class="flex-1">
                      <div class="font-bold text-sm">
                        {{
                          fileConf.logicalName ||
                          "Fichier ID " + fileConf.stepFileId
                        }}
                      </div>

                      <div class="mt-2 space-y-1">
                        <div
                          v-for="rule in fileConf.rules"
                          :key="rule.id"
                          class="text-xs bg-orange-50 text-orange-800 p-2 rounded border border-orange-100 flex gap-2"
                        >
                          <UIcon name="i-heroicons-exclamation-triangle" />
                          <span>{{ rule.message }}</span>
                        </div>
                      </div>
                    </div>
                    <UButton
                      size="xs"
                      color="neutral"
                      variant="ghost"
                      icon="i-heroicons-plus"
                      @click="
                        openRuleModal(
                          step,
                          fileConf.stepFileId,
                          fileConf.logicalName,
                        )
                      "
                    >
                      Règle
                    </UButton>
                  </div>

                  <UButton
                    v-if="step.files.length === 0"
                    size="xs"
                    variant="link"
                    icon="i-heroicons-plus-circle"
                    @click="
                      console.log(
                        'En prod : Ici on afficherait la liste des fichiers du catalogue pour choisir sur lequel mettre une alerte',
                      )
                    "
                  >
                    Ajouter une règle sur un fichier
                  </UButton>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <div
        v-else
        class="flex-1 flex flex-col items-center justify-center text-gray-400"
      >
        <UIcon
          name="i-heroicons-cursor-arrow-rays"
          class="text-6xl mb-4 opacity-20"
        />
        <p>Sélectionnez un mouvement à gauche pour le configurer.</p>
      </div>
    </div>

    <UModal v-model:open="isCreatedMvtModalOpen">
      <template #header>
        <h3 class="font-bold">Nouveau Mouvement</h3>
      </template>
      <template #body>
        <form @submit.prevent="createMovement" class="space-y-4">
          <UFormField label="Code Mouvement">
            <UInput v-model="newMovement.code" placeholder="GE00" autofocus />
          </UFormField>
          <UFormField label="Description">
            <UInput
              v-model="newMovement.description"
              placeholder="Rattrapage..."
            />
          </UFormField>
        </form>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="isCreatedMvtModalOpen = false"
            >Annuler</UButton
          >
          <UButton color="primary" @click="createMovement">Créer</UButton>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="isRuleModalOpen">
      <template #header>
        <div>
          <h3 class="font-bold text-red-600 flex items-center gap-2">
            <UIcon name="i-heroicons-exclamation-triangle" />
            Ajouter une Alerte
          </h3>
          <p class="text-xs text-gray-500 mt-1">
            Sur le fichier
            <strong class="text-gray-700">{{
              currentFileContext?.logicalName
            }}</strong>
            (Step {{ currentFileContext?.stepName }})
          </p>
        </div>
      </template>
      <template #body>
        <form @submit.prevent="saveRule" class="space-y-4">
          <UFormField label="Message d'erreur" help="Ce qui s'affiche en rouge">
            <UInput
              v-model="newRule.message"
              placeholder="Attention : Date incorrecte..."
              autofocus
            />
          </UFormField>

          <UFormField
            label="Instruction de correction"
            help="Ce que l'opérateur doit faire"
          >
            <UTextarea
              v-model="newRule.fixInstruction"
              placeholder="Modifier le fichier en position 80..."
            />
          </UFormField>
        </form>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="isRuleModalOpen = false"
            >Annuler</UButton
          >
          <UButton color="error" @click="saveRule"
            >Sauvegarder l'alerte</UButton
          >
        </div>
      </template>
    </UModal>
  </div>
</template>
