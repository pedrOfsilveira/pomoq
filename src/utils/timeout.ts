const DEFAULT_TIMEOUT_MS = 10000

export class TimeoutError extends Error {
  constructor(message: string, public readonly timeoutMs: number) {
    super(message)
    this.name = 'TimeoutError'
  }
}

/**
 * Failsafe for promises that may hang indefinitely due to network/auth edge cases.
 */
export function withTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  message?: string,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return new Promise<T>((resolve, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new TimeoutError(
          message ?? `Operation timed out after ${timeoutMs}ms`,
          timeoutMs,
        ),
      )
    }, timeoutMs)

    Promise.resolve(promise)
      .then((value) => {
        if (timeoutId) clearTimeout(timeoutId)
        resolve(value)
      })
      .catch((error) => {
        if (timeoutId) clearTimeout(timeoutId)
        reject(error)
      })
  })
}

export { DEFAULT_TIMEOUT_MS }
