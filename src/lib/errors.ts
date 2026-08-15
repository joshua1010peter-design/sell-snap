export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function apiError(message: string, code: string, statusCode: number = 400) {
  return { ok: false as const, error: { code, message } }
}

export function apiSuccess<T>(data: T) {
  return { ok: true as const, data }
}
