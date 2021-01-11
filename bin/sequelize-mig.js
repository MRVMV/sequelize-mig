#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import make from './migration/make.js';
import sync from './migration/sync.js';
import undo from './migration/undo.js';

yargs(hideBin(process.argv))
  .scriptName('sequelize-mig')
  .usage('Usage: $0 <command> [options]')
  .command(
    ['migration:make', 'migration:add'],
    'Make a new migration file by your own updates to models',
    (yargsA) =>
      yargsA
        .positional('name', {
          alias: 'n',
          type: 'string',
          describe: 'Set migration name (default: "noname")',
        })
        .positional('preview', {
          alias: 'p',
          type: 'boolean',
          describe: 'Preview migration actions without writing migration file',
        })
        .positional('es6', {
          alias: 'cjs',
          type: 'boolean',
          describe: 'Force .cjs file extension',
        })
        .positional('comment', {
          alias: 'c',
          type: 'string',
          describe: 'Set migration comment',
        })
        .example('sequelize-mig migration:make -n InitDb -p').argv,
    (argv) => make(argv),
  )
  .command(
    ['migration:sync'],
    'Sync state file to current schema (without making migration files)',
    (yargsA) =>
      yargsA
        .positional('preview', {
          alias: 'p',
          type: 'boolean',
          describe: 'Preview sync actions without updating state',
        })
        .example('sequelize-mig migration:sync -p').argv,
    (argv) => sync(argv),
  )
  .command(
    ['migration:undo', 'migration:revert'],
    'Undo the last migration:make (it will only delete migration file and revert state updates',
    (yargsA) =>
      yargsA
        .positional('force', {
          alias: 'f',
          type: 'boolean',
          describe: 'force undo even if revisions not equal',
        })
        .positional('delete-current-state', {
          alias: 'del-cur-stt',
          type: 'boolean',
          default: true,
          describe: 'delete current state (default: true)',
        })
        .positional('delete-current-migration', {
          alias: 'del-cur-mig',
          type: 'boolean',
          default: true,
          describe: 'delete current migration (default: true)',
        })
        .positional('rename-backup-state', {
          alias: 'ren-bak-stt',
          type: 'boolean',
          default: true,
          describe: 'rename backup state (default: true)',
        })
        .example('sequelize-mig migration:undo').argv,
    (argv) => undo(argv),
  )
  .option('pwd-path', {
    alias: 'pwdp',
    type: 'string',
    describe: 'Override PWD (or just navigate to specified folder in it) (default to ./)',
  })
  .option('ignore-sequelizerc', {
    alias: 'ignrc',
    type: 'boolean',
    describe: 'force pwd even on sequelizerc (default to false)',
  })
  .option('sequelizerc-path', {
    alias: 'seqrcp',
    type: 'string',
    describe: 'The path to the .sequelizerc file (default to ./.sequelizerc)',
  })
  .option('migrations-path', {
    alias: 'migp',
    type: 'string',
    describe: 'The path to the migrations folder (default to ./migrations)',
  })
  .option('models-path', {
    alias: 'modp',
    type: 'string',
    describe: 'The path to the models folder (default to ./models)',
  })
  .option('state-path', {
    alias: 'statp',
    type: 'string',
    describe: 'The path to the state folder where schema is saved (default to migrations-path)',
  })
  .option('index-file-path', {
    alias: 'indxp',
    type: 'string',
    describe: 'The path to the index file (default to models-path/index.js)',
  })
  .option('log-level', {
    alias: 'll',
    type: 'number',
    default: 3,
    describe: 'The less, The more you see, default: 3...',
  })
  .alias('help', 'h')
  .alias('version', 'v')
  .demandCommand(1, 'Please specify a command')
  .recommendCommands()
  .parse();

// TODO:

// .command('init', 'Initializes project')
// .command('init:config', 'Initializes configuration')
// .command('init:migrations', 'Initializes migrations')
// .command('init:models', 'Initializes models')
// .command('init:seeders', 'Initializes seeders')

// .command(
//   ['model:generate', 'model:create'],
//   'Generates a model and its migration'
// )
