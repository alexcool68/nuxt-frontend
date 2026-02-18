<script setup lang="ts">
// interface Props {
//   movementStepFileId: number;
// }

// const props = withDefaults(defineProps<Props>(), {
//   movementStepFileId: 0,
// });

const model = defineModel<{
  message: string;
  fixInstruction: string;
}>({ required: true });
</script>

<template>
  <div class="space-y-4">
    <UFormField label="Message" required>
      <UInput
        v-model="model.message"
        placeholder="Ex: "
        class="w-full"
        autofocus
      />
    </UFormField>
    <UFormField label="Instruction de correction" required>
      <UTextarea
        v-model="model.fixInstruction"
        placeholder="Ex: "
        class="w-full"
      />
    </UFormField>
  </div>
</template>
