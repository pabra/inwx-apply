import { getEntriesDiff } from '../src/utils';

// prettier-ignore
const testEntries1 = [
  { id: 1, domain: 'example.com', type: 'A', name: 'a.example.com', content: '1.2.3.4', prio: 0, ttl: 3600, } as const,
  { id: 2, domain: 'example.com', type: 'A', name: 'b.example.com', content: '1.2.3.4', prio: 0, ttl: 3600, } as const,
];

// prettier-ignore
const cases = [
  {
    it: 'should add one additional entry',
    existing: [
      ...testEntries1,
    ],
    wanted: [
      { domain: 'example.com', type: 'A', name: 'a.example.com', content: '1.2.3.4', prio: 0, ttl: 3600, } as const,
      { domain: 'example.com', type: 'A', name: 'b.example.com', content: '1.2.3.4', prio: 0, ttl: 3600, } as const,
      { domain: 'example.com', type: 'A', name: 'c.example.com', content: '4.3.2.1', prio: 0, ttl: 3600, } as const,
    ],
    expected: {
      toAdd: [
        { type: 'A', domain: 'example.com', name: 'c.example.com', content: '4.3.2.1', prio: 0, ttl: 3600, },
      ],
      toRemove: [
      ],
      toUpdate: [
      ],
    },
  },
  {
    it: 'should not change anything',
    existing: [
      ...testEntries1,
    ],
    wanted: [
      { domain: 'example.com', type: 'A', name: 'a.example.com', content: '1.2.3.4', prio: 0, ttl: 3600, } as const,
      { domain: 'example.com', type: 'A', name: 'b.example.com', content: '1.2.3.4', prio: 0, ttl: 3600, } as const,
    ],
    expected: {
      toAdd: [
      ],
      toRemove: [
      ],
      toUpdate: [
      ],
    },
  },
  {
    it: 'should remove all entries',
    existing: [
      ...testEntries1,
    ],
    wanted: [
    ],
    expected: {
      toAdd: [
      ],
      toRemove: [
        { domain: 'example.com', id: 1, type: 'A', name: 'a.example.com', content: '1.2.3.4', prio: 0, ttl: 3600, } as const,
        { domain: 'example.com', id: 2, type: 'A', name: 'b.example.com', content: '1.2.3.4', prio: 0, ttl: 3600, } as const,
      ],
      toUpdate: [
      ],
    },
  },
  {
    it: 'should update first entry',
    existing: [
      ...testEntries1,
    ],
    wanted: [
      { domain: 'example.com', type: 'A', name: 'c.example.com', content: '1.2.3.5', prio: 0, ttl: 3600, } as const,
      { domain: 'example.com', type: 'A', name: 'b.example.com', content: '1.2.3.4', prio: 0, ttl: 3600, } as const,
    ],
    expected: {
      toAdd: [
      ],
      toRemove: [
      ],
      toUpdate: [
        {
          old:{ id: 1, domain: 'example.com', type: 'A', name: 'a.example.com', content: '1.2.3.4', prio: 0, ttl: 3600, } as const,
          new:{        domain: 'example.com', type: 'A', name: 'c.example.com', content: '1.2.3.5', prio: 0, ttl: 3600, } as const,
        },
      ],
    },
  },
  {
    it: 'should update second entry',
    existing: [
      ...testEntries1,
    ],
    wanted: [
      { domain: 'example.com', type: 'A', name: 'c.example.com', content: '1.2.3.5', prio: 0, ttl: 3600, } as const,
      { domain: 'example.com', type: 'A', name: 'a.example.com', content: '1.2.3.4', prio: 0, ttl: 3600, } as const,
    ],
    expected: {
      toAdd: [
      ],
      toRemove: [
      ],
      toUpdate: [
        {
          old:{ id: 2, domain: 'example.com', type: 'A', name: 'b.example.com', content: '1.2.3.4', prio: 0, ttl: 3600, } as const,
          new:{        domain: 'example.com', type: 'A', name: 'c.example.com', content: '1.2.3.5', prio: 0, ttl: 3600, } as const,
        },
      ],
    },
  },
  {
    it: 'should add all entries',
    existing: [
    ],
    wanted: [
      { domain: 'example.com', type: 'A', name: 'a.example.com', content: '1.2.3.4', prio: 0, ttl: 3600, } as const,
      { domain: 'example.com', type: 'A', name: 'b.example.com', content: '1.2.3.4', prio: 0, ttl: 3600, } as const,
    ],
    expected: {
      toAdd: [
        { type: 'A', domain: 'example.com', name: 'a.example.com', content: '1.2.3.4', prio: 0, ttl: 3600, } as const,
        { type: 'A', domain: 'example.com', name: 'b.example.com', content: '1.2.3.4', prio: 0, ttl: 3600, } as const,
      ],
      toRemove: [
      ],
      toUpdate: [
      ],
    },
  },
  {
    it: 'should re-use all entries',
    existing: [
      ...testEntries1,
    ],
    wanted: [
      { domain: 'example.com', type: 'A', name: 'a.example.com', content: '1.2.3.5', prio: 0, ttl: 3600, } as const,
      { domain: 'example.com', type: 'A', name: 'b.example.com', content: '1.2.3.5', prio: 0, ttl: 3600, } as const,
      { domain: 'example.com', type: 'A', name: 'c.example.com', content: '1.2.3.5', prio: 0, ttl: 3600, } as const,
    ],
    expected: {
      toAdd: [
        { type: 'A', domain: 'example.com', name: 'c.example.com', content: '1.2.3.5', prio: 0, ttl: 3600, } as const,
      ],
      toRemove: [
      ],
      toUpdate: [
        {
          old:{ id: 1, domain: 'example.com', type: 'A', name: 'a.example.com', content: '1.2.3.4', prio: 0, ttl: 3600, } as const,
          new:{        domain: 'example.com', type: 'A', name: 'a.example.com', content: '1.2.3.5', prio: 0, ttl: 3600, } as const,
        },
        {
          old:{ id: 2, domain: 'example.com', type: 'A', name: 'b.example.com', content: '1.2.3.4', prio: 0, ttl: 3600, } as const,
          new:{        domain: 'example.com', type: 'A', name: 'b.example.com', content: '1.2.3.5', prio: 0, ttl: 3600, } as const,
        },
      ],
    },
  },
  {
    it: 'should update and remove',
    existing: [
      ...testEntries1,
    ],
    wanted: [
      { domain: 'example.com', type: 'A', name: 'c.example.com', content: '1.2.3.5', prio: 0, ttl: 3600, } as const,
    ],
    expected: {
      toAdd: [
      ],
      toRemove: [
        { id: 2, domain: 'example.com', type: 'A', name: 'b.example.com', content: '1.2.3.4', prio: 0, ttl: 3600, } as const,
      ],
      toUpdate: [
        {
          old:{ id: 1, domain: 'example.com', type: 'A', name: 'a.example.com', content: '1.2.3.4', prio: 0, ttl: 3600, } as const,
          new:{        domain: 'example.com', type: 'A', name: 'c.example.com', content: '1.2.3.5', prio: 0, ttl: 3600, } as const,
        },
      ],
    },
  },
  {
    it: 'should update prio',
    existing: [
      ...testEntries1,
    ],
    wanted: [
      { domain: 'example.com', type: 'A', name: 'a.example.com', content: '1.2.3.4', prio: 10, ttl: 3600, } as const,
      { domain: 'example.com', type: 'A', name: 'b.example.com', content: '1.2.3.4', prio: 20, ttl: 3600, } as const,
    ],
    expected: {
      toAdd: [
      ],
      toRemove: [
      ],
      toUpdate: [
        {
          old:{ id: 1, domain: 'example.com', type: 'A', name: 'a.example.com', content: '1.2.3.4', prio:  0, ttl: 3600, } as const,
          new:{        domain: 'example.com', type: 'A', name: 'a.example.com', content: '1.2.3.4', prio: 10, ttl: 3600, } as const,
        },
        {
          old:{ id: 2, domain: 'example.com', type: 'A', name: 'b.example.com', content: '1.2.3.4', prio:  0, ttl: 3600, } as const,
          new:{        domain: 'example.com', type: 'A', name: 'b.example.com', content: '1.2.3.4', prio: 20, ttl: 3600, } as const,
        },
      ],
    },
  },
  {
    it: 'should update ttl',
    existing: [
      ...testEntries1,
    ],
    wanted: [
      { domain: 'example.com', type: 'A', name: 'a.example.com', content: '1.2.3.4', prio: 0, ttl: 300, } as const,
      { domain: 'example.com', type: 'A', name: 'b.example.com', content: '1.2.3.4', prio: 0, ttl: 3600, } as const,
    ],
    expected: {
      toAdd: [
      ],
      toRemove: [
      ],
      toUpdate: [
        {
          old:{ id: 1, domain: 'example.com', type: 'A', name: 'a.example.com', content: '1.2.3.4', prio: 0, ttl: 3600, } as const,
          new:{        domain: 'example.com', type: 'A', name: 'a.example.com', content: '1.2.3.4', prio: 0, ttl:  300, } as const,
        },
      ],
    },
  },
];

describe('map entries', () => {
  cases.forEach(testCase => {
    // eslint-disable-next-line jest/valid-title
    test(testCase.it, () =>
      expect(getEntriesDiff(testCase.wanted, testCase.existing)).toEqual(
        testCase.expected,
      ),
    );
  });
});
