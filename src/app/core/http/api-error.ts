export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly correlationId: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
