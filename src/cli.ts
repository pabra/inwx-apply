#!/usr/bin/env node

import arg from 'arg';
import { existsSync } from 'fs';
import { basename, resolve } from 'path';
import { main } from './index';
import { debugFilter, rootLogger } from './logging';
import { getOwnPackageJson, getOwnVersionString } from './utils';

let handler = rootLogger.handlers[0];

const defaultEntriesFile = './inwxDnsEntries.js';

const args = arg({
  // Types
  '--help': Boolean,
  '--version': Boolean,
  '--debug': Boolean,
  '--file': String,
  '--write': Boolean,
  '--insane': Boolean,

  // Aliases
  '-h': '--help',
  '-v': '--version',
  '-d': '--debug',
  '-f': '--file',
  '-w': '--write',
  '-i': '--insane',
});

if (args['--debug']) {
  handler = { ...handler, filter: debugFilter };
}

const cliLogger = rootLogger.getLogger({ name: 'cli', handlers: [handler] });
const indexLogger = rootLogger.getLogger({
  name: 'index',
  handlers: [handler],
});

cliLogger.debug('args:', args);

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

  cliLogger.debug('doWrite:', doWrite);
  cliLogger.debug('entriesFile:', entriesFile);
  cliLogger.debug('ignoreSanity:', ignoreSanity);

  if (!existsSync(entriesFile)) {
    cliLogger.warning(`no file: ${entriesFile}`);
  } else {
    main(entriesFile, doWrite, ignoreSanity, indexLogger);
  }
}
