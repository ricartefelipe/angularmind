import { createMindHandlers } from '@ricartefelipe/mind-wallet-shared/msw'
import type { RequestHandler } from 'msw'
import { totalRecallBaseUrl } from '../../shared/totalrecall'

export const handlers = createMindHandlers({
  apiBasePath: '/api/v1',
  systemSlug: 'angularmind',
  totalRecallUrl: totalRecallBaseUrl(),
}) as unknown as RequestHandler[]
