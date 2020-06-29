import getLogger, {
  consoleTransporter,
  getMaxLevelFilter,
  textWithoutDataFormatter,
} from '@pabra/logger';
import { args } from './cliArgs';

const logger = getLogger({
  name: 'inwx-apply',
  handlers: [
    {
      filter: getMaxLevelFilter(args['--debug'] ? 'debug' : 'warning'),
      formatter: textWithoutDataFormatter,
      transporter: consoleTransporter,
    },
  ],
});

export { logger };
