import getLogger, {
  consoleRawDataHandler,
  getMaxLevelFilter,
} from '@pabra/logger';

const debugFilter = getMaxLevelFilter('debug');

const rootLogger = getLogger({
  name: 'inwx-apply',
  handlers: [consoleRawDataHandler],
});

export { rootLogger, debugFilter };
