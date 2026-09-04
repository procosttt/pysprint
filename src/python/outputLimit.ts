export const OUTPUT_LIMIT = 50_000
export const CODE_MAX_LENGTH = 50_000
export const OUTPUT_LIMIT_MESSAGE = 'Слишком много вывода. Выполнение остановлено.'
export const OUTPUT_LIMIT_TOKEN = 'OUTPUT_LIMIT'

export class LimitedOutputBuffer {
  private readonly chunks: string[] = []
  private size = 0
  private readonly limit: number
  overflowed = false

  constructor(limit = OUTPUT_LIMIT) {
    this.limit = limit
  }

  write(text: string): number {
    const value = text
    if (this.overflowed) {
      return value.length
    }
    const remaining = this.limit - this.size
    if (value.length > remaining) {
      if (remaining > 0) {
        this.chunks.push(value.slice(0, remaining))
        this.size = this.limit
      }
      this.overflowed = true
      throw new Error(OUTPUT_LIMIT_TOKEN)
    }
    this.chunks.push(value)
    this.size += value.length
    return value.length
  }

  getvalue(): string {
    return this.chunks.join('')
  }
}
