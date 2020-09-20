import { getWantedEntries } from '../src/utils';

// _prettier-ignore
const testEntries1 = {
  'example.com': {
    A: [{ ttl: 300, name: 'www.*', content: '1.2.3.4' }],
  },
  'example.net': {
    A: [{ ttl: 300, name: 'www.*', content: '1.2.3.4' }],
    MX: [{ ttl: 86400, name: 'mail.*', content: '6.7.8.9', prio: 10 }],
  },
  'example.org': {
    A: [{ ttl: 3600, name: '*', content: '11.22.33.44' }],
    AAAA: [{ ttl: 3600, name: '*', content: '11:22:33::44' }],
    MX: [],
  },
  '*': { MX: [{ ttl: 3600, name: 'mail.*', content: '4.3.2.1' }] },
};

const cases = [
  {
    it: 'should extend default',
    entries: { ...testEntries1 },
    domain: 'example.com',
    expected: {
      A: [{ ttl: 300, name: 'www.*', content: '1.2.3.4' }],
      MX: [{ ttl: 3600, name: 'mail.*', content: '4.3.2.1' }],
    },
  },
  {
    it: 'should only use default',
    entries: { ...testEntries1 },
    domain: 'other-domain.com',
    expected: {
      MX: [{ ttl: 3600, name: 'mail.*', content: '4.3.2.1' }],
    },
  },
  {
    it: 'should overwrite default',
    entries: { ...testEntries1 },
    domain: 'example.net',
    expected: {
      A: [{ ttl: 300, name: 'www.*', content: '1.2.3.4' }],
      MX: [{ ttl: 86400, name: 'mail.*', content: '6.7.8.9', prio: 10 }],
    },
  },
  {
    it: 'should empty default',
    entries: { ...testEntries1 },
    domain: 'example.org',
    expected: {
      A: [{ ttl: 3600, name: '*', content: '11.22.33.44' }],
      AAAA: [{ ttl: 3600, name: '*', content: '11:22:33::44' }],
      MX: [],
    },
  },
];

describe('get wanted entries', () => {
  cases.forEach(testCase => {
    // eslint-disable-next-line jest/valid-title
    test(testCase.it, () =>
      expect(getWantedEntries(testCase.entries, testCase.domain)).toEqual(
        testCase.expected,
      ),
    );
  });
});
