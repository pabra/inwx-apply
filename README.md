# INWX apply

[![npm version](https://badge.fury.io/js/inwx-apply.svg)](https://www.npmjs.com/package/inwx-apply)
[![unit-tests](https://github.com/pabra/inwx-apply/workflows/unit-tests/badge.svg?branch=master)](https://github.com/pabra/inwx-apply/actions?query=branch%3Amaster+workflow%3Aunit-tests)
[![publish](https://github.com/pabra/inwx-apply/workflows/publish/badge.svg)](https://github.com/pabra/inwx-apply/actions?query=workflow%3Apublish)
[![codecov](https://codecov.io/gh/pabra/inwx-apply/branch/master/graph/badge.svg)](https://codecov.io/gh/pabra/inwx-apply)

Ensure DNS resource record entries from a JSON (exporting) file are applied
through INWX API.

I wanted a text based file that:

- contains/exports all my DNS resource records for all my domains
- can be version controlled with git (or any VCS)
- works with variables for repeating/similar entries
- can be applied against INWX API to ensure all these entries exists (no more, no less)

The result is this tool that takes a JSON (exporting) file as input and ensures
that exactly these entries are set at inwx name servers for you.

## Install (npm)

```bash
npm install -g inwx-apply
```

## Docker

### Build image yourself

```bash
docker build -t inwx-apply .
```

### Run self build image

```bash
docker run \
  --rm \
  -v /path/to/credentials.json:/data/credentials.json:ro \
  -v /path/to/inwxDnsEntries.js:/data/inwxDnsEntries.js:ro \
  inwx-apply
```

### Run pre-build image from docker hub

I've create a shell script for myself

```sh
#!/bin/sh

IMAGE_NAME=pabra/inwx-apply
IMAGE_TAG=latest

CREDENTIALS_FILE=/path/to/credentials.json
ENTRIES_FILE=/path/to/inwxDnsEntries.js

CREDENTIALS_FILE_BASENAME=$(basename ${CREDENTIALS_FILE})
ENTRIES_FILE_BASENAME=$(basename ${ENTRIES_FILE})

docker run \
    --rm \
    -v "${CREDENTIALS_FILE}:/data/${CREDENTIALS_FILE_BASENAME}:ro" \
    -v "${ENTRIES_FILE}:/data/${ENTRIES_FILE_BASENAME}:ro" \
    "${IMAGE_NAME}:${IMAGE_TAG}" \
    --file "${ENTRIES_FILE_BASENAME}" \
    "$@"
```

## Usage

`inwx-apply` will look in your current work directory for a file named `inwxDnsEntries.js`
and import it. It also runs by default in "dry-run" mode. This means it will
just show you what it would do.

If you do not want to check in your INWX credentials to your VCS, put them in a
JSON file that is ignored by your VCS and import it into your DNS entries file.

Create your git ignored credential file (eg: `inwx_credentials.gitignore.json`):

```json
{
  "username": "my_inwx_username",
  "password": "my_inwx_password",
  "sharedSecret": null
}
```

Create a js file that will import your credentials and export DNS entries as
JSON (eg: `inwxDnsEntries.js`)

```javascript
const credentials = require('./inwx_credentials.gitignore.json');
const ttl = 3600;
const ipV4 = {
  web: '1.2.3.4',
  web2: '4.3.2.1',
  db: '1.2.3.5',
  mail: '1.2.3.6',
};
const ipV6 = {
  web: '1:2:3::4',
  web2: '4:3:2::1',
  db: '1:2:3::5',
  mail: '1:2:3::6',
};
const nameServers = [
  'ns.inwx.de',
  'ns2.inwx.de',
  'ns3.inwx.eu',
  'ns4.inwx.com',
  'ns5.inwx.net',
];
const nameServerSet = nameServers.map(name => ({
  ttl: 86400,
  name: '*',
  content: name,
}));
const soaContent = `${nameServers[0]} hostmaster@example.com`;
const soaRecord = {
  ttl: 86400,
  name: '*',
  content: soaContent,
  replaceBeforeCompareContent: {
    searchRe: /\s+\d+$/.source,
    flags: '',
    replace: '',
  },
};
const mxRecord = { prio: 10, ttl, name: '*', content: 'mail.example.com' };

const entries = {
  credentials,
  // list of all domains handled by INWX
  knownDomains: ['example.com', 'example.net', 'exämple.org'],
  // list of domains, that entries should not be modified (subset of knownDomains)
  ignoredDomains: [],
  resourceRecords: {
    // default entries for all domains of knownDomains
    '*': {
      SOA: [soaRecord],
      NS: nameServerSet,
      MX: [mxRecord],
      CNAME: [
        { ttl, name: '*', content: 'example.com' },
        { ttl, name: 'www.*', content: 'www.example.com' },
      ],
    },
    'example.com': {
      A: [
        { ttl, name: '*', content: ipV4.web },
        { ttl, name: 'www.*', content: ipV4.web },
        { ttl, name: 'mail.*', content: ipV4.mail },
      ],
      AAAA: [
        { ttl, name: '*', content: ipV6.web },
        { ttl, name: 'www.*', content: ipV6.web },
        { ttl, name: 'mail.*', content: ipV6.mail },
      ],
      // do not apply CNAME from default "*"
      CNAME: [],
    },
    'example.net': {
      // example.net already uses the new "web2" server
      A: [
        { ttl, name: '*', content: ipV4.web2 },
        { ttl, name: 'www.*', content: ipV4.web2 },
        { ttl, name: 'db.*', content: ipV4.db },
      ],
      AAAA: [
        { ttl, name: '*', content: ipV6.web2 },
        { ttl, name: 'www.*', content: ipV6.web2 },
        { ttl, name: 'db.*', content: ipV6.db },
      ],
      CNAME: [],
    },
  },
};

module.exports = JSON.stringify(entries);
```

The exported JSON would be:

```json
{
  "credentials": {
    "username": "***",
    "password": "***",
    "sharedSecret": "***"
  },
  "knownDomains": ["example.com", "example.net", "exämple.org"],
  "ignoredDomains": [],
  "resourceRecords": {
    "*": {
      "SOA": [
        {
          "ttl": 86400,
          "name": "*",
          "content": "ns.inwx.de hostmaster@example.com",
          "replaceBeforeCompareContent": {
            "searchRe": "\\s+\\d+$",
            "flags": "",
            "replace": ""
          }
        }
      ],
      "NS": [
        { "ttl": 86400, "name": "*", "content": "ns.inwx.de" },
        { "ttl": 86400, "name": "*", "content": "ns2.inwx.de" },
        { "ttl": 86400, "name": "*", "content": "ns3.inwx.eu" },
        { "ttl": 86400, "name": "*", "content": "ns4.inwx.com" },
        { "ttl": 86400, "name": "*", "content": "ns5.inwx.net" }
      ],
      "MX": [
        { "prio": 10, "ttl": 3600, "name": "*", "content": "mail.example.com" }
      ],
      "CNAME": [
        { "ttl": 3600, "name": "*", "content": "example.com" },
        { "ttl": 3600, "name": "www.*", "content": "www.example.com" }
      ]
    },
    "example.com": {
      "A": [
        { "ttl": 3600, "name": "*", "content": "1.2.3.4" },
        { "ttl": 3600, "name": "www.*", "content": "1.2.3.4" },
        { "ttl": 3600, "name": "mail.*", "content": "1.2.3.6" }
      ],
      "AAAA": [
        { "ttl": 3600, "name": "*", "content": "1:2:3::4" },
        { "ttl": 3600, "name": "www.*", "content": "1:2:3::4" },
        { "ttl": 3600, "name": "mail.*", "content": "1:2:3::6" }
      ],
      "CNAME": []
    },
    "example.net": {
      "A": [
        { "ttl": 3600, "name": "*", "content": "4.3.2.1" },
        { "ttl": 3600, "name": "www.*", "content": "4.3.2.1" },
        { "ttl": 3600, "name": "db.*", "content": "1.2.3.5" }
      ],
      "AAAA": [
        { "ttl": 3600, "name": "*", "content": "4:3:2::1" },
        { "ttl": 3600, "name": "www.*", "content": "4:3:2::1" },
        { "ttl": 3600, "name": "db.*", "content": "1:2:3::5" }
      ],
      "CNAME": []
    }
  }
}
```

From that JSON `inwx-apply` will ensure, these entries will be present:

```txt
________________________example.com_________________________
Act                           Name Type     TTL Prio Content
add                    example.com SOA    86400    0 ns.inwx.de hostmaster@example.com
add                    example.com NS     86400    0 ns.inwx.de
add                    example.com NS     86400    0 ns2.inwx.de
add                    example.com NS     86400    0 ns3.inwx.eu
add                    example.com NS     86400    0 ns4.inwx.com
add                    example.com NS     86400    0 ns5.inwx.net
add                    example.com MX      3600   10 mail.example.com
add                    example.com A       3600    0 1.2.3.4
add               mail.example.com A       3600    0 1.2.3.6
add                www.example.com A       3600    0 1.2.3.4
add                    example.com AAAA    3600    0 1:2:3::4
add               mail.example.com AAAA    3600    0 1:2:3::6
add                www.example.com AAAA    3600    0 1:2:3::4
________________________example.net_________________________
Act                           Name Type     TTL Prio Content
add                    example.net SOA    86400    0 ns.inwx.de hostmaster@example.com
add                    example.net NS     86400    0 ns.inwx.de
add                    example.net NS     86400    0 ns2.inwx.de
add                    example.net NS     86400    0 ns3.inwx.eu
add                    example.net NS     86400    0 ns4.inwx.com
add                    example.net NS     86400    0 ns5.inwx.net
add                    example.net MX      3600   10 mail.example.com
add                 db.example.net A       3600    0 1.2.3.5
add                    example.net A       3600    0 4.3.2.1
add                www.example.net A       3600    0 4.3.2.1
add                 db.example.net AAAA    3600    0 1:2:3::5
add                    example.net AAAA    3600    0 4:3:2::1
add                www.example.net AAAA    3600    0 4:3:2::1
________________________exämple.org_________________________
Act                           Name Type     TTL Prio Content
add             xn--exmple-cua.org SOA    86400    0 ns.inwx.de hostmaster@example.com
add             xn--exmple-cua.org NS     86400    0 ns.inwx.de
add             xn--exmple-cua.org NS     86400    0 ns2.inwx.de
add             xn--exmple-cua.org NS     86400    0 ns3.inwx.eu
add             xn--exmple-cua.org NS     86400    0 ns4.inwx.com
add             xn--exmple-cua.org NS     86400    0 ns5.inwx.net
add             xn--exmple-cua.org MX      3600   10 mail.example.com
add         www.xn--exmple-cua.org CNAME   3600    0 www.example.com
add             xn--exmple-cua.org CNAME   3600    0 example.com
```
