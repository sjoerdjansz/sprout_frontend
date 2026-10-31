<script setup lang="ts">
import { ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseInput from '@/components/BaseInput.vue'
import BaseToast from '@/components/BaseToast.vue'
import FormError from '@/components/FormError.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import AvatarColorPicker from '@/components/settings/AvatarColorPicker.vue'
import RolePicker from '@/components/settings/RolePicker.vue'
import SettingsCard from '@/components/settings/SettingsCard.vue'
import { useProfileForm } from '@/composables/settings/useProfileForm'
import { useToast } from '@/composables/useToast'
import { initials } from '@/lib/names'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const { draft, hasChanges, saving, fieldErrors, formError, save, discard } = useProfileForm()
const { toast, showToast } = useToast()

const pickingColor = ref(false)

async function saveProfile(): Promise<void> {
  const outcome = await save()
  if (outcome === null) {
    return
  }
  pickingColor.value = false

  if (outcome.kind === 'email_sent') {
    showToast({
      title: 'Check your new inbox',
      message: outcome.message,
      tone: 'sky',
      icon: 'mail',
    })
  } else {
    showToast({
      title: 'Saved',
      message: 'Your profile is up to date.',
      tone: 'sprout',
      icon: 'check',
    })
  }
}

function discardChanges(): void {
  discard()
  pickingColor.value = false
}
</script>

<template>
  <p v-if="draft === null" class="text-ink-muted" aria-live="polite">Loading your profile…</p>

  <form v-else class="flex flex-col gap-5" novalidate @submit.prevent="saveProfile">
    <SettingsCard title="Profile" subtitle="How Sprout addresses you, and where it sends things.">
      <div class="flex flex-wrap items-center gap-4">
        <UserAvatar :initials="initials(draft.name)" :color="draft.avatarColor" size="lg" />
        <div class="flex flex-col items-start gap-1.5">
          <span class="text-label font-normal text-ink-muted">
            Your initials on a colour you pick. No photo needed.
          </span>
          <BaseButton
            variant="secondary"
            size="sm"
            icon="palette"
            :aria-expanded="pickingColor"
            data-test="change-color"
            @click="pickingColor = !pickingColor"
          >
            Change colour
          </BaseButton>
        </div>
      </div>
      <AvatarColorPicker
        v-if="pickingColor"
        v-model="draft.avatarColor"
        :initials="initials(draft.name)"
      />

      <div class="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-3.5">
        <BaseInput
          v-model="draft.name"
          label="First name"
          autocomplete="given-name"
          maxlength="50"
          :error="fieldErrors.name"
          data-test="name"
        />
        <BaseInput
          v-model="draft.email"
          label="Email"
          type="email"
          autocomplete="email"
          hint="Magic links and reminders go here."
          :error="fieldErrors.email"
          data-test="email"
        />
      </div>

      <p
        v-if="auth.user?.pending_email"
        class="flex items-start gap-2 rounded-md bg-sky-soft px-3.5 py-3 text-label font-normal text-sky-ink"
        data-test="pending-email"
      >
        Waiting for you to confirm <b>{{ auth.user.pending_email }}</b
        >. Open the link in that inbox; until then you keep signing in with {{ auth.user.email }}.
      </p>
    </SettingsCard>

    <SettingsCard
      title="What brings you to Sprout?"
      subtitle="Sets the tone and pace of the tutor. Change it any time."
    >
      <RolePicker v-model="draft.learnerRole" />
      <FormError v-if="fieldErrors.learner_role" :message="fieldErrors.learner_role" />
    </SettingsCard>

    <FormError v-if="formError" :message="formError" />
    <FormError v-if="fieldErrors.avatar_color" :message="fieldErrors.avatar_color" />

    <div class="flex justify-end gap-2">
      <BaseButton
        variant="ghost"
        :disabled="!hasChanges || saving"
        data-test="discard"
        @click="discardChanges"
      >
        Discard
      </BaseButton>
      <BaseButton type="submit" icon="check" :disabled="!hasChanges || saving" data-test="save">
        {{ saving ? 'Saving…' : 'Save changes' }}
      </BaseButton>
    </div>
  </form>

  <BaseToast
    v-if="toast !== null"
    :title="toast.title"
    :message="toast.message"
    :tone="toast.tone"
    :icon="toast.icon"
  />
</template>
