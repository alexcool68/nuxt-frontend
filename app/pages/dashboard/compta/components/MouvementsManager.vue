<script setup lang="ts">
import type { CatalogChain, ConfigStep, Movement } from "~/types/compta";

import AddRuleToStepfile from "../forms/AddRuleToStepfile.vue";
import AddChainToMovement from "../forms/AddChainToMovement.vue";

const props = defineProps<{
  movement: Movement;
}>();

const emits = defineEmits(["close"]);

const config = useRuntimeConfig();

const baseURL = config.public.authBaseUrl || "http://localhost:3333";

const { data: movements, refresh: refreshMovements } = await useFetch<
  Movement[]
>(`${baseURL}/api/v1/formatted-movements`);

const { data: catalogChains } = await useFetch<CatalogChain[]>(
  `${baseURL}/api/v1/chains`,
);

const isAddRuleModalOpen = ref(false);

const selectedMovement = computed(() =>
  movements.value?.find((m) => m.id === props.movement.id),
);

// FONCTIONS
// ok
async function addChainToMovement(chainId: number | undefined) {
  if (
    !selectedMovement.value?.chains ||
    !props.movement ||
    chainId === undefined
  )
    return;

  try {
    const currentOrders = selectedMovement.value?.chains.length || 0;

    await $fetch(`${baseURL}/api/v1/movement/chain`, {
      method: "POST",
      body: {
        movementId: props.movement.id,
        chainId: chainId,
        executionOrder: (currentOrders + 1) * 10,
      },
    });

    await refreshMovements();

    //chainId = undefined;
  } catch (e: any) {
    console.log(e);
  }
}

// ok
async function deleteChainFromMovement(chainId: number) {
  if (
    !confirm(
      "Voulez-vous vraiment retirer cette chaîne et toute sa configuration ?",
    )
  )
    return;
  if (!selectedMovement.value?.id || chainId === undefined) return;
  try {
    await $fetch(
      `${baseURL}/api/v1/movement/${selectedMovement.value?.id}/chain/${chainId}`,
      {
        method: "DELETE",
      },
    );
    await refreshMovements();
  } catch (e) {
    console.error("Erreur lors de la suppression de la chaîne", e);
  }
}

// ok
async function toggleStepFromMovement(step: ConfigStep) {
  if (!props.movement.id || !step.id) return;

  // CAS 1 : On veut ACTIVER (Création du lien)
  if (!step.isActive) {
    try {
      await $fetch(`${baseURL}/api/v1/movement/step`, {
        method: "POST",
        body: {
          movementId: props.movement.id,
          stepId: step.id,
        },
      });
      await refreshMovements();
    } catch (e) {
      console.error("Erreur lors de l'activation du step", e);
    }
  }
  // CAS 2 : On veut DÉSACTIVER (Suppression du lien)
  else {
    try {
      await $fetch(
        `${baseURL}/api/v1/movement/${props.movement.id}/step/${step.id}`,
        {
          method: "DELETE",
        },
      );
      await refreshMovements();
    } catch (e) {
      console.error("Erreur lors de la désactivation du step", e);
    }
  }
}

// ok
async function addMovementToFile(
  step: ConfigStep,
  fileId: number,
  logicalName: string,
) {
  if (!step.movementStepId || !fileId) return;

  // 1. On s'assure que le fichier est "monitored" (création liaison)
  // En vrai prod, on vérifierait si 'files' contient déjà ce fileCatalogId
  let configId = step.files.find((f) => f.stepFileId === fileId)?.id;

  if (!configId) {
    try {
      await $fetch<any>(`${baseURL}/api/v1/movement/file`, {
        method: "POST",
        body: {
          movementStepId: step.movementStepId,
          fileId: fileId,
          isMonitored: true,
          logicalName: logicalName,
        },
      });
      //configId = res.id;
      await refreshMovements();
    } catch (e: any) {
      console.log(e);
    }
  }
}

// ok
async function deleteMovementToFile(movementFileId: number) {
  if (!movementFileId) return;
  if (
    !confirm("Voulez-vous vraiment supprimer cette configuration de fichier ?")
  )
    return;

  try {
    await $fetch<any>(`${baseURL}/api/v1/movement/file/${movementFileId}`, {
      method: "DELETE",
    });
    await refreshMovements();
  } catch (e: any) {
    return;
  }
}

// ok
const currentFile = ref<{ id: number } | undefined>(undefined);

const newRule = ref({ message: "", fixInstruction: "" });

