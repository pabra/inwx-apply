# INWX apply

Ensure DNS resource record entries from a JSON (exporting) file are applied
through INWX API.

I wanted a text based file that:

- contains/exports all my DNS resource records for all my domains
- can be version controlled with git (or any VCS)
- works with variables for repeating/similar entries
- can be applied against INWX API to ensure all these entries exists (no more, no less)

The result is this tool that takes a JSON (exporting) file as input and ensures
that exactly these entries are set at inwx name servers for you.

## Install

```bash
npm install -g inwx-apply
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

Create a js file that will import your credentials and export DSN entries as
JSON (eg: `inwxDnsEntries.js`)

```javascript
const credentials = require('./inwx_credentials.gitignore.json');
const ttl = 3600;
const ipV4 = {
  web: '1.2.3.4',
  web2: '1.22.3.4',
  db: '1.2.3.5',
  mail: '1.2.3.6',
};
const ipV6 = {
  web: '1:2:3::4',
  web2: '1:22:3::4',
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
  knownDomains: ['example.com', 'example.net', 'example.org'],
  // list of domains, that entries should not be modified (subset of knownDomains)
  ignoredDomains: [],
  resourceRecords: {
    // default entries for all domains of knownDomains
    '*': {
      SOA: [soaRecord],
      NS: nameServerSet,
      MX: [mxRecord],
      CNAME: [{ ttl, name: 'mail.*', content: 'mail.example.com' }],
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
      CNAME: [], // do not apply CNAME from default "*"
    },
    'example.net': {
      A: [
        { ttl, name: '*', content: ipV4.web2 },
        { ttl, name: 'www.*', content: ipV4.web2 },
        { ttl, name: 'db.*', content: ipV4.web2 },
      ],
      AAAA: [
        { ttl, name: '*', content: ipV6.web2 },
        { ttl, name: 'www.*', content: ipV6.web2 },
        { ttl, name: 'db.*', content: ipV6.web2 },
      ],
    },
  },
};

module.exports = JSON.stringify(entries);
```

The exported JSON would be:

```json
{
  "credentials": {
    "username": "my_inwx_username",
    "password": "my_inwx_password",
    "sharedSecret": null
  },
  "knownDomains": ["example.com", "example.net", "example.org"],
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
        { "ttl": 3600, "name": "mail.*", "content": "mail.example.com" }
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
        { "ttl": 3600, "name": "*", "content": "1.22.3.4" },
        { "ttl": 3600, "name": "www.*", "content": "1.22.3.4" },
        { "ttl": 3600, "name": "db.*", "content": "1.22.3.4" }
      ],
      "AAAA": [
        { "ttl": 3600, "name": "*", "content": "1:22:3::4" },
        { "ttl": 3600, "name": "www.*", "content": "1:22:3::4" },
        { "ttl": 3600, "name": "db.*", "content": "1:22:3::4" }
      ]
    }
  }
}
```

From that JSON `inwx-apply` will ensure, these entries will be present:

```json
[
  { "ttl": 86400, "type": "SOA",   "name":      "example.com",  "content": "ns.inwx.de hostmaster@example.com", "prio": 0 },
  { "ttl": 86400, "type": "NS",    "name":      "example.com",  "content": "ns.inwx.de",        "prio": 0 },
  { "ttl": 86400, "type": "NS",    "name":      "example.com",  "content": "ns2.inwx.de",       "prio": 0 },
  { "ttl": 86400, "type": "NS",    "name":      "example.com",  "content": "ns3.inwx.eu",       "prio": 0 },
  { "ttl": 86400, "type": "NS",    "name":      "example.com",  "content": "ns4.inwx.com",      "prio": 0 },
  { "ttl": 86400, "type": "NS",    "name":      "example.com",  "content": "ns5.inwx.net",      "prio": 0 },
  { "ttl":  3600, "type": "MX",    "name":      "example.com",  "content": "mail.example.com",  "prio": 10 },
  { "ttl":  3600, "type": "A",     "name":      "example.com",  "content": "1.2.3.4",           "prio": 0 },
  { "ttl":  3600, "type": "A",     "name": "mail.example.com",  "content": "1.2.3.6",           "prio": 0 },
  { "ttl":  3600, "type": "A",     "name":  "www.example.com",  "content": "1.2.3.4",           "prio": 0 },
  { "ttl":  3600, "type": "AAAA",  "name":      "example.com",  "content": "1:2:3::4",          "prio": 0 },
  { "ttl":  3600, "type": "AAAA",  "name": "mail.example.com",  "content": "1:2:3::6",          "prio": 0 },
  { "ttl":  3600, "type": "AAAA",  "name":  "www.example.com",  "content": "1:2:3::4",          "prio": 0 },
  { "ttl": 86400, "type": "SOA",   "name":      "example.net",  "content": "ns.inwx.de hostmaster@example.com", "prio": 0 },
  { "ttl": 86400, "type": "NS",    "name":      "example.net",  "content": "ns.inwx.de",        "prio": 0 },
  { "ttl": 86400, "type": "NS",    "name":      "example.net",  "content": "ns2.inwx.de",       "prio": 0 },
  { "ttl": 86400, "type": "NS",    "name":      "example.net",  "content": "ns3.inwx.eu",       "prio": 0 },
  { "ttl": 86400, "type": "NS",    "name":      "example.net",  "content": "ns4.inwx.com",      "prio": 0 },
  { "ttl": 86400, "type": "NS",    "name":      "example.net",  "content": "ns5.inwx.net",      "prio": 0 },
  { "ttl":  3600, "type": "MX",    "name":      "example.net",  "content": "mail.example.com",  "prio": 10 },
  { "ttl":  3600, "type": "CNAME", "name": "mail.example.net",  "content": "mail.example.com",  "prio": 0 },
  { "ttl":  3600, "type": "A",     "name":   "db.example.net",  "content": "1.22.3.4",          "prio": 0 },
  { "ttl":  3600, "type": "A",     "name":      "example.net",  "content": "1.22.3.4",          "prio": 0 },
  { "ttl":  3600, "type": "A",     "name":  "www.example.net",  "content": "1.22.3.4",          "prio": 0 },
  { "ttl":  3600, "type": "AAAA",  "name":   "db.example.net",  "content": "1:22:3::4",         "prio": 0 },
  { "ttl":  3600, "type": "AAAA",  "name":      "example.net",  "content": "1:22:3::4",         "prio": 0 },
  { "ttl":  3600, "type": "AAAA",  "name":  "www.example.net",  "content": "1:22:3::4",         "prio": 0 },
  { "ttl": 86400, "type": "SOA",   "name":      "example.org",  "content": "ns.inwx.de hostmaster@example.com", "prio": 0 },
  { "ttl": 86400, "type": "NS",    "name":      "example.org",  "content": "ns.inwx.de",        "prio": 0 },
  { "ttl": 86400, "type": "NS",    "name":      "example.org",  "content": "ns2.inwx.de",       "prio": 0 },
  { "ttl": 86400, "type": "NS",    "name":      "example.org",  "content": "ns3.inwx.eu",       "prio": 0 },
  { "ttl": 86400, "type": "NS",    "name":      "example.org",  "content": "ns4.inwx.com",      "prio": 0 },
  { "ttl": 86400, "type": "NS",    "name":      "example.org",  "content": "ns5.inwx.net",      "prio": 0 },
  { "ttl":  3600, "type": "MX",    "name":      "example.org",  "content": "mail.example.com",  "prio": 10 },
  { "ttl":  3600, "type": "CNAME", "name": "mail.example.org",  "content": "mail.example.com",  "prio": 0 }
]
```
