import c from 'ansi-colors';
import { ApiClient, Language } from 'domrobot-client';
import { toASCII } from 'punycode'; // eslint-disable-line node/no-deprecated-api
import { logger as rootLogger } from './logging';
import type {
  AddEntry,
  Config,
  Credentials,
  Entry,
  InwxRecord,
  InwxRecordsByType,
  RegisteredDomain,
  ResourceRecordPerDomain,
  ResourceRecordType,
  UpdateEntry,
} from './types';
import { config as rtConfig } from './types';
import {
  getEntriesDiff,
  getWantedEntries,
  replaceDomainPlaceholder,
} from './utils';

const logger = rootLogger.getLogger('index');

const getConfig = (path: string): Config => {
  const conf = JSON.parse(require(path)); // eslint-disable-line @typescript-eslint/no-var-requires
  const validated = rtConfig.validate(conf);

  if (!validated.success) {
    const { message, key } = validated;
    logger.warning(message, { key, conf: { ...conf, credentials: '***' } });
    throw new Error(message);
  }

  return validated.value;
};

const assertApiResponse = async (
  apiClient: ApiClient,
  response: any,
  onErrorLogout = true,
  expectedCode = 1000,
  apiMethod?: string,
  methodParams?: any,
): Promise<void> => {
  if (response.code !== expectedCode) {
    if (onErrorLogout) {
      await logout(apiClient); // eslint-disable-line @typescript-eslint/no-use-before-define
    }
    logger.err('bad response:', { response, apiMethod, methodParams });
    throw new Error(
      `Api error. Code: ${response.code}  Message: ${
        response.msg
      }  Method: ${apiMethod}  Params: ${JSON.stringify(methodParams)}`,
    );
  }
};

const login = async (
  apiClient: ApiClient,
  cred: Credentials,
): Promise<void> => {
  const response = await apiClient.login(
    cred.username,
    cred.password,
    cred.sharedSecret === null ? undefined : cred.sharedSecret,
  );

  await assertApiResponse(apiClient, response, false);
};

const logout = async (apiClient: ApiClient): Promise<void> => {
  await apiClient.logout();
};

const callApi = async (
  apiClient: ApiClient,
  apiMethod: string,
  methodParams?: any,
  clientTransactionId?: string | undefined,
  language?: string | undefined,
): Promise<any> => {
  const response = await apiClient.callApi(
    apiMethod,
    methodParams,
    clientTransactionId,
    language,
  );

  await assertApiResponse(
    apiClient,
    response,
    true,
    1000,
    apiMethod,
    methodParams,
  );

  return response.resData;
};

const getRegisteredDomains = async (
  apiClient: ApiClient,
): Promise<RegisteredDomain[]> => {
  const response = await callApi(apiClient, 'domain.list', {});

  return response.domain.map(
    (o: any) =>
      ({
        domain: o.domain,
        status: o.status,
        idna: o['domain-ace'],
      } as RegisteredDomain),
  );
};

const getNameServerDomains = async (
  apiClient: ApiClient,
): Promise<string[]> => {
  const response = await callApi(apiClient, 'nameserver.list', {});

  return response.domains.map((o: any) => o.domain);
};

const logNotSubset = (
  subSet: string[],
  superSet: string[],
  msg = 'missing entries',
): void => {
  const missing = subSet.filter(entry => !superSet.includes(entry));

  if (missing.length) {
    logger.warning(`${msg}:`, missing);
  }
};

const checkRegisteredDomains = (
  registeredDomains: RegisteredDomain[],
  expectedDomains: string[],
): void => {
  const registeredDomainNames = registeredDomains.map(o => o.domain);

  logNotSubset(
    registeredDomainNames,
    expectedDomains,
    'unexpected registered domains',
  );

  logNotSubset(
    expectedDomains,
    registeredDomainNames,
    'missing registered domains',
  );

  const notOk = registeredDomains.filter(o => o.status !== 'OK');

  if (notOk.length) {
    logger.warning('not "OK" domains:', notOk);
  }
};

