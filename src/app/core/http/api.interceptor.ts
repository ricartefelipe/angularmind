import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { catchError, throwError } from 'rxjs'
import type { ApiErrorBody } from '@/shared/types/api'
import { createCorrelationId } from '@/shared/utils/id'
import { TokenStorage } from '../auth/token.storage'
import { ApiError } from './api-error'

function resolveApiUrl(url: string): string {
  if (!url.startsWith('/api/')) return url
  const base = (document.querySelector('base')?.getAttribute('href') ?? '/').replace(
    /\/?$/,
    '/',
  )
  return `${base}${url.slice(1)}`
}

export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(TokenStorage).get()
  const correlationId = createCorrelationId()
  let headers = request.headers
    .set('X-Correlation-Id', correlationId)
    .set('Accept', 'application/json')

  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`)
  }

  return next(request.clone({ url: resolveApiUrl(request.url), headers })).pipe(
    catchError((error: HttpErrorResponse) => {
      const body = error.error as ApiErrorBody | undefined

      return throwError(
        () =>
          new ApiError(
            error.status,
            body?.code ?? 'HTTP_ERROR',
            body?.message ?? error.statusText,
            body?.correlationId ?? correlationId,
          ),
      )
    }),
  )
}
