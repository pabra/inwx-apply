#!/usr/bin/env node

import { existsSync } from 'fs';
import { basename, resolve } from 'path';
import { args } from './cliArgs';
import { main } from './index';
import { logger as rootLogger } from './logging';
import { getOwnPackageJson, getOwnVersionString } from './utils';

const defaultEntriesFile = './inwxDnsEntries.js';
const logger = rootLogger.getLogger('cli');

logger.debug('args:', args);

const showHelp = (): void => {
  const { description } = getOwnPackageJson();
  const help = [
    getOwnVersionString(),
    description,
    '',
    'USAGE:',
    `    ${basename(process.argv[1])} [OPTIONS]`,
    '',
    'OPTIONS:',
    '    -h, --help',
    '        show this help',
    '',
    '    -v, --version',
    '        show version',
    '',
    '    -d, --debug',
    '        log debug output',
    '',
    '    -f <FILE_NAME>, --file=<FILE_NAME>',
    '        path to DNS entries exporting file',
    '',
    '    -w, --write',
    '        actually write entries through INWX API',
    '',
    '    -i, --insane',
    '        ignore sanity checks',
  ].join('\n');

  process.stdout.write(`${help}\n`);
};

const showVersion = (): void => {
  process.stdout.write(`${getOwnVersionString()}\n`);
};

if (args['--help']) {
  showHelp();
} else if (args['--version']) {
  showVersion();
} else {
  const doWrite = Boolean(args['--write']);
  const entriesFile = resolve(args['--file'] || defaultEntriesFile);
  const ignoreSanity = Boolean(args['--insane']);

  logger.debug('doWrite:', doWrite);
  logger.debug('entriesFile:', entriesFile);
  logger.debug('ignoreSanity:', ignoreSanity);

  if (!existsSync(entriesFile)) {
    logger.warning(`no file: ${entriesFile}`);
  } else {
    main(entriesFile, doWrite, ignoreSanity);
  }
}
