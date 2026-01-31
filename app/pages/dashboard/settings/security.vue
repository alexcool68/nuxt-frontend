<script setup lang="ts">
import * as z from "zod";
import type { FormError, FormErrorEvent, FormSubmitEvent } from "@nuxt/ui";

const passwordSchema = z.object({
  current_password: z.string().min(8, "Must be at least 8 characters"),
  new_password: z.string().min(8, "Must be at least 8 characters"),
});

type PasswordSchema = z.output<typeof passwordSchema>;

const password = reactive<Partial<PasswordSchema>>({
  current_password: undefined,
  new_password: undefined,
});

const validate = (state: Partial<PasswordSchema>): FormError[] => {
  const errors: FormError[] = [];
  if (
    state.current_password &&
    state.new_password &&
    state.current_password === state.new_password
  ) {
    errors.push({ name: "new", message: "Passwords must be different" });
  }
  return errors;
};

const toast = useToast();
const form = useTemplateRef("form");

type FieldKey = "current_password" | "new_password";

interface BackendError {
  message: string;
  rule?: string;
  field: FieldKey;
}

const serverErrors = reactive<Record<string, string>>({
  current: "",
  new: "",
});

async function onSubmit(event: FormSubmitEvent<PasswordSchema>) {
  const config = useRuntimeConfig();
  const baseURL = config.public.authBaseUrl;

  form.value?.setErrors([]);

  try {
    await $fetch(`${baseURL}/api/auth/update-password`, {
      headers: {
        Authorization: `${useAuth().token.value}`,
      },
      method: "PATCH",
      body: {
        current_password: event.data.current_password || null,
        new_password: event.data.new_password || null,
      },
    });

    toast.add({
      title: "Success",
      description: "Your password have been updated.",
      icon: "i-lucide-check",
      color: "success",
      duration: 3000,
    });
  } catch (e: any) {
    if (e.data && e.data.errors) {
      const fieldMap: Record<FieldKey, string> = {
        current_password: "current",
        new_password: "new",
      };
      e.data.errors.forEach((err: BackendError) => {
        const mappedField = fieldMap[err.field] || err.field;
        serverErrors[mappedField] = err.message;
      });

      // Optionally focus the first error field
      const firstErrorField = Object.keys(serverErrors).find(
        (key) => serverErrors[key],
      );
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        element?.focus();
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      toast.add({
        title: "Oups, something went wrong",
        description: e.message || "An unknown error occurred.",
        icon: "i-lucide-x",
        color: "error",
        duration: 3000,
      });
    }
  }
}

async function onError(event: FormErrorEvent) {
  if (event?.errors?.[0]?.id) {
    const element = document.getElementById(event.errors[0].id);
    element?.focus();
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}
</script>

<template>
  <UPageCard
    title="Password"
    description="Confirm your current password before setting a new one."
    variant="subtle"
  >
    <UForm
      ref="form"
      :schema="passwordSchema"
      :state="password"
      :validate="validate"
      @error="onError"
      @submit="onSubmit"
      class="flex flex-col gap-4 max-w-xs"
    >
      <UFormField name="current" :error="serverErrors.current">
        <UInput
          v-model="password.current_password"
          type="password"
          placeholder="Current password"
          class="w-full"
        />
      </UFormField>

      <UFormField name="new" :error="serverErrors.new">
        <UInput
          v-model="password.new_password"
          type="password"
          placeholder="New password"
          class="w-full"
        />
      </UFormField>

      <UButton label="Update" class="w-fit" type="submit" />
    </UForm>
  </UPageCard>

  <UPageCard
    title="Account"
    description="No longer want to use our service? You can delete your account here. This action is not reversible. All information related to this account will be deleted permanently."
    class="bg-gradient-to-tl from-error/10 from-5% to-default"
  >
    <template #footer>
      <UButton label="Delete account" color="error" />
    </template>
  </UPageCard>
</template>
