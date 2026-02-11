<script setup lang="ts">
import type { CatalogChain, ConfigStep, Movement } from "~/types/compta";

const props = defineProps<{
  movement: Movement;
}>();

const currentFileContext = ref<{
  logicalName: string;
  stepName: string;
} | null>(null);

const emits = defineEmits(["close"]);

const loading = ref(false);

const config = useRuntimeConfig();
const baseURL = config.public.authBaseUrl || "http://localhost:3333";

const { data: movements, refresh: refreshMovements } = await useFetch<
  Movement[]
>(`${baseURL}/api/configurations/movements`);

const { data: catalogChains } = await useFetch<CatalogChain[]>(
  `${baseURL}/api/chains`,
);

const isRuleModalOpen = ref(false);

const selectedMovement = computed(() =>
  movements.value?.find((m) => m.id === props.movement.id),
);

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

async function toggleStep(step: ConfigStep) {
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

const newRule = ref({ message: "", fixInstruction: "", movementStepFileId: 0 });

async function openRuleModal(
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
                    @update:model-value="toggleStep(step)"
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
                      <!-- <UButton
                        size="xs"
                        variant="ghost"
                        icon="i-lucide-plus"
                        label="Règle"
                      /> -->
                      <UButton
                        size="xs"
                        variant="ghost"
                        icon="i-heroicons-plus"
                        @click="openRuleModal(step, file.id!, file.logicalName)"
                        label="Règle"
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
                        icon="i-lucide-plus"
                        label="Règle"
                      />
                      <!-- <UButton
                        size="xs"
                        variant="ghost"
                        icon="i-heroicons-plus"
                        @click="openRuleModal(step, file.id, file.logicalName)"
                        label="Règle"
                      /> -->
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
                  <div class="flex-1">
                    {{ file.logicalName || "Fichier ID " + file.stepFileId }}
                  </div>

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
                          label: 'Add',
                          color: 'primary',
                          variant: 'outline',
                          size: 'sm',
                          icon: 'i-lucide-circle-plus',
                          onClick: () => {},
                        },
                        {
                          label: 'Delete',
                          color: 'error',
                          variant: 'ghost',
                          size: 'sm',
                          icon: 'i-lucide-trash',
                          onClick: () => {},
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
                </div>

                <!-- <div
                  v-for="fileConf in step.files"
                  :key="fileConf.id"
                  class="flex items-start gap-4 p-3 rounded border"
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
                    label="Règle"
                  />
                </div> -->

                <!-- <UButton
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
                </UButton> -->
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </UDashboardPanel>
</template>
