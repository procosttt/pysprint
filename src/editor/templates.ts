import { insertText } from './operations.ts'
import { CURSOR_MARK } from './types.ts'
import type { EditorSnapshot, TemplateId } from './types.ts'

export const TEMPLATES: Record<TemplateId, string> = {
  for: 'for i in range(|):',
  if: 'if |:',
  while: 'while |:',
  print: 'print(|)',
  input: 'input(|)',
  intInput: 'int(input(|))',
  range: 'range(|)',
}

export function insertTemplate(
  snapshot: EditorSnapshot,
  templateId: TemplateId,
): EditorSnapshot {
  const template = TEMPLATES[templateId]
  const markAt = template.indexOf(CURSOR_MARK)
  const text = template.replace(CURSOR_MARK, '')
  const inserted = insertText(snapshot, text)
  const start = Math.min(snapshot.selectionStart, snapshot.selectionEnd)
  const cursor = start + (markAt === -1 ? text.length : markAt)
  return {
    value: inserted.value,
    selectionStart: cursor,
    selectionEnd: cursor,
  }
}
