import { by } from '@pabra/sortby';
import { readFileSync } from 'fs';
import { join } from 'path';
import type {
  AddEntry,
  Entry,
  InwxRecord,
  ResourceRecordByType,
  ResourceRecordPerDomain,
  UpdateEntry,
} from './types';

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

const byEntry = by('type', 'name', 'content', 'prio', 'ttl');
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
    .sort(byEntry)
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
      { uniqueAdd: [], uniqueRemove: [...existing].sort(byEntry) },
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

const getPackageJson = (dir: string): Record<string, any> => {
  const path = join(dir, 'package.json');

  return JSON.parse(readFileSync(path, 'utf-8'));
};

const getOwnPackageJson = (): Record<string, any> => {
  try {
    // while development, __dirname is src/ -> package.json must be one dir up
    return getPackageJson(join(__dirname, '..'));
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  try {
    // after build, __dirname is dist/cjs/ -> package.json must be two dirs up
    return getPackageJson(join(__dirname, '..', '..'));
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  return {};
};

const getOwnVersionString = (): string => {
  const { name, version } = getOwnPackageJson();
  return `${name} version: ${version}`;
};

export {
  getEntriesDiff,
  getOwnPackageJson,
  getOwnVersionString,
  getWantedEntries,
  replaceDomainPlaceholder,
};
