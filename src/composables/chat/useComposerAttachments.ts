import { computed, onScopeDispose, ref, type ComputedRef, type Ref } from 'vue'
import { ApiError } from '@/lib/api'
import {
  attachmentProblem,
  maxAttachments,
  tooManyFilesMessage,
  type AttachmentStatus,
} from '@/lib/attachments'
import { chatErrorMessage } from '@/lib/chatError'
import { useMaterialsStore, type Material } from '@/stores/materials'

/** A file in the composer, from picking it until the message it goes with is sent. */
export interface Attachment {
  /** This composer's own key: a file has no id until the upload answers. */
  key: number
  name: string
  sizeBytes: number
  /** Null until uploaded, and for a file Sprout refused before uploading. */
  materialId: number | null
  status: AttachmentStatus
  /** Why it can't be used, as a sentence to show on its chip. */
  error: string | null
}

// The API reads a file in a few seconds; ask every 1.5 s (../specs/chat-attachments.md).
export const readPollInterval = 1500
// Reading never takes this long, so something went wrong: stop asking and say so.
export const readTimeout = 2 * 60_000

export const readTimeoutMessage =
  'Sprout took too long to read this file. Remove it and upload it again.'
const goneMessage = "We couldn't find that file. Upload it again."

/**
 * The files you attach to a message (`../specs/chat-attachments.md`): checked here first for
 * quick feedback, uploaded as soon as you pick them, then asked after until Sprout has read them.
 * Local to one composer; the materials store does the calls.
 */
