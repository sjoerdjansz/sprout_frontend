import { describe, expect, it } from 'vitest'
import {
  attachmentProblem,
  formatFileSize,
  maxFileBytes,
  tooLargeMessage,
  wrongTypeMessage,
} from '@/lib/attachments'

function fileOfSize(name: string, bytes: number): File {
  const file = new File([''], name)
  Object.defineProperty(file, 'size', { value: bytes })

  return file
}

describe('attachmentProblem', () => {
  it('accepts the document types the API reads, in any capitalisation', () => {
    for (const name of ['a.pdf', 'b.DOCX', 'c.doc', 'd.pages', 'e.txt', 'f.md']) {
      expect(attachmentProblem(fileOfSize(name, 100))).toBeNull()
    }
  })

  it('refuses other types and files without an extension', () => {
    expect(attachmentProblem(fileOfSize('photo.png', 100))).toBe(wrongTypeMessage)
    expect(attachmentProblem(fileOfSize('README', 100))).toBe(wrongTypeMessage)
  })

  it('refuses files over 10 MB', () => {
    expect(attachmentProblem(fileOfSize('a.pdf', maxFileBytes))).toBeNull()
    expect(attachmentProblem(fileOfSize('a.pdf', maxFileBytes + 1))).toBe(tooLargeMessage)
  })
})

describe('formatFileSize', () => {
  it('shows bytes, kilobytes or megabytes', () => {
    expect(formatFileSize(820)).toBe('820 bytes')
    expect(formatFileSize(482113)).toBe('471 KB')
    expect(formatFileSize(2.4 * 1024 * 1024)).toBe('2.4 MB')
  })
})
