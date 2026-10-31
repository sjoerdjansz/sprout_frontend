import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'
import { ApiError } from '@/lib/api'
import { useAuthStore, type AvatarColor } from '@/stores/auth'
import { useSettingsStore, type LearnerRole } from '@/stores/settings'

export interface ProfileDraft {
  name: string
  email: string
  avatarColor: AvatarColor
  learnerRole: LearnerRole | null
}

export type ProfileField = 'name' | 'email' | 'avatar_color' | 'learner_role'

/** How a save ended, for the toast: saved, or saved and an email change waits in the new inbox. */
export type SaveOutcome = { kind: 'saved' } | { kind: 'email_sent'; message: string }

export interface ProfileForm {
  draft: Ref<ProfileDraft | null>
  hasChanges: ComputedRef<boolean>
  saving: Ref<boolean>
  fieldErrors: Ref<Partial<Record<ProfileField, string>>>
  formError: Ref<string | null>
  save: () => Promise<SaveOutcome | null>
  discard: () => void
}

/**
 * The Profile section: one draft for your name, email, avatar colour and role, saved together
 * with "Save changes". Each part goes to its own endpoint (`../API.md` "Settings").
 */
export function useProfileForm(): ProfileForm {
  const auth = useAuthStore()
  const settingsStore = useSettingsStore()

  const saved = computed<ProfileDraft | null>(() => {
    if (auth.user === null || settingsStore.settings === null) {
      return null
    }

    return {
      name: auth.user.name,
      email: auth.user.email,
      avatarColor: settingsStore.settings.avatar_color,
      learnerRole: settingsStore.settings.learner_role,
    }
  })

  const draft = ref<ProfileDraft | null>(null)
  const saving = ref(false)
  const fieldErrors = ref<Partial<Record<ProfileField, string>>>({})
  const formError = ref<string | null>(null)

  function discard(): void {
    draft.value = saved.value === null ? null : { ...saved.value }
    fieldErrors.value = {}
    formError.value = null
  }

  // Your account may still be loading when the page opens; start the draft once it's there.
  watch(
    saved,
    () => {
      if (draft.value === null) {
        discard()
      }
    },
    { immediate: true },
  )

  const hasChanges = computed<boolean>(() => {
    if (draft.value === null || saved.value === null) {
      return false
    }

    return (
      draft.value.name.trim() !== saved.value.name ||
      draft.value.email.trim().toLowerCase() !== saved.value.email ||
      draft.value.avatarColor !== saved.value.avatarColor ||
      draft.value.learnerRole !== saved.value.learnerRole
    )
  })

  function showError(caught: ApiError): void {
    const fields: ProfileField[] = ['name', 'email', 'avatar_color', 'learner_role']
    const errors: Partial<Record<ProfileField, string>> = {}
    for (const field of fields) {
      const message = caught.fieldError(field)
      if (message !== undefined) {
        errors[field] = message
      }
    }
    fieldErrors.value = errors
    formError.value = caught.hasFieldErrors ? null : caught.message
  }

  // Stops at the first part that fails; the parts before it are saved and stay saved.
  async function save(): Promise<SaveOutcome | null> {
    const changes = draft.value
    const current = saved.value
    if (changes === null || current === null || saving.value) {
      return null
    }

    saving.value = true
    fieldErrors.value = {}
    formError.value = null

    try {
      const name = changes.name.trim()
      if (name !== current.name) {
        await auth.updateName(name)
      }

      if (
        changes.avatarColor !== current.avatarColor ||
        changes.learnerRole !== current.learnerRole
      ) {
        await settingsStore.updateSettings({
          avatar_color: changes.avatarColor,
          ...(changes.learnerRole !== null && { learner_role: changes.learnerRole }),
        })
      }

      let outcome: SaveOutcome = { kind: 'saved' }
      const email = changes.email.trim()
      if (email.toLowerCase() !== current.email) {
        outcome = { kind: 'email_sent', message: await auth.requestEmailChange(email) }
      }

      // The email only changes once you confirm it, so the field goes back to the current one.
      discard()

      return outcome
    } catch (caught) {
      if (!(caught instanceof ApiError)) {
        throw caught
      }
      showError(caught)

      return null
    } finally {
      saving.value = false
    }
  }

  return { draft, hasChanges, saving, fieldErrors, formError, save, discard }
}
