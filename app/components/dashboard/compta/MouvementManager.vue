<script setup lang="ts">
import type { CatalogChain, ConfigStep, Movement } from "~/types/compta";
import AddRuleToStepfile from "./form/AddRuleToStepfile.vue";

const props = defineProps<{
  movement: Movement;
}>();

const emits = defineEmits(["close"]);

//const loading = ref(false);

const config = useRuntimeConfig();
const baseURL = config.public.authBaseUrl || "http://localhost:3333";

const { data: movements, refresh: refreshMovements } = await useFetch<
  Movement[]
>(`${baseURL}/api/configurations/movements`);

const { data: catalogChains } = await useFetch<CatalogChain[]>(
  `${baseURL}/api/chains`,
);

const isAddRuleModalOpen = ref(false);

// const currentFileContext = ref<{
//   logicalName: string;
//   stepName: string;
// } | null>(null);

const selectedMovement = computed(() =>
  movements.value?.find((m) => m.id === props.movement.id),
);

// FONCTIONS

async function addChainToMovement(chainId: number | undefined) {
  if (!props.movement || chainId === undefined) return;

  try {
    const currentOrders = selectedMovement.value?.chains.length || 0;

    await $fetch(`${baseURL}/api/links/chain`, {
      method: "POST",
      body: {
        movementId: props.movement.id,
        chainId: chainId,
        executionOrder: (currentOrders + 1) * 10,
      },
    });

    await refreshMovements();

    chainId = undefined;
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

async function toggleStepFromMovement(step: ConfigStep) {
  if (!props.movement.id) return;

  // CAS 1 : On veut ACTIVER (Création du lien)
  if (!step.isActive) {
    try {
      await $fetch(`${baseURL}/api/links/step`, {
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

async function addStepfileToStep(
  step: ConfigStep,
  fileId: number,
  logicalName: string,
) {
  if (!step.movementStepId) return alert("Activez le step d'abord !");

  // 1. On s'assure que le fichier est "monitored" (création liaison)
  // En vrai prod, on vérifierait si 'files' contient déjà ce fileCatalogId
  let configId = step.files.find((f) => f.stepFileId === fileId)?.id;

  if (!configId) {
    try {
      const res = await $fetch<any>(`${baseURL}/api/links/file`, {
        method: "POST",
        body: {
          movementStepId: step.movementStepId,
          stepFileId: fileId,
          isMonitored: true,
        },
      });
      configId = res.id;
      await refreshMovements();
    } catch (e: any) {
      console.log(e);
    }
  }
}

async function removeStepfileFromStep(step: ConfigStep, fileId: number) {
  if (!step.movementStepId) return alert("Activez le step d'abord !");
  if (!fileId) return;

  try {
    const res = await $fetch<any>(
      `${baseURL}/api/links/step/${step.movementStepId}/files/${fileId}`,
      {
        method: "DELETE",
      },
    );
    await refreshMovements();
  } catch (e: any) {
    return;
  }
}

const newRule = ref({ message: "", fixInstruction: "" });

//---------------------

async function addRuleToStepfile(movementStepFileId: number) {
  if (!movementStepFileId) return;
  try {
    await $fetch(`${baseURL}/api/rules`, {
      method: "POST",
      body: { ...newRule.value, movementStepFileId: movementStepFileId },
    });
    newRule.value = { message: "", fixInstruction: "" };
    await refreshMovements();
    isAddRuleModalOpen.value = false;
  } catch (e) {
    console.error(e);
  }
}
</script>

<template>
  <UDashboardPanel id="configuration-2">
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

      <template #right
        ><div v-if="movement.description">
          {{ movement.description }}
        </div></template
      >
    </UDashboardNavbar>

    <div
      class="flex flex-col sm:flex-row gap-2 p-2 sm:px-6 border-b border-default"
    >
      <DashboardComptaFormAddChainToMovement
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
                @click="removeChainFromMovement(chain.movementChainId)"
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
                          addStepfileToStep(step, file.id!, file.logicalName)
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
                          addStepfileToStep(step, file.id!, file.logicalName)
                        "
                        label="Stepfile"
                      />
                    </div>
                  </div>
                </div>

                <UEmpty
                  v-if="step.files.length === 0"
                  icon="i-lucide-pencil-ruler"
                  description="No rules defined for this step yet."
                  variant="soft"
                />
                <!-- TODO -->
                <div v-for="file in step.files" :key="file.id">
                  <div v-for="rule in file.rules" :key="rule.id">
                    <UAlert
                      orientation="horizontal"
                      color="neutral"
                      variant="soft"
                      :ui="{
                        icon: 'size-8',
                      }"
                      :actions="[
                        {
                          label: 'Add rule',
                          color: 'primary',
                          variant: 'outline',
                          size: 'sm',
                          icon: 'i-lucide-circle-plus',
                          onClick: () => {
                            isAddRuleModalOpen = true;
                          },
                        },
                        {
                          label: 'Remove stepfile',
                          color: 'error',
                          variant: 'ghost',
                          size: 'sm',
                          icon: 'i-lucide-trash',
                          onClick: () => {
                            removeStepfileFromStep(step, file.id!);
                          },
                        },
                      ]"
                    >
                      <template #title>
                        <div class="font-bold text-lg tracking-wider mb-3">
                          {{ file.defaultPhysicalName }}
                        </div>
                      </template>

                      <template #description>
                        <div class="flex flex-col justify-between gap-2">
                          <div class="flex items-center">
                            <UIcon
                              name="i-lucide-circle-x"
                              class="size-5 mr-2 text-error"
                              color="warning"
                            />
                            <p>{{ rule.message }}</p>
                          </div>
                          <div class="flex items-center">
                            <UIcon
                              name="i-lucide-message-circle-warning"
                              class="size-5 mr-2 text-warning"
                              color="warning"
                            />
                            <p>{{ rule.fixInstruction }}</p>
                          </div>
                        </div>
                      </template>
                    </UAlert>
                  </div>

                  <div v-if="file.rules.length === 0">
                    <UAlert
                      orientation="horizontal"
                      color="neutral"
                      variant="soft"
                      :ui="{
                        icon: 'size-8',
                      }"
                      :actions="[
                        {
                          label: 'Add a rule',
                          color: 'primary',
                          variant: 'outline',
                          size: 'sm',
                          icon: 'i-lucide-circle-plus',
                          onClick: () => {
                            isAddRuleModalOpen = true;
                          },
                        },
                        {
                          label: 'Remove filestep',
                          color: 'error',
                          variant: 'ghost',
                          size: 'sm',
                          icon: 'i-lucide-trash',
                          onClick: () => {
                            removeStepfileFromStep(step, file.id!);
                          },
                        },
                      ]"
                    >
                      <template #title>
                        <div class="font-bold text-lg tracking-wider mb-3">
                          {{ file.defaultPhysicalName }}
                        </div>
                        <AppModal
                          v-model="isAddRuleModalOpen"
                          title="Ajouter une regle"
                          description="Fill the form below"
                          confirm-label="Create"
                          cancel-label="Cancel"
                          confirm-color="primary"
                          @confirm="addRuleToStepfile(file.id!)"
                        >
                          <AddRuleToStepfile v-model="newRule" />
                        </AppModal>
                      </template>

                      <template #description>
                        <UEmpty
                          v-if="file.rules.length === 0"
                          icon="i-lucide-pencil-ruler"
                          title="Aucune règle configurée."
                          description="Il semble que vous n'ayez ajouté aucune règle sur ce fichier. Créez-en une pour commencer."
                          variant="naked"
                        />
                      </template>
                    </UAlert>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </UDashboardPanel>
</template>
