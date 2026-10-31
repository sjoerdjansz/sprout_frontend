import type { DownloadedFile } from '@/lib/api'

/** Hands a downloaded file to the browser, which saves it like any other download. */
export function saveFile({ blob, filename }: DownloadedFile): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
