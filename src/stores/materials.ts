import { defineStore } from 'pinia'
import { api } from '@/lib/api'

/*
 * Files you attach in the chat (`../API.md`, "Attachments"). Sprout reads the text out of each one
 * in the background; only `ready` files can be sent with a message. The composer keeps the files
 * you're attaching itself, so this store holds no state: it's the one place that calls `/materials`.
 */

/** `processing` while Sprout reads it, `ready` to send, `failed` when it can't be used. */
export type MaterialStatus = 'processing' | 'ready' | 'failed'

export interface Material {
  id: number
  original_filename: string
  size_bytes: number
  status: MaterialStatus
  /** Why reading failed, as a sentence to show as-is; null unless `failed`. */
  error: string | null
  created_at: string
}

export const useMaterialsStore = defineStore('materials', () => {
  /** Uploads one file; it comes back `processing`. */
  async function upload(file: File): Promise<Material> {
    const form = new FormData()
    form.append('file', file)

    return api<Material>('/materials', { method: 'POST', body: form })
  }

  /** Asks whether Sprout has read the file yet. */
  async function fetchMaterial(materialId: number): Promise<Material> {
    return api<Material>(`/materials/${materialId}`)
  }

  /** Removes a file you haven't sent; a sent one stays with its conversation (422). */
  async function remove(materialId: number): Promise<void> {
    await api<null>(`/materials/${materialId}`, { method: 'DELETE' })
  }

  return { upload, fetchMaterial, remove }
})
