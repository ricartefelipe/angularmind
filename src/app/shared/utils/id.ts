export function createCorrelationId(): string {
  return crypto.randomUUID()
}

export function createIdempotencyKey(): string {
  return crypto.randomUUID()
}
