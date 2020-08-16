import getLogger, { handlers } from '@pabra/logger';
import { args } from './cliArgs';

export const logger = getLogger(
  'inwx-apply',
  handlers.getConsoleRawDataHandler(args['--debug'] ? 'debug' : 'warning'),
);
