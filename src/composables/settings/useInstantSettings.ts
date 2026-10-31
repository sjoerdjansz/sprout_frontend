import { computed, ref, type Ref, type WritableComputedRef } from 'vue'
import { useToast, type Toast } from '@/composables/useToast'
import { ApiError } from '@/lib/api'
import { useSettingsStore, type Settings, type SettingsChanges } from '@/stores/settings'

type SettingKey = Exclude<keyof Settings, 'learner_role' | 'timezone'>

export interface InstantSettings {
  /** A two-way binding for one preference: setting it saves it straight away. */
  setting: <Key extends SettingKey>(key: Key) => WritableComputedRef<Settings[Key]>
  save: (changes: SettingsChanges) => Promise<void>
  /** What went wrong with the last save, as the API said it. */
  error: Ref<string | null>
  toast: Ref<Toast | null>
}

/**
 * For the sections without a Save button (AI, Learning, Reminders, Appearance): every change is
 * shown at once and saved straight away. If saving fails, the old value comes back with the
 * reason.
 */
export function useInstantSettings(): InstantSettings {
  const settingsStore = useSettingsStore()
  const { toast, showToast } = useToast()
  const error = ref<string | null>(null)

  function current(): Settings {
    // The settings page only shows a section once your settings are loaded.
    if (settingsStore.settings === null) {
      throw new Error('Settings sections need the settings to be loaded first.')
    }

    return settingsStore.settings
  }

  async function save(changes: SettingsChanges): Promise<void> {
    const before = { ...current() }
    settingsStore.settings = { ...before, ...changes }
    error.value = null

    try {
      await settingsStore.updateSettings(changes)
      showToast({ title: 'Saved', tone: 'sprout', icon: 'check' })
    } catch (caught) {
      if (!(caught instanceof ApiError)) {
        throw caught
      }
      settingsStore.settings = before
      const firstField = Object.keys(changes)[0] ?? ''
      error.value = caught.fieldError(firstField) ?? caught.message
    }
  }

  function setting<Key extends SettingKey>(key: Key): WritableComputedRef<Settings[Key]> {
    return computed<Settings[Key]>({
      get: () => current()[key],
      set: (value) => {
        void save({ [key]: value })
      },
    })
  }

  return { setting, save, error, toast }
}
