<script setup lang="ts">
import type { WorkflowResponse, WorkflowRule } from "~/types/compta";

useSeoMeta({
  title: "Dashboard - Compta - Movements",
  description: "",
});
const route = useRoute();
const movementCode = route.params.code as string;

// Appel API vers ton Backend Adonis
const config = useRuntimeConfig();
const baseURL = config.public.authBaseUrl;
const { data, status, error } = await useFetch<WorkflowResponse>(
  `${baseURL}/api/workflows/${movementCode}`,
);

// Gestion de l'état
const currentStepIndex = ref(0);
const isFixModalOpen = ref(false);
const currentFixRule = ref<WorkflowRule | null>(null);

// Computed
const workflow = computed(() => data.value?.workflow || []);
const currentStep = computed(() => workflow.value[currentStepIndex.value]);
const isFinished = computed(
  () =>
    workflow.value.length > 0 &&
    currentStepIndex.value >= workflow.value.length,
);

// Pourcentage pour le composant <Progress>
const progressValue = computed(() => {
  if (!workflow.value.length) return 0;
  return Math.round((currentStepIndex.value / workflow.value.length) * 100);
});

// Actions
function nextStep() {
  if (currentStepIndex.value < workflow.value.length) {
    currentStepIndex.value++;
  }
}

function openFixModal(rule: WorkflowRule) {
  currentFixRule.value = rule;
  isFixModalOpen.value = true;
}

function confirmFix() {
  isFixModalOpen.value = false;
}
</script>

<template>
  <div>
    <div v-if="status === 'pending'" class="space-y-4">
      <USkeleton class="h-64 w-full" />
    </div>

    <div v-else-if="error">
      <UAlert
        title="Erreur de chargement"
        :description="`Impossible de récupérer le mouvement ${movementCode}.`"
        icon="i-lucide-terminal"
        color="error"
        variant="subtle"
      />
    </div>

    <div v-else class="space-y-6">
      <div class="flex flex-col gap-2">
        <div class="flex justify-between items-end">
          <div>
            <h1 class="text-3xl font-bold">
              Rattrapage de mouvements:
              {{ data?.movement }}
            </h1>
            <p class="text-muted">{{ data?.description }}</p>
          </div>
          <UBadge size="lg" color="primary" variant="subtle">
            Étape {{ currentStepIndex + 1 }} / {{ workflow.length }}
          </UBadge>
        </div>
        <UProgress v-model="progressValue" color="primary" />
      </div>

      <UCard v-if="isFinished" class="text-center">
        <div class="flex flex-col items-center gap-4 py-8">
          <div class="text-6xl">🎉</div>
          <h2 class="text-2xl font-bold text-primary">Parcours Terminé !</h2>
          <p>Le mouvement {{ movementCode }} a été vérifié avec succès.</p>
          <UButton
            color="primary"
            variant="solid"
            size="lg"
            @click="navigateTo('/dashboard/compta/DP01')"
          >
            Retour à l'accueil
          </UButton>
        </div>
      </UCard>

      <UCard v-else-if="currentStep">
        <template #header>
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-3">
              <UBadge color="neutral" variant="soft" size="lg"
                >CHAINE {{ currentStep.chainName }}</UBadge
              >
              <UBadge color="neutral" variant="soft" size="lg"
                >STEP {{ currentStep.stepName }}</UBadge
              >
            </div>

            <UBadge
              v-if="currentStep.hasWarning"
              size="lg"
              color="warning"
              variant="outline"
              class="font-bold"
              icon="i-lucide-triangle-alert"
            >
              Action Requise
            </UBadge>
          </div>
        </template>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div
              class="flex items-center gap-2 mb-2 text-gray-500 uppercase text-xs font-bold tracking-wider"
            >
              <UIcon
                name="i-lucide-arrow-down-0-1"
                class="text-primary w-4 h-4"
              />
              <span>Entrées (Input)</span>
            </div>

            <div class="space-y-3">
              <UCard v-for="file in currentStep.inputs" :key="file.id">
                <div class="flex justify-between items-start">
                  <div>
                    <div class="font-bold">{{ file.logicalName }}</div>
                    <div class="font-mono text-xs text-gray-500 break-all">
                      {{ file.physicalName }}
                    </div>
                  </div>
                  <UBadge color="primary" variant="solid" size="xs">{{
                    file.copybook
                  }}</UBadge>
                </div>
              </UCard>
            </div>
          </div>

          <div>
            <div
              class="flex items-center gap-2 mb-2 text-gray-500 uppercase text-xs font-bold tracking-wider"
            >
              <UIcon
                name="i-lucide-arrow-up-0-1"
                class="text-primary w-4 h-4"
              />
              <span>Sorties (Output)</span>
            </div>

            <div class="space-y-3">
              <UCard
                v-for="file in currentStep.outputs"
                :key="file.id"
                :class="file.hasAlert ? 'ring-2 ring-orange' : ''"
              >
                <div class="flex justify-between items-start">
                  <div>
                    <div
                      class="font-bold flex items-center gap-2"
                      :class="file.hasAlert ? 'text-orange-700' : ''"
                    >
                      {{ file.logicalName }}
                      <UBadge
                        v-if="!file.isMonitored"
                        color="primary"
                        variant="soft"
                        size="xs"
                        >Non critique</UBadge
                      >
                    </div>
                    <div class="font-mono text-xs text-gray-500 break-all">
                      {{ file.physicalName }}
                    </div>
                  </div>
                  <UBadge
                    v-if="!file.hasAlert"
                    color="success"
                    variant="subtle"
                    icon="i-lucide-check"
                    >OK</UBadge
                  >
                  <UBadge v-else color="warning" variant="solid"
                    >Vérification</UBadge
                  >
                </div>

                <div
                  v-if="file.hasAlert && file.rules?.length"
                  class="mt-4 flex flex-col gap-3"
                >
                  <UAlert
                    icon="i-lucide-info"
                    color="warning"
                    variant="subtle"
                    :title="'Règle : ' + file.rules[0]?.message"
                  />
                  <UButton
                    block
                    color="error"
                    variant="soft"
                    icon="i-lucide-x-circle"
                    label="NON, la donnée a changé"
                    @click="openFixModal(file.rules[0]!)"
                  />

                  <UModal v-model:open="isFixModalOpen" :dismissible="false">
                    <template #header>
                      <UIcon
                        name="i-lucide-lightbulb"
                        class="size-6 text-primary"
                      />Action Corrective Requise
                    </template>
                    <template #body>
                      <div class="space-y-4">
                        <p>
                          La configuration indique que pour ce mouvement, une
                          modification manuelle est nécessaire avant de
                          poursuivre.
                        </p>

                        <div
                          class="p-4 rounded-lg border-l-3 border-red-500 font-mono text-sm whitespace-pre-wrap"
                        >
                          {{ currentFixRule?.fix }}
                        </div>
                        <div v-if="currentFixRule?.details" class="text-xs">
                          Détails techniques : {{ currentFixRule.details }}
                        </div>
                      </div>
                    </template>

                    <template #footer>
                      <UButton
                        color="error"
                        variant="solid"
                        @click="confirmFix"
                        label=" C'est fait, continuer"
                      />
                    </template>
                  </UModal>
                </div>
              </UCard>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton
              size="xl"
              color="primary"
              icon="i-lucide-arrow-right"
              trailing
              @click="nextStep"
            >
              Étape Suivante
            </UButton>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>