const checkNameserverDomains = (
  nameserverDomains: string[],
  expectedDomains: string[],
): void => {
  logNotSubset(
    nameserverDomains,
    expectedDomains,
    'unexpected nameserver domains',
  );
  logNotSubset(
    expectedDomains,
    nameserverDomains,
    'missing nameserver domains',
  );
};

const centeredHeadline = (msg: string, length = 60, fillChar = '_'): void => {
  process.stdout.write(
    msg
      .padStart(Math.floor(length / 2 + msg.length / 2), fillChar)
      .padEnd(length, fillChar) + '\n',
  );
};

const getDomainEntries = async (
  apiClient: ApiClient,
  domain: string,
  ignoreSanity = false,
): Promise<InwxRecord[]> => {
  try {
    const response = await callApi(apiClient, 'nameserver.info', { domain });

    return response.record;
  } catch (err) {
    const reApiErr = /Code: (?:2303|2002)/;
    if (ignoreSanity && reApiErr.test(err.message)) {
      return [];
    } else {
      throw err;
    }
  }
};

const groupByType = (records: InwxRecord[]): InwxRecordsByType =>
  records.reduce<InwxRecordsByType>((acc, curr) => {
    const rrType = curr.type;

    const arr = acc[rrType] ?? [];

    arr.push(curr);

    if (acc[rrType] === undefined) {
      acc[rrType] = arr;
    }

    return acc;
  }, {});

const printDiffHeader = (): void =>
  void process.stdout.write(
    `Act ${'Name'.padStart(30)} ${'Type'.padEnd(6)} ${'TTL'.padStart(
      5,
    )} ${'Prio'.padStart(4)} ${'Content'}\n`,
  );

const serializeEntry = (entry: Entry): string =>
  `${entry.name.padStart(30)} ${entry.type.padEnd(6)} ${String(
    entry.ttl,
  ).padStart(5)} ${String(entry.prio).padStart(4)} ${entry.content}`;

const removeEntries = async (
  apiClient: ApiClient,
  entries: InwxRecord[],
  doWrite = false,
): Promise<void> => {
  for (const entry of entries) {
    if (doWrite) {
      await callApi(apiClient, 'nameserver.deleteRecord', {
        id: entry.id,
      });
    }
    process.stdout.write(c.red('del ') + c.red(serializeEntry(entry)) + '\n');
  }
};

const addEntries = async (
  apiClient: ApiClient,
  entries: AddEntry[],
  doWrite = false,
): Promise<void> => {
  for (const entry of entries) {
    if (doWrite) {
      await callApi(apiClient, 'nameserver.createRecord', {
        ttl: entry.ttl,
        domain: entry.domain,
        type: entry.type,
        name: entry.name,
        content: entry.content,
        prio: entry.prio,
      });
    }
    process.stdout.write(
      c.green('add ') + c.green(serializeEntry(entry)) + '\n',
    );
  }
};

const updateEntries = async (
  apiClient: ApiClient,
  entries: UpdateEntry[],
  doWrite = false,
): Promise<void> => {
  for (const entry of entries) {
    if (doWrite) {
      await callApi(apiClient, 'nameserver.updateRecord', {
        id: entry.old.id,
        ttl: entry.new.ttl,
        type: entry.new.type,
        name: entry.new.name,
        content: entry.new.content,
        prio: entry.new.prio,
      });
    }
    process.stdout.write(
      c.blue('upd ') + c.red(serializeEntry(entry.old)) + '\n',
    );
    process.stdout.write(
      c.blue('upd ') + c.green(serializeEntry(entry.new)) + '\n',
    );
  }
};

