export function editorHint(hasDraft: boolean): string {
  if (hasDraft) {
    return 'Черновик сохранён'
  }
  return 'Нажмите здесь и начните писать'
}