export function useComposerAttachments(): {
  attachments: Ref<Attachment[]>
  /** A short note when you tried to attach more than fits ("Attach up to 5 files per message."). */
  notice: Ref<string | null>
  /** The ids to send, in the chips' order (a 422 on `material_ids.<index>` points at it). */
  readyIds: ComputedRef<number[]>
  add: (files: File[]) => void
  remove: (key: number) => void
  /** Takes the files off the composer for sending; `restore` puts them back if that fails. */
  takeForSending: () => Attachment[]
  /**
   * Puts the files back after a failed send (nothing was stored, so the same ids can go again),
   * with each `material_ids.<index>` error on its chip. Returns what to show above the composer.
   */
  restore: (sent: Attachment[], error: ApiError) => string | null
  /** Forgets every file, for a composer that starts over (sent files are already gone). */
  reset: () => void
} {
  const materialsStore = useMaterialsStore()

  const attachments = ref<Attachment[]>([])
  const notice = ref<string | null>(null)
  let nextKey = 1
  let disposed = false
  const timers = new Map<number, ReturnType<typeof setTimeout>>()

  const readyIds = computed<number[]>(() =>
    attachments.value.flatMap((attachment) =>
      attachment.status === 'ready' && attachment.materialId !== null
        ? [attachment.materialId]
        : [],
    ),
  )

  // The reactive copy in the list, or undefined once you removed it (then nothing should change).
  function find(key: number): Attachment | undefined {
    return attachments.value.find((attachment) => attachment.key === key)
  }

  function fail(key: number, error: string): void {
    const attachment = find(key)
    if (attachment !== undefined) {
      attachment.status = 'failed'
      attachment.error = error
    }
  }

  function stopPolling(key: number): void {
    clearTimeout(timers.get(key))
    timers.delete(key)
  }

  // Not blocking: the API deletes a file that was never sent after a day anyway.
  async function removeQuietly(materialId: number): Promise<void> {
    try {
      await materialsStore.remove(materialId)
    } catch (caught) {
      if (!(caught instanceof ApiError)) {
        throw caught
      }
      if (import.meta.env.DEV) {
        console.error(`Couldn't remove file ${materialId}: ${caught.message}`)
      }
    }
  }

  function applyMaterial(key: number, material: Material): void {
    const attachment = find(key)
    if (attachment === undefined) {
      return
    }
    attachment.materialId = material.id
    attachment.status = material.status
    attachment.error = material.error
  }

  function pollUntilRead(key: number, materialId: number, startedAt: number): void {
    timers.set(
      key,
      setTimeout(async () => {
        timers.delete(key)
        if (disposed || find(key) === undefined) {
          return
        }
        if (Date.now() - startedAt >= readTimeout) {
          fail(key, readTimeoutMessage)

          return
        }

        try {
          applyMaterial(key, await materialsStore.fetchMaterial(materialId))
        } catch (caught) {
          if (!(caught instanceof ApiError)) {
            throw caught
          }
          if (caught.status === 404) {
            fail(key, goneMessage)

            return
          }
          // A passing problem: the next ask may work, until the timeout says otherwise.
        }

        if (!disposed && find(key)?.status === 'processing') {
          pollUntilRead(key, materialId, startedAt)
        }
      }, readPollInterval),
    )
  }

  async function upload(key: number, file: File): Promise<void> {
    let material: Material
    try {
      material = await materialsStore.upload(file)
    } catch (caught) {
      if (!(caught instanceof ApiError)) {
        throw caught
      }
      fail(key, caught.fieldError('file') ?? caught.message)

      return
    }

    // Removed while it was uploading: it shouldn't stay on the server either.
    if (disposed || find(key) === undefined) {
      if (!disposed) {
        void removeQuietly(material.id)
      }

      return
    }
    applyMaterial(key, material)
    if (material.status === 'processing') {
      pollUntilRead(key, material.id, Date.now())
    }
  }

  function add(files: File[]): void {
    notice.value = null

    for (const file of files) {
      // Failed chips count until you remove them, as on the API.
      if (attachments.value.length >= maxAttachments) {
        notice.value = tooManyFilesMessage

        return
      }
      const key = nextKey++
      const problem = attachmentProblem(file)
      attachments.value.push({
        key,
        name: file.name,
        sizeBytes: file.size,
        materialId: null,
        status: problem === null ? 'uploading' : 'failed',
        error: problem,
      })
      if (problem === null) {
        void upload(key, file)
      }
    }
  }

  function remove(key: number): void {
    const attachment = find(key)
    if (attachment === undefined) {
      return
    }
    stopPolling(key)
    attachments.value = attachments.value.filter((candidate) => candidate.key !== key)
    notice.value = null
    if (attachment.materialId !== null) {
      void removeQuietly(attachment.materialId)
    }
  }

  function takeForSending(): Attachment[] {
    const sent = attachments.value
    attachments.value = []
    notice.value = null

    return sent
  }

  function restore(sent: Attachment[], error: ApiError): string | null {
    attachments.value = sent
    // Only ready files are sent, so an index counts the ready ones, in order.
    const sentReady = sent.filter((attachment) => attachment.status === 'ready')
    let hasFileErrors = false

    for (const [field, messages] of Object.entries(error.errors)) {
      const index = /^material_ids\.(\d+)$/.exec(field)?.[1]
      const attachment = index === undefined ? undefined : sentReady[Number(index)]
      const message = messages[0]
      if (attachment !== undefined && message !== undefined) {
        fail(attachment.key, message)
        hasFileErrors = true
      }
    }

    const listError = error.errors.material_ids?.[0]
    if (listError !== undefined) {
      return listError
    }
    if (error.fieldError('message') !== undefined) {
      return chatErrorMessage(error)
    }

    // The chips say what's wrong; Laravel's summary on top would only repeat the first one.
    return hasFileErrors ? null : chatErrorMessage(error)
  }

  function reset(): void {
    for (const key of timers.keys()) {
      stopPolling(key)
    }
    attachments.value = []
    notice.value = null
  }

  onScopeDispose(() => {
    disposed = true
    for (const timer of timers.values()) {
      clearTimeout(timer)
    }
    timers.clear()
  })

  return { attachments, notice, readyIds, add, remove, takeForSending, restore, reset }
}
