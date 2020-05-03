import {
  Array,
  Dictionary,
  Null,
  Number,
  Partial as RtPartial,
  Record as RtRecord,
  Static,
  String,
  Union,
} from 'runtypes';

const credentials = RtRecord({
  username: String,
  password: String,
  sharedSecret: Union(String, Null),
});

const resourceRecord = RtRecord({
  ttl: Number,
  name: String,
  content: String,
}).And(
  RtPartial({
    prio: Number,
    replaceBeforeCompareContent: RtRecord({
      searchRe: String,
      flags: String,
      replace: String,
    }),
  }),
);

const resourceRecordsByType = RtPartial({
  A: Array(resourceRecord),
  AAAA: Array(resourceRecord),
  AFSDB: Array(resourceRecord),
  CAA: Array(resourceRecord),
  CERT: Array(resourceRecord),
  CNAME: Array(resourceRecord),
  HINFO: Array(resourceRecord),
  KEY: Array(resourceRecord),
  LOC: Array(resourceRecord),
  MX: Array(resourceRecord),
  NAPTR: Array(resourceRecord),
  NS: Array(resourceRecord),
  PTR: Array(resourceRecord),
  RP: Array(resourceRecord),
  SOA: Array(resourceRecord),
  SRV: Array(resourceRecord),
  SSHFP: Array(resourceRecord),
  TLSA: Array(resourceRecord),
  TXT: Array(resourceRecord),
  URL: Array(resourceRecord),
});

const resourceRecordsPerDomain = Dictionary(
  resourceRecordsByType,
  'string', // that's the domain name
);

const config = RtRecord({
  credentials: credentials,
  knownDomains: Array(String),
  ignoredDomains: Array(String),
  resourceRecords: resourceRecordsPerDomain,
});

type ResourceRecordPerDomain = Static<typeof resourceRecordsPerDomain>;
type ResourceRecordByType = Static<typeof resourceRecordsByType>;
// type ResourceRecord = Static<typeof resourceRecord>;
type Credentials = Static<typeof credentials>;
type Config = Static<typeof config>;
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

export type {
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
