export type FreeRunRequest = {
  code: string
  stdin: string
}

export function createFreeRunRequest(code: string, consoleStdin: string): FreeRunRequest {
  return {
    code,
    stdin: consoleStdin,
  }
}
