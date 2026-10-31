import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api, apiDownload, type DownloadedFile } from '@/lib/api'
import { useAuthStore, type AvatarColor } from '@/stores/auth'

export type LearnerRole =
  'student' | 'professional' | 'career_switcher' | 'curious' | 'teacher' | 'language_learner'

export type AiLevel = 'low' | 'medium' | 'high'
export type CardCount = 10 | 20 | 40
export type ReminderChannel = 'push' | 'email' | 'both'
export type ThemePreference = 'light' | 'dark' | 'system'

/** Your preferences, as returned by `GET /settings` and `PATCH /settings`. */
export interface Settings {
  learner_role: LearnerRole | null
  avatar_color: AvatarColor
  ai_level: AiLevel
  daily_goal_cards: CardCount
  session_size: CardCount
  interleave_subtopics: boolean
  hint_before_answer: boolean
  save_chats_as_material: boolean
  wants_daily_reminder: boolean
  /** `HH:MM` in your `timezone`. */
  reminder_time: string
  wants_streak_reminder: boolean
  wants_weekly_insights: boolean
  reminder_channel: ReminderChannel
  theme: ThemePreference
  reduce_motion: boolean
  sound_effects: boolean
  timezone: string
}

/** Your AI calls this calendar month, per kind, as returned by `GET /settings/usage`. */
export interface AiUsage {
  /** `YYYY-MM`, in your timezone. */
  month: string
  tutor_replies: number
  answers_checked: number
  explain_feedback: number
  card_batches: number
  total: number
}

/** What `PATCH /settings` takes: only the fields a section changes. */
export type SettingsChanges = Partial<Omit<Settings, 'learner_role'>> & {
  learner_role?: LearnerRole
}

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Settings | null>(null)
  const usage = ref<AiUsage | null>(null)

  // The app shell and the settings page both ask for the settings when they mount; they share
  // one request.
  let pendingFetch: Promise<Settings> | null = null

  async function fetchSettings(): Promise<Settings> {
    if (pendingFetch === null) {
      pendingFetch = api<Settings>('/settings')
        .then((fetchedSettings) => {
          settings.value = fetchedSettings

          return fetchedSettings
        })
        .finally(() => {
          pendingFetch = null
        })
    }

    return pendingFetch
  }

  async function updateSettings(changes: SettingsChanges): Promise<Settings> {
    const updatedSettings = await api<Settings>('/settings', { method: 'PATCH', body: changes })
    settings.value = updatedSettings

    // `GET /user` carries the avatar colour too; keep the sidebar's avatar in step.
    const auth = useAuthStore()
    if (auth.user !== null) {
      auth.user.avatar_color = updatedSettings.avatar_color
    }

    return updatedSettings
  }

  async function fetchUsage(): Promise<AiUsage> {
    const fetchedUsage = await api<AiUsage>('/settings/usage')
    usage.value = fetchedUsage

    return fetchedUsage
  }

  /** Everything you have in Sprout, as one JSON file. */
  async function exportLibrary(): Promise<DownloadedFile> {
    return apiDownload('/user/export', 'sprout-export.json')
  }

  /** Your flashcards as CSV for Anki. */
  async function exportFlashcards(): Promise<DownloadedFile> {
    return apiDownload('/user/export/flashcards', 'sprout-flashcards.csv')
  }

  /** Wipes your learning history; can't be undone. */
  async function resetProgress(): Promise<void> {
    await api('/user/progress/reset', { method: 'POST' })
  }

  /** "Today", streaks, usage months and reminder times follow your timezone, so keep it current. */
  async function syncTimezone(): Promise<void> {
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (settings.value === null || settings.value.timezone === browserTimezone) {
      return
    }
    await updateSettings({ timezone: browserTimezone })
  }

  return {
    settings,
    usage,
    fetchSettings,
    updateSettings,
    fetchUsage,
    exportLibrary,
    exportFlashcards,
    resetProgress,
    syncTimezone,
  }
})
