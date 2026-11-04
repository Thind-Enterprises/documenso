import { Hono } from 'hono';

import type { HonoEnv } from '../../router';
import { detectFieldsRoute } from './detect-fields';
import { detectRecipientsRoute } from './detect-recipients';
import { summarizeDocumentRoute } from './summarize-document';

export const aiRoute = new Hono<HonoEnv>()
  .route('/detect-recipients', detectRecipientsRoute)
  .route('/detect-fields', detectFieldsRoute)
  .route('/summarize-document', summarizeDocumentRoute);
