import { describe, expect, it } from 'vitest'
import {
  enrichPythonError,
  extractLineNumber,
  normalizePythonError,
  offsetAtLine,
  preferPythonTraceback,
} from './errors.ts'

const SYNTAX_TRACEBACK = `Traceback (most recent call last):
  File "<user_code>", line 1
    print(
         ^
SyntaxError: '(' was never closed`

const RUNTIME_TRACEBACK = `Traceback (most recent call last):
  File "<user_code>", line 3, in <module>
    boom()
  File "<user_code>", line 2, in boom
    missing
NameError: name 'missing' is not defined`

describe('python error parsing', () => {
  it('extracts the line number from a SyntaxError traceback', () => {
    expect(extractLineNumber(SYNTAX_TRACEBACK)).toBe(1)
    expect(normalizePythonError({ type: 'SyntaxError', message: SYNTAX_TRACEBACK })).toEqual({
      name: 'SyntaxError',
      message: "SyntaxError: '(' was never closed",
      traceback: SYNTAX_TRACEBACK,
      line: 1,
    })
  })

  it('extracts the raising line from a runtime traceback', () => {
    expect(extractLineNumber(RUNTIME_TRACEBACK)).toBe(2)
    expect(normalizePythonError({ type: 'NameError', message: RUNTIME_TRACEBACK }).line).toBe(2)
  })

  it('fills line and message from stderr when the thrown error is empty', () => {
    const enriched = enrichPythonError(
      {
        name: 'PythonError',
        message: 'PythonError',
        traceback: 'PythonError',
        line: null,
      },
      SYNTAX_TRACEBACK,
    )
    expect(enriched.line).toBe(1)
    expect(enriched.message).toBe("SyntaxError: '(' was never closed")
    expect(enriched.name).toBe('SyntaxError')
  })

  it('strips a same-line JavaScript Pyodide suffix', () => {
    const mixed = `${SYNTAX_TRACEBACK} PythonError at new_error (https://cdn.jsdelivr.net/pyodide/v314.0.6/full/pyodide.asm.mjs:1:1)`
    expect(preferPythonTraceback(mixed)).toBe(SYNTAX_TRACEBACK)
    expect(normalizePythonError({ type: 'PythonError', message: mixed }).message).toBe(
      "SyntaxError: '(' was never closed",
    )
  })

  it('returns the start offset of a 1-based line', () => {
    expect(offsetAtLine('a\nbc\n', 1)).toBe(0)
    expect(offsetAtLine('a\nbc\n', 2)).toBe(2)
  })
})
