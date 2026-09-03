export function editorHint(focused: boolean, hasDraft: boolean): string {
  if (focused) {
    return 'Редактирование'
  }
  if (hasDraft) {
    return 'Черновик сохранён'
  }
  return 'Нажмите, чтобы печатать'
}
