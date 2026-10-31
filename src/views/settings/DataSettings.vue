<script setup lang="ts">
import { ref } from 'vue'
import BaseButton from '@/components/BaseButton.vue'
import BaseToast from '@/components/BaseToast.vue'
import FormError from '@/components/FormError.vue'
import DeleteAccountDialog from '@/components/settings/DeleteAccountDialog.vue'
import ResetProgressDialog from '@/components/settings/ResetProgressDialog.vue'
import SettingRow from '@/components/settings/SettingRow.vue'
import SettingsCard from '@/components/settings/SettingsCard.vue'
import { useToast } from '@/composables/useToast'
import { ApiError } from '@/lib/api'
import { saveFile } from '@/lib/download'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'

const auth = useAuthStore()
const settingsStore = useSettingsStore()
const { toast, showToast } = useToast()

const exporting = ref(false)
const exportError = ref<string | null>(null)

// Two files: everything as JSON, and the cards as CSV for Anki.
async function exportLibrary(): Promise<void> {
  exporting.value = true
  exportError.value = null

  try {
    saveFile(await settingsStore.exportLibrary())
    saveFile(await settingsStore.exportFlashcards())
    showToast({
      title: 'Export ready',
      message: 'Your library as JSON, and your cards as CSV for Anki.',
      tone: 'sprout',
      icon: 'download',
    })
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    exportError.value = caught.message
  } finally {
    exporting.value = false
  }
}

const confirmingReset = ref(false)
const resetting = ref(false)
const resetError = ref<string | null>(null)

function openReset(): void {
  resetError.value = null
  confirmingReset.value = true
}

async function resetProgress(): Promise<void> {
  resetting.value = true
  resetError.value = null

  try {
    await settingsStore.resetProgress()
    confirmingReset.value = false
    showToast({
      title: 'Progress reset',
      message: 'Every card is new again. Your topics and cards are still here.',
      tone: 'sprout',
      icon: 'rotate-ccw',
    })
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    resetError.value = caught.message
  } finally {
    resetting.value = false
  }
}

const confirmingDelete = ref(false)
const deleting = ref(false)
const deleteError = ref<string | null>(null)
const deleteEmailError = ref<string | undefined>(undefined)

function openDelete(): void {
  deleteError.value = null
  deleteEmailError.value = undefined
  confirmingDelete.value = true
}

// Afterwards you're signed out, and App.vue takes you to the login screen.
async function deleteAccount(typedEmail: string): Promise<void> {
  deleting.value = true
  deleteError.value = null
  deleteEmailError.value = undefined

  try {
    await auth.deleteAccount(typedEmail)
  } catch (caught) {
    if (!(caught instanceof ApiError)) {
      throw caught
    }
    deleteEmailError.value = caught.fieldError('email')
    deleteError.value = caught.hasFieldErrors ? null : caught.message
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <SettingsCard title="Your data" subtitle="It’s yours. Take it with you, or take it away.">
    <div>
      <SettingRow
        name="Export your library"
        description="Topics, cards, questions, chats and progress as JSON, plus your cards as CSV for Anki."
      >
        <BaseButton
          variant="secondary"
          size="sm"
          icon="download"
          :disabled="exporting"
          data-test="export"
          @click="exportLibrary"
        >
          {{ exporting ? 'Exporting…' : 'Export' }}
        </BaseButton>
      </SettingRow>
      <SettingRow
        name="Reset progress"
        description="Keeps your topics and cards, wipes mastery, reviews, streaks and XP. Can’t be undone."
      >
        <BaseButton
          variant="secondary"
          size="sm"
          icon="rotate-ccw"
          data-test="reset"
          @click="openReset"
        >
          Reset…
        </BaseButton>
      </SettingRow>
      <SettingRow
        name="Delete account"
        description="Everything goes, right away and for good. We’ll ask you to type your email first."
      >
        <BaseButton
          variant="secondary"
          size="sm"
          icon="trash-2"
          data-test="delete-account"
          @click="openDelete"
        >
          Delete account…
        </BaseButton>
      </SettingRow>
    </div>

    <FormError v-if="exportError" :message="exportError" />
  </SettingsCard>

  <ResetProgressDialog
    v-if="confirmingReset"
    :resetting="resetting"
    :error="resetError"
    @confirm="resetProgress"
    @close="confirmingReset = false"
  />

  <DeleteAccountDialog
    v-if="confirmingDelete"
    :email="auth.user?.email ?? ''"
    :deleting="deleting"
    :error="deleteError"
    :email-error="deleteEmailError"
    @confirm="deleteAccount"
    @close="confirmingDelete = false"
  />

  <BaseToast
    v-if="toast !== null"
    :title="toast.title"
    :message="toast.message"
    :tone="toast.tone"
    :icon="toast.icon"
  />
</template>
