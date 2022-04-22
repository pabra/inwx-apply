import * as sr from 'simple-runtypes';

const credentialsRt = sr.record({
  username: sr.string(),
  password: sr.string(),
  sharedSecret: sr.union(sr.string(), sr.null()),
});

const resourceRecordRt = sr.record({
  ttl: sr.number(),
  name: sr.string(),
  content: sr.string(),
  prio: sr.optional(sr.number()),
  replaceBeforeCompareContent: sr.optional(
    sr.record({
      searchRe: sr.string(),
      flags: sr.string(),
      replace: sr.string(),
    }),
  ),
});

const resourceRecordsByTypeRt = sr.partial(
  sr.record({
    A: sr.array(resourceRecordRt),
    AAAA: sr.array(resourceRecordRt),
    AFSDB: sr.array(resourceRecordRt),
    ALIAS: sr.array(resourceRecordRt),
    CAA: sr.array(resourceRecordRt),
    CERT: sr.array(resourceRecordRt),
    CNAME: sr.array(resourceRecordRt),
    HINFO: sr.array(resourceRecordRt),
    HTTPS: sr.array(resourceRecordRt),
    IPSECKEY: sr.array(resourceRecordRt),
    LOC: sr.array(resourceRecordRt),
    MX: sr.array(resourceRecordRt),
    NAPTR: sr.array(resourceRecordRt),
    NS: sr.array(resourceRecordRt),
    PTR: sr.array(resourceRecordRt),
    RP: sr.array(resourceRecordRt),
    SOA: sr.array(resourceRecordRt),
    SRV: sr.array(resourceRecordRt),
    SSHFP: sr.array(resourceRecordRt),
    SVCB: sr.array(resourceRecordRt),
    TLSA: sr.array(resourceRecordRt),
    TXT: sr.array(resourceRecordRt),
    URL: sr.array(resourceRecordRt),
    URI: sr.array(resourceRecordRt),
  }),
);

const resourceRecordsPerDomainRt = sr.dictionary(
  sr.string(), // that's the domain name
  resourceRecordsByTypeRt,
);

const config = sr.record({
  credentials: credentialsRt,
  knownDomains: sr.array(sr.string()),
  ignoredDomains: sr.array(sr.string()),
  resourceRecords: resourceRecordsPerDomainRt,
});

type ResourceRecordPerDomain = ReturnType<typeof resourceRecordsPerDomainRt>;
type ResourceRecordByType = ReturnType<typeof resourceRecordsByTypeRt>;
// type ResourceRecord = ReturnType<typeof resourceRecordRt>;
type Credentials = ReturnType<typeof credentialsRt>;
type Config = ReturnType<typeof config>;
type ResourceRecordType = keyof ResourceRecordByType;
interface RegisteredDomain {
  domain: string;
  status: string;
  idna: string;
}
interface InwxRecord {
  id: number;
  name: string;
  type: ResourceRecordType;
  content: string;
  ttl: number;
  prio: number;
}
type InwxRecordsByType = Partial<Record<ResourceRecordType, InwxRecord[]>>;
type Entry = Omit<InwxRecord, 'id'> & {
  replaceContentFn?: (content: string) => string;
};
type EntriesByType = Partial<Record<ResourceRecordType, Entry[]>>;
type UpdateEntry = { old: InwxRecord; new: Entry };
type AddEntry = Entry & { domain: string };

export type {
  AddEntry,
  Credentials,
  Config,
  EntriesByType,
  Entry,
  InwxRecord,
  InwxRecordsByType,
  RegisteredDomain,
  ResourceRecordByType,
  ResourceRecordPerDomain,
  ResourceRecordType,
  UpdateEntry,
};
export { config };
