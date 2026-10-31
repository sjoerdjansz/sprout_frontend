/*
 * The rules for files you attach in the chat (`../specs/chat-attachments.md`). The API checks them
 * too and is the one that counts; these only give quicker feedback. The size check matters most:
 * the web server refuses anything far over the limit with a 413 that isn't JSON, before the API
 * can say why, so a file that's too big is never uploaded.
 */

export const maxAttachments = 5

// The API's limit (Laravel's `max:10240`, in kilobytes).
export const maxFileBytes = 10 * 1024 * 1024

export const acceptedExtensions = ['.pdf', '.docx', '.doc', '.pages', '.txt', '.md']

/** The file picker's `accept`. */
export const acceptAttribute = acceptedExtensions.join(',')

// The same sentences as the API, so a file reads the same whoever refused it.
export const tooManyFilesMessage = 'Attach up to 5 files per message.'
export const tooLargeMessage = 'Keep files under 10 MB.'
export const wrongTypeMessage = 'Upload a PDF, Word, Pages, text or Markdown file.'

function extension(filename: string): string {
  const dot = filename.lastIndexOf('.')

  return dot === -1 ? '' : filename.slice(dot).toLowerCase()
}

/** Why Sprout won't upload this file, or null when it can try. */
export function attachmentProblem(file: File): string | null {
  if (!acceptedExtensions.includes(extension(file.name))) {
    return wrongTypeMessage
  }
  if (file.size > maxFileBytes) {
    return tooLargeMessage
  }

  return null
}

/** "820 bytes", "482 KB", "2.4 MB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} bytes`
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** A file in the composer: on its way up first, then as the API reads it. */
export type AttachmentStatus = 'uploading' | 'processing' | 'ready' | 'failed'
