import { createMindHandlers } from '@ricartefelipe/mind-wallet-shared/msw'
import type { RequestHandler } from 'msw'

export const handlers = createMindHandlers({
  apiBasePath: '/api/v1',
  systemSlug: 'angularmind',
}) as unknown as RequestHandler[]
