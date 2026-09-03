import { USER_CODE_FILENAME } from './protocol.ts'
import type { NormalizedError } from './protocol.ts'

const USER_LINE = new RegExp(
  `File "${USER_CODE_FILENAME.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')}", line (\\d+)`,
  'g',
)

export function preferPythonTraceback(text: string): string {
  if (!text.trim() || text.trim() === 'PythonError') {
    return ''
  }
  const start = text.indexOf('Traceback (most recent call last)')
  const user = text.indexOf(`File "${USER_CODE_FILENAME}"`)
  const begin = start !== -1 ? start : user !== -1 ? user : 0
  const source = text.slice(begin)
  const jsStart = source.search(/PythonError at /)
  if (jsStart === 0) {
    return ''
  }
  return (jsStart === -1 ? source : source.slice(0, jsStart))
    .replace(/\nPythonError\s*$/u, '')
    .trimEnd()
}

export function extractLineNumber(traceback: string): number | null {
  const matches = [...traceback.matchAll(USER_LINE)]
  const last = matches.at(-1)
  if (last?.[1]) {
    const line = Number(last[1])
    return Number.isFinite(line) ? line : null
  }
  return null
}

export function lastTracebackLine(traceback: string): string {
  const lines = traceback
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
  return lines.at(-1) ?? 'Ошибка Python'
}

function errorTypeName(error: object, traceback: string): string {
  if (
    'type' in error &&
    typeof error.type === 'string' &&
    error.type.length > 0 &&
    error.type !== 'PythonError'
  ) {
    return error.type
  }
  const last = lastTracebackLine(traceback)
  const match = last.match(/^([A-Za-z_][A-Za-z0-9_]*)/)
  if (match?.[1] && /(?:Error|Exception|Warning|Exit)$/.test(match[1])) {
    return match[1]
  }
  if (error instanceof Error && error.name && error.name !== 'Error' && error.name !== 'PythonError') {
    return error.name
  }
  return 'Error'
}

function collectTraceback(error: unknown): string {
  if (typeof error === 'string') {
    return preferPythonTraceback(error)
  }
  if (typeof error !== 'object' || error === null) {
    return preferPythonTraceback(String(error))
  }
  const candidates = [
    'message' in error ? String(error.message) : '',
    String(error),
    'stack' in error ? String(error.stack ?? '') : '',
  ]
  for (const candidate of candidates) {
    const python = preferPythonTraceback(candidate)
    if (python.includes(`File "${USER_CODE_FILENAME}"`) || python.includes('Traceback')) {
      return python
    }
  }
  return preferPythonTraceback(candidates.find((part) => part.trim()) ?? '')
}

export function normalizePythonError(error: unknown): NormalizedError {
  const traceback = collectTraceback(error)
  const name =
    typeof error === 'object' && error !== null ? errorTypeName(error, traceback) : 'Error'
  return {
    name,
    message: lastTracebackLine(traceback),
    traceback,
    line: extractLineNumber(traceback),
  }
}

export function enrichPythonError(error: NormalizedError, stderr: string): NormalizedError {
  const fromError = preferPythonTraceback(error.traceback)
  const fromStderr = preferPythonTraceback(stderr)
  const errorHasPython =
    fromError.includes(`File "${USER_CODE_FILENAME}"`) || fromError.includes('Traceback')
  const chosen = errorHasPython ? fromError : fromStderr || fromError
  return {
    name: errorTypeName({ type: error.name }, chosen),
    traceback: chosen,
    message: lastTracebackLine(chosen),
    line: extractLineNumber(chosen) ?? error.line,
  }
}

export function offsetAtLine(text: string, lineNumber: number): number {
  const target = Math.max(1, Math.floor(lineNumber))
  let current = 1
  for (let index = 0; index < text.length; index += 1) {
    if (current === target) {
      return index
    }
    if (text[index] === '\n') {
      current += 1
    }
  }
  return text.length
}
