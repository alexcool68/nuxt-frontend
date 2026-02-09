<script setup lang="ts">
interface Props {
  modelValue: boolean;
  title?: string;
  description?: string;
  width?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  loading?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  title: "Default title",
  description: "Default description",
  width: "sm:max-w-lg",
  confirmLabel: "Confirmer",
  cancelLabel: "Annuler",
  confirmColor: "primary",
  loading: false,
});

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "close"): void;
  (e: "confirm"): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit("update:modelValue", value);
    if (!value) emit("close");
  },
});

function onCancel() {
  isOpen.value = false;
}

function onConfirm() {
  emit("confirm");
}
</script>
<template>
  <UModal
    v-model:open="isOpen"
    :ui="{ content: width, footer: 'justify-end' }"
    :title="title"
    :description="description"
  >
    <template #body>
      <slot />
    </template>

    <template #footer>
      <slot name="footer" v-if="$slots.footer" />
      <div v-else class="flex justify-end gap-3 w-full">
        <UButton
          color="neutral"
          variant="ghost"
          @click="onCancel"
          :label="cancelLabel"
        />

        <UButton
          color="error"
          variant="solid"
          @click="onConfirm"
          :label="confirmLabel"
          :loading="loading"
        />
      </div>
    </template>
  </UModal>
</template>