const handleRecords = async (
  apiClient: ApiClient,
  registeredDomains: RegisteredDomain[],
  resourceRecords: ResourceRecordPerDomain,
  ignoredDomains: string[],
  doWrite = false,
  ignoreSanity = false,
): Promise<void> => {
  for (const registeredDomain of registeredDomains) {
    if (ignoredDomains.includes(registeredDomain.domain)) {
      logger.info('domain is ignored:', registeredDomain.domain);
      continue;
    }

    const wantedEntries = getWantedEntries(
      resourceRecords,
      registeredDomain.domain,
    );
    const currentEntries = groupByType(
      await getDomainEntries(apiClient, registeredDomain.domain, ignoreSanity),
    );
    const rrTypes = ([
      ...Object.keys(wantedEntries),
      ...Object.keys(currentEntries),
    ] as ResourceRecordType[]).filter(
      (curr, i, arr) => i === arr.indexOf(curr),
    );

    centeredHeadline(registeredDomain.domain);
    printDiffHeader();

    for (const rrType of rrTypes) {
      const extendedWantedEntries = (wantedEntries[rrType] || []).map(o => {
        const maybeReplaceContent = o.replaceBeforeCompareContent;
        const replaceContentFn = maybeReplaceContent
          ? (content: string): string =>
              content.replace(
                new RegExp(
                  maybeReplaceContent.searchRe,
                  maybeReplaceContent.flags,
                ),
                maybeReplaceContent.replace,
              )
          : undefined;

        return {
          domain: registeredDomain.idna,
          name: replaceDomainPlaceholder(o.name, registeredDomain.idna),
          content: replaceDomainPlaceholder(o.content, registeredDomain.idna),
          type: rrType,
          prio: o.prio === undefined ? 0 : o.prio,
          ttl: o.ttl,
          ...(replaceContentFn === undefined ? null : { replaceContentFn }),
        };
      });

      const { toAdd, toRemove, toUpdate } = getEntriesDiff(
        extendedWantedEntries,
        currentEntries[rrType] || [],
      );
      await removeEntries(apiClient, toRemove, doWrite);
      await addEntries(apiClient, toAdd, doWrite);
      await updateEntries(apiClient, toUpdate, doWrite);
    }
  }
};

const main = async (
  configPath: string,
  doWrite = false,
  ignoreSanity = false,
): Promise<void> => {
  const config = getConfig(configPath);
  logger.debug('config:', {
    ...config,
    credentials: { username: '***', password: '***', sharedSecret: '***' },
  });
  logNotSubset(
    config.ignoredDomains,
    config.knownDomains,
    'not handled ignoredDomains',
  );
  logNotSubset(
    Object.keys(config.resourceRecords).filter(x => x !== '*'),
    config.knownDomains,
    'unexpected resource record domains',
  );
  // By default you ApiClient uses the test api (OT&E). If you want to use the production/live api
  // we have a constant named API_URL_LIVE in the ApiClient class. Just set api_url=ApiClient.API_URL_LIVE and you're good.
  const apiClient = new ApiClient(ApiClient.API_URL_LIVE, Language.EN, false);
  await login(apiClient, config.credentials);

  const registeredDomains = await getRegisteredDomains(apiClient);
  logger.debug('registeredDomains:', registeredDomains);
  if (ignoreSanity) {
    config.knownDomains.forEach(kd => {
      if (registeredDomains.find(rd => rd.domain === kd) === undefined) {
        registeredDomains.push({
          domain: kd,
          status: 'OK',
          idna: toASCII(kd),
        });
      }
    });
  }
  checkRegisteredDomains(registeredDomains, config.knownDomains);
  const nameserverDomains = await getNameServerDomains(apiClient);
  logger.debug('nameserverDomains:', nameserverDomains);
  checkNameserverDomains(nameserverDomains, config.knownDomains);
  await handleRecords(
    apiClient,
    registeredDomains,
    config.resourceRecords,
    config.ignoredDomains,
    doWrite,
    ignoreSanity,
  );

  await logout(apiClient);
};

export { main };
