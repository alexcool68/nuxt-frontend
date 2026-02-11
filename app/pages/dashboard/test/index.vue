<script setup lang="ts">
import MouvementManager from "~/components/dashboard/compta/MouvementManager.vue";
import type { CatalogChain, ConfigStep, Movement } from "~/types/compta";

definePageMeta({
  layout: "dashboard",
});

useSeoMeta({
  title: "Dashboard - Configuration",
  description: "",
});

const config = useRuntimeConfig();
const baseURL = config.public.authBaseUrl || "http://localhost:3333";

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
// DEBUG
const isLoading = ref(false);

// ETATS MODALES
const isCreatedMovementModalOpen = ref(false);
const isRuleModalOpen = ref(false);

// FORM
//const selectedChainToAdd = ref<number | undefined>(undefined);

const newMovement = ref({ code: "", description: "" });
const newRule = ref({ message: "", fixInstruction: "", movementStepFileId: 0 });

// REGLE
// Context pour la règle
const currentFileContext = ref<{
  logicalName: string;
  stepName: string;
} | null>(null);

async function createMovement() {
  try {
    const mvt = await $fetch<Movement>(`${baseURL}/api/movements`, {
      method: "POST",
      body: newMovement.value,
    });
    isCreatedMovementModalOpen.value = false;
    newMovement.value = { code: "", description: "" };
    await refreshMovements();
    // On sélectionne direct le nouveau
    selectedMovementId.value = mvt.id;
  } catch (e: any) {
    console.log("Erreur création mouvement");
  }
}

async function addChainToMovement(chainId: number | undefined) {
  if (!selectedMovementId.value || chainId === undefined) return;

  try {
    const currentOrders = selectedMovement.value?.chains.length || 0;

    await $fetch(`${baseURL}/api/links/chain`, {
      method: "POST",
      body: {
        movementId: selectedMovementId.value,
        chainId: chainId,
        executionOrder: (currentOrders + 1) * 10,
      },
    });
    chainId = undefined;
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
  <div class="flex w-full h-full">
    <!-- PANEL -->
    <UDashboardPanel
      id="chainMenu"
      :default-size="25"
      :min-size="20"
      :max-size="30"
      resizable
      collapsible
    >
      <template #header>
        <UDashboardNavbar title="Configuration">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
        </UDashboardNavbar>

        <UDashboardToolbar>
          <template #left>
            <span class="text-muted"
              >Total :
              {{ movements && movements.length ? movements.length : 0 }}</span
            >
          </template>
          <template #right>
            <UButton
              icon="i-lucide-circle-plus"
              label="Add"
              size="sm"
              variant="outline"
              @click="isCreatedMovementModalOpen = true"
            />
          </template>
        </UDashboardToolbar>
      </template>
      <template #body>
        <UCard
          v-for="movment in movements"
          :key="movment.id"
          @click="selectedMovementId = movment.id"
          variant="subtle"
          class="cursor-pointer"
        >
          <div class="flex justify-between items-center">
            <div class="flex flex-col justify-center">
              {{ movment.code }}
              <span
                v-if="movment.description"
                class="text-muted font-mono text-sm"
              >
                {{ movment.description }}
              </span>
            </div>
            <UIcon
              name="i-lucide-chevrons-right"
              size="32"
              :class="
                selectedMovementId === movment.id
                  ? 'text-primary'
                  : 'text-muted'
              "
            />
          </div>
        </UCard>
      </template>
    </UDashboardPanel>

    <MouvementManager
      v-if="selectedMovement"
      :movement="selectedMovement"
      @close="selectedMovementId = null"
    />
  </div>

  <AppModal
    v-model="isCreatedMovementModalOpen"
    title="New movement"
    description="Please, fill the form below"
    confirm-label="Create"
    cancel-label="Cancel"
    confirm-color="primary"
    :loading="isLoading"
    @confirm="createMovement"
  >
    <form @submit.prevent="createMovement" class="space-y-4">
      <UFormField label="Code Mouvement" required>
        <UInput
          v-model="newMovement.code"
          placeholder="AA00"
          class="w-full"
          autofocus
        />
      </UFormField>
      <UFormField label="Description" hint="Optional">
        <UInput
          v-model="newMovement.description"
          placeholder="Rattrapage AA00..."
          class="w-full"
        />
      </UFormField>
    </form>
  </AppModal>
</template>

<!-- <UEmpty
      variant="naked"
      icon="i-lucide-mouse-pointer-click"
      title="No movements found"
      description="It looks like you haven't added any movements. Create one to get started."
      :actions="[
        {
          icon: 'i-lucide-plus',
          label: 'Create new',
          variant: 'outline',
          color: 'primary',
          onClick: () => (isCreatedMovementModalOpen = true),
        },
      ]"
    />
    <UEmpty
      icon="i-heroicons-cursor-arrow-rays"
      title="Aucun mouvement sélectionné"
      description="Sélectionnez un mouvement dans la liste de gauche pour le configurer."
    /> -->