function openAddRuleModal(fileId: number) {
  if (!fileId) return;
  currentFile.value = { id: fileId };
  newRule.value = { message: "", fixInstruction: "" };
  isAddRuleModalOpen.value = true;
}

async function addRuleTofile() {
  if (!newRule.value.message) return;
  try {
    await $fetch(`${baseURL}/api/v1/rules`, {
      method: "POST",
      body: { ...newRule.value, movementFileId: currentFile.value?.id },
    });
    isAddRuleModalOpen.value = false;
    newRule.value = { message: "", fixInstruction: "" };
    currentFile.value = undefined;
    await refreshMovements();
  } catch (e) {
    console.error(e);
  }
}

async function deleteRule(ruleId: number) {
  if (!ruleId) return;

  try {
    await $fetch(`${baseURL}/api/v1/rules/${ruleId}`, {
      method: "DELETE",
    });
    await refreshMovements();
  } catch (e) {
    console.error("Erreur lors de la suppression de la règle", e);
  }
}
</script>

<template>
  <UDashboardPanel id="configurations-movements">
    <UDashboardNavbar :title="movement.code" :toggle="false">
      <template #leading>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          class="-ms-1.5"
          @click="emits('close')"
        />
      </template>

      <template #right>
        <div v-if="movement.description">
          {{ movement.description }}
        </div>
      </template>
    </UDashboardNavbar>

    <div
      class="flex flex-col sm:flex-row gap-2 p-2 sm:px-6 border-b border-default"
    >
      <AddChainToMovement
        :items="catalogChains"
        :existing-chains="selectedMovement?.chains"
        @submit="(value) => addChainToMovement(value)"
      />
    </div>

    <!-- LIST OF CHAIN FOR THIS MOVEMENT -->
    <div v-if="selectedMovement" class="flex-1 overflow-y-auto p-4 sm:p-6">
      <div class="space-y-5">
        <UCard
          v-for="(chain, index) in selectedMovement.chains"
          :key="chain.id"
          variant="soft"
        >
          <template #header>
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-3">
                <UBadge color="primary" variant="solid" size="md">
                  {{ index + 1 }}
                </UBadge>
                <div class="text-neutral tracking-wider">
                  Chain : {{ chain.code }}
                </div>
              </div>
              <UButton
                size="sm"
                color="error"
                variant="ghost"
                icon="i-lucide-trash"
                label="Delete"
                @click="deleteChainFromMovement(chain.id)"
              />
            </div>
          </template>

          <!-- STEPS -->
          <div class="space-y-5">
            <div
              v-for="step in chain.steps"
              :key="step.id"
              class="border-l-2 p-4 transition-all"
              :class="step.isActive ? 'border-primary' : 'border-muted'"
            >
              <!-- ACTIVATION STEP -->
              <div class="flex justify-between items-center mb-5">
                <div class="flex items-center gap-3">
                  <USwitch
                    :model-value="step.isActive"
                    @update:model-value="toggleStepFromMovement(step)"
                    color="primary"
                  />
                  <span class="font-mono font-bold"
                    >Step : {{ step.name }}</span
                  >
                  <UBadge
                    v-if="!step.isActive"
                    color="neutral"
                    variant="soft"
                    size="md"
                    >Inactif</UBadge
                  >
                  <UBadge v-else color="success" variant="soft" size="md"
                    >Activé</UBadge
                  >
                </div>
              </div>

              <!-- CONFIG ALERTE -->
              <div v-if="step.isActive" class="pl-10 space-y-5">
                <!-- MINI TITLE -->
                <p
                  class="text-xs font-bold text-muted uppercase tracking-wider mb-2"
                >
                  Configuration Fichiers & Règles
                </p>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Colonne Fichiers IN -->
                  <div class="space-y-3">
                    <h4 class="text-sm font-semibold border-b pb-1">
                      <UIcon name="i-lucide-arrow-down-right" class="mr-1" />
                      Fichiers ENTRANTS
                    </h4>
                    <div
                      v-if="
                        !(step.possibleFiles ?? []).some(
                          (f) => f.direction === 'IN',
                        )
                      "
                      class="text-xs text-muted italic mt-2"
                    >
                      Aucun fichier entrant.
                    </div>
                    <div
                      v-for="file in (step.possibleFiles ?? []).filter(
                        (f) => f.direction === 'IN',
                      )"
                      :key="file.id"
                      class="flex items-center justify-between p-2 rounded-md bg-elevated"
                    >
                      <div>
                        <span class="text-sm">{{ file.logicalName }} </span>
                        <span
                          v-if="file.defaultPhysicalName"
                          class="text-xs text-muted ml-2 italic tracking-wider"
                          >{{ file.defaultPhysicalName }}</span
                        >
                      </div>
                      <UButton
                        size="xs"
                        variant="ghost"
                        icon="i-heroicons-plus"
                        @click="
                          addMovementToFile(step, file.id!, file.logicalName)
                        "
                        label="Stepfile"
                      />
                    </div>
                  </div>

                  <!-- Colonne Fichiers OUT -->
                  <div class="space-y-3">
                    <h4 class="text-sm font-semibold border-b pb-1">
                      <UIcon name="i-lucide-arrow-up-right" class="mr-1" />
                      Fichiers SORTANTS
                    </h4>
                    <div
                      v-if="
                        !(step.possibleFiles ?? []).some(
                          (f) => f.direction === 'OUT',
                        )
                      "
                      class="text-xs text-muted italic mt-2"
                    >
                      Aucun fichier sortant.
                    </div>
                    <div
                      v-for="file in (step.possibleFiles ?? []).filter(
                        (f) => f.direction === 'OUT',
                      )"
                      :key="file.id"
                      class="flex items-center justify-between p-2 rounded-md bg-elevated"
                    >
                      <div>
                        <span class="text-sm">{{ file.logicalName }} </span>
                        <span
                          v-if="file.defaultPhysicalName"
                          class="text-xs text-muted ml-2 italic tracking-wider"
                          >{{ file.defaultPhysicalName }}</span
                        >
                      </div>

                      <UButton
                        size="xs"
                        variant="ghost"
                        icon="i-heroicons-plus"
                        @click="
                          addMovementToFile(step, file.id!, file.logicalName)
                        "
                        label="Stepfile"
                      />
                    </div>
                  </div>
                </div>

                <UEmpty
                  v-if="step.files.length === 0"
                  icon="i-lucide-pencil-ruler"
                  description="No files configurated for this step yet."
                  variant="soft"
                />

                <div>
                  <UCard v-for="file in step.files" :key="file.id">
                    <template #header>
                      <div class="flex justify-between items-center">
                        <div>{{ file.defaultPhysicalName }}</div>
                        <div>
                          <UButton
                            variant="link"
                            icon="lucide-circle-plus"
                            size="sm"
                            @click="openAddRuleModal(file.id!)"
                            >Add rule</UButton
                          >
                          <UButton
                            variant="ghost"
                            color="error"
                            icon="i-lucide-trash"
                            size="sm"
                            @click="deleteMovementToFile(file.id!)"
                            >Remove filestep</UButton
                          >
                        </div>
                      </div>
                    </template>

                    <UEmpty
                      v-if="!file.rules.length"
                      icon="i-lucide-pencil-ruler"
                      title="Aucune règle configurée"
                      description="Il semble que vous n'ayez ajouté aucune règle sur ce fichier. Créez-en une pour commencer."
                      variant="naked"
                    />

                    <ul role="list" class="divide-y divide-default">
                      <li
                        v-for="rule in file.rules"
                        :key="rule.id"
                        class="flex items-center justify-between gap-3 py-3 px-4 sm:px-6"
                      >
                        <div class="flex items-center gap-3 min-w-0">
                          <div class="text-sm min-w-0">
                            <p class="text-highlighted font-medium truncate">
                              {{ rule.message }}
                            </p>
                            <p class="text-muted truncate">
                              {{ rule.fixInstruction }}
                            </p>
                          </div>
                        </div>
                        <div class="flex items-center gap-3">
                          <UButton
                            icon="i-lucide-trash"
                            size="sm"
                            color="error"
                            variant="link"
                            @click="deleteRule(rule.id!)"
                          />
                        </div>
                      </li>
                    </ul>
                  </UCard>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <AppModal
      v-model="isAddRuleModalOpen"
      title="Ajouter une regle"
      description="Fill the form below"
      confirm-label="Create"
      cancel-label="Cancel"
      confirm-color="primary"
      @confirm="addRuleTofile"
    >
      <div v-if="currentFile" class="mb-4">
        Ajout d'une règle sur le fichier de configuration ID:
        <span class="font-bold text-primary">{{ currentFile.id }}</span>
      </div>
      <AddRuleToStepfile v-model="newRule" />
    </AppModal>
  </UDashboardPanel>
</template>
