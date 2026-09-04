import { loadPyodide, type PyodideInterface } from 'pyodide'
import { enrichPythonError, normalizePythonError, preferPythonTraceback } from './errors.ts'
import { OUTPUT_LIMIT, OUTPUT_LIMIT_MESSAGE, OUTPUT_LIMIT_TOKEN } from './outputLimit.ts'
import { PYODIDE_INDEX_URL, USER_CODE_FILENAME } from './protocol.ts'
import type { NormalizedError, WorkerRequest, WorkerResponse } from './protocol.ts'

type Destroyable = {
  destroy?: () => void
}

type PyDict = Destroyable & {
  set: (key: string, value: unknown) => void
}

type StringIOBuffer = Destroyable & {
  getvalue: () => unknown
  write: (value: string) => unknown
}

type IoModule = Destroyable & {
  StringIO: (value?: string) => StringIOBuffer
}

type SysModule = Destroyable & {
  stdin: unknown
  stdout: unknown
  stderr: unknown
}

type DictCtor = ((entries?: unknown) => PyDict) & Destroyable

type LimitedWriter = Destroyable & {
  overflowed: boolean
  getvalue: () => unknown
}

type WriterCtor = ((limit: number) => LimitedWriter) & Destroyable

type RuntimeHandles = {
  sys: SysModule
  io: IoModule
  dictCtor: DictCtor
  writerCtor: WriterCtor
}

const LIMITED_WRITER_PY = `
class LimitedWriter:
    def __init__(self, limit):
        self._parts = []
        self._n = 0
        self.limit = int(limit)
        self.overflowed = False
        self.encoding = "utf-8"
        self.errors = "strict"
        self.newlines = None
        self.name = "<limited>"
    def write(self, data):
        text = data if isinstance(data, str) else str(data)
        if self.overflowed:
            return len(text)
        room = self.limit - self._n
        if len(text) > room:
            if room > 0:
                self._parts.append(text[:room])
                self._n = self.limit
            self.overflowed = True
            raise RuntimeError("${OUTPUT_LIMIT_TOKEN}")
        self._parts.append(text)
        self._n += len(text)
        return len(text)
    def flush(self):
        return None
    def getvalue(self):
        return "".join(self._parts)
    def writable(self):
        return True
`

let pyodidePromise: Promise<PyodideInterface> | null = null
let runtime: RuntimeHandles | null = null

function post(message: WorkerResponse): void {
  self.postMessage(message)
}

function destroyProxy(value: unknown): void {
  if (
    typeof value === 'object' &&
    value !== null &&
    'destroy' in value &&
    typeof (value as { destroy?: unknown }).destroy === 'function'
  ) {
    try {
      ;(value as { destroy: () => void }).destroy()
    } catch {
      // Already destroyed.
    }
  }
}

function asString(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (value == null) {
    return ''
  }
  const text = String(value)
  destroyProxy(value)
  return text
}

function ensurePyodide(): Promise<PyodideInterface> {
  if (!pyodidePromise) {
    pyodidePromise = loadPyodide({
      indexURL: PYODIDE_INDEX_URL,
    }).then((pyodide) => {
      pyodide.runPython(LIMITED_WRITER_PY)
      return pyodide
    })
  }
  return pyodidePromise
}

function getRuntime(pyodide: PyodideInterface): RuntimeHandles {
  if (!runtime) {
    runtime = {
      sys: pyodide.pyimport('sys') as SysModule,
      io: pyodide.pyimport('io') as IoModule,
      dictCtor: pyodide.globals.get('dict') as DictCtor,
      writerCtor: pyodide.globals.get('LimitedWriter') as WriterCtor,
    }
  }
  return runtime
}

async function handleInit(requestId: string): Promise<void> {
  post({ type: 'loading', requestId })
  try {
    await ensurePyodide()
    post({ type: 'ready', requestId })
  } catch {
    pyodidePromise = null
    runtime = null
    post({ type: 'error', requestId, kind: 'load-error' })
  }
}

async function handleRun(request: Extract<WorkerRequest, { type: 'run' }>): Promise<void> {
  const started = Date.now()
  try {
    const pyodide = await ensurePyodide()
    const outcome = await executeUserCode(pyodide, request.code, request.stdin)
    post({
      type: 'result',
      requestId: request.requestId,
      stdout: outcome.stdout,
      stderr: outcome.stderr,
      ok: outcome.ok,
      error: outcome.error,
      line: outcome.error?.line ?? null,
      durationMs: Date.now() - started,
    })
  } catch (error) {
    const normalized = normalizePythonError(error)
    destroyProxy(error)
    post({
      type: 'result',
      requestId: request.requestId,
      stdout: '',
      stderr: normalized.traceback,
      ok: false,
      error: normalized,
      line: normalized.line,
      durationMs: Date.now() - started,
    })
  }
}

async function executeUserCode(
  pyodide: PyodideInterface,
  code: string,
  stdin: string,
): Promise<{
  stdout: string
  stderr: string
  ok: boolean
  error: NormalizedError | null
}> {
  const { sys, io, dictCtor, writerCtor } = getRuntime(pyodide)
  const namespace = dictCtor()
  namespace.set('__name__', '__main__')

  const stdinBuf = io.StringIO(stdin)
  const stdoutBuf = writerCtor(OUTPUT_LIMIT)
  const stderrBuf = writerCtor(OUTPUT_LIMIT)

  const previousStdin = sys.stdin
  const previousStdout = sys.stdout
  const previousStderr = sys.stderr

  let ok = true
  let error: NormalizedError | null = null
  let result: unknown

  try {
    sys.stdin = stdinBuf
    sys.stdout = stdoutBuf
    sys.stderr = stderrBuf
    result = await pyodide.runPythonAsync(code, {
      globals: namespace as never,
      filename: USER_CODE_FILENAME,
    })
  } catch (caught) {
    ok = false
    error = normalizePythonError(caught)
    destroyProxy(caught)
  } finally {
    try {
      sys.stdin = previousStdin
      sys.stdout = previousStdout
      sys.stderr = previousStderr
    } catch {
      // Restore best-effort.
    }
  }

  const overflowed = Boolean(stdoutBuf.overflowed) || Boolean(stderrBuf.overflowed)
  const stdout = asString(stdoutBuf.getvalue())
  let stderr = preferPythonTraceback(asString(stderrBuf.getvalue()))

  if (overflowed || error?.message.includes(OUTPUT_LIMIT_TOKEN)) {
    ok = false
    error = {
      name: 'OutputLimitError',
      message: OUTPUT_LIMIT_MESSAGE,
      traceback: '',
      line: null,
    }
    stderr = ''
  } else if (!ok && error) {
    error = enrichPythonError(error, stderr)
    if (!stderr.includes(error.traceback)) {
      stderr = stderr ? `${stderr}\n${error.traceback}` : error.traceback
    }
  }

  destroyProxy(result)
  destroyProxy(namespace)
  destroyProxy(stdinBuf)
  destroyProxy(stdoutBuf)
  destroyProxy(stderrBuf)

  return { stdout, stderr, ok, error }
}

self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const message = event.data
  if (message.type === 'init') {
    void handleInit(message.requestId)
    return
  }
  if (message.type === 'run') {
    void handleRun(message)
  }
})

void ensurePyodide()
