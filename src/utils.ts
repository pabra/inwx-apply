import c from 'ansi-colors';
import { inspect } from 'util';
import type {
  AddEntry,
  Entry,
  InwxRecord,
  ResourceRecordByType,
  ResourceRecordPerDomain,
  UpdateEntry,
} from './types';

const logLevels = {
  debug: 4,
  log: 3,
  info: 2,
  warn: 1,
  error: 0,
} as const;

const getLogger = (
  initialLogLevel: keyof typeof logLevels = 'warn',
): Record<keyof typeof logLevels, (...arg: any[]) => void> & {
  setLevel: (level: keyof typeof logLevels) => void;
} => {
  let logLevel = initialLogLevel;
  const logger = (
    level: keyof typeof logLevels,
    maxLevel: keyof typeof logLevels,
    ...obj: any[]
  ): void => {
    if (logLevels[level] > logLevels[maxLevel]) {
      return;
    }

    switch (level) {
      case 'debug':
      case 'log':
        process.stderr.write(c.green(level.toUpperCase()) + ': ');
        break;

      case 'info':
        process.stderr.write(c.blue(level.toUpperCase()) + ': ');
        break;

      case 'warn':
        process.stderr.write(c.yellow(level.toUpperCase()) + ': ');
        break;

      case 'error':
        process.stderr.write(c.red(level.toUpperCase()) + ': ');
        break;
    }
    const args = { depth: null, colors: true };
    process.stderr.write(
      obj.map(o => (typeof o === 'string' ? o : inspect(o, args))).join(' ') +
        '\n',
    );
  };

  return {
    setLevel: (newLogLevel: keyof typeof logLevels): void =>
      void (logLevel = newLogLevel),
    debug: (...args: any[]): void => logger('debug', logLevel, ...args),
    log: (...args: any[]): void => logger('log', logLevel, ...args),
    info: (...args: any[]): void => logger('info', logLevel, ...args),
    warn: (...args: any[]): void => logger('warn', logLevel, ...args),
    error: (...args: any[]): void => logger('error', logLevel, ...args),
  };
};

const mainLogger = getLogger();

type Key = string | number | symbol;

const isKeyof = <T extends Record<Key, any>>(
  obj: T,
  key: Key,
): key is keyof T => Object.prototype.hasOwnProperty.call(obj, key);

const isEntryEqual = (a: Entry, b: Entry): boolean => {
  if (a.replaceContentFn && b.replaceContentFn) {
    throw new Error('only one side might have a content replace function');
  }
  const replaceFn = a.replaceContentFn || b.replaceContentFn;
  const aContent = replaceFn !== undefined ? replaceFn(a.content) : a.content;
  const bContent = replaceFn !== undefined ? replaceFn(b.content) : b.content;

  return (
    a.name === b.name &&
    a.type === b.type &&
    aContent === bContent &&
    a.ttl === b.ttl &&
    a.prio === b.prio
  );
};

const entrySorter = (a: Entry, b: Entry): number =>
  a.type > b.type
    ? +1
    : a.type < b.type
    ? -1
    : a.name > b.name
    ? +1
    : a.name < b.name
    ? -1
    : a.content > b.content
    ? +1
    : a.content < b.content
    ? -1
    : a.prio > b.prio
    ? +1
    : a.prio < b.prio
    ? -1
    : a.ttl > b.ttl
    ? +1
    : a.ttl < b.ttl
    ? -1
    : 0;

const replaceDomainPlaceholder = (entry: string, idnaDomain: string): string =>
  entry.replace(/\*$/, idnaDomain);

const getWantedEntries = (
  resourceRecords: ResourceRecordPerDomain,
  domain: string,
): ResourceRecordByType => {
  const recordsForAll = isKeyof(resourceRecords, '*')
    ? resourceRecords['*']
    : {};
  const recordsForDomain = isKeyof(resourceRecords, domain)
    ? resourceRecords[domain]
    : {};

  return { ...recordsForAll, ...recordsForDomain };
};

const getEntriesDiff = (
  wanted: AddEntry[],
  existing: InwxRecord[],
): { toAdd: AddEntry[]; toRemove: InwxRecord[]; toUpdate: UpdateEntry[] } => {
  const { uniqueAdd, uniqueRemove } = wanted
    .sort(entrySorter)
    .reduce<{ uniqueAdd: AddEntry[]; uniqueRemove: InwxRecord[] }>(
      (acc, curr) => {
        const removeIdx = acc.uniqueRemove.findIndex(entry =>
          isEntryEqual(entry, curr),
        );
        if (removeIdx === -1) {
          acc.uniqueAdd.push({ ...curr });
        } else {
          acc.uniqueRemove.splice(removeIdx, 1);
        }
        return acc;
      },
      { uniqueAdd: [], uniqueRemove: [...existing].sort(entrySorter) },
    );

  return uniqueRemove.reduce<{
    toAdd: AddEntry[];
    toRemove: InwxRecord[];
    toUpdate: UpdateEntry[];
  }>(
    (acc, curr) => {
      const addEntry = acc.toAdd.shift();
      if (addEntry === undefined) {
        acc.toRemove.push({ ...curr });
      } else {
        acc.toUpdate.push({ old: { ...curr }, new: { ...addEntry } });
      }
      return acc;
    },
    { toAdd: [...uniqueAdd], toRemove: [], toUpdate: [] },
  );
};

export {
  getEntriesDiff,
  getWantedEntries,
  mainLogger,
  replaceDomainPlaceholder,
};
