export type ShortcutEvent = {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
  altKey?: boolean
}

export function historyShortcut(event: ShortcutEvent): 'undo' | 'redo' | null {
  if (event.altKey) {
    return null
  }

  const modifier = event.ctrlKey || event.metaKey
  if (!modifier) {
    return null
  }

  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
  if (key === 'z') {
    return event.shiftKey ? 'redo' : 'undo'
  }
  if (key === 'y' && !event.shiftKey) {
    return 'redo'
  }
  return null
}
