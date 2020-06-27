import getLogger, {
  consoleTextHandler,
  getMaxLevelFilter,
} from '@pabra/logger';

const debugFilter = getMaxLevelFilter('debug');

const rootLogger = getLogger({
  name: 'inwx-apply',
  handlers: [consoleTextHandler],
});

export { rootLogger, debugFilter };
