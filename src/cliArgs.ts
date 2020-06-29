import arg from 'arg';

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

export { args };
