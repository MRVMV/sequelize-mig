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
          describe: 'Set migration name (default: "noname")',
          type: 'string',
          alias: 'n',
        })
        .positional('preview', {
          describe: 'Preview migration actions without writing migration file',
          type: 'boolean',
          alias: 'p',
        })
        .positional('es6', {
          describe: 'Force .cjs file extension',
          type: 'boolean',
          alias: 'cjs',
        })
        .positional('comment', {
          describe: 'Set migration comment',
          type: 'string',
          alias: 'c',
        })
        .example('sequelize-mig migration:make -n InitDb -p').argv,
    (argv) => make(argv),
  )
  .command(
    ['migration:sync'],
    'Sync migrations',
    (yargsA) =>
      yargsA
        .positional('preview', {
          describe: 'Preview migration actions without writing migration file',
          type: 'boolean',
          alias: 'p',
        })
        .positional('es6', {
          describe: 'Force .cjs file extension',
          type: 'boolean',
          alias: 'cjs',
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
          describe: 'force undo even if revisions not equal',
          type: 'boolean',
          alias: 'f',
        })
        .positional('delete-current-state', {
          describe: 'delete current state (default: true)',
          type: 'boolean',
          alias: 'del-cur-stt',
          default: true,
        })
        .positional('delete-current-migration', {
          describe: 'delete current migration (default: true)',
          type: 'boolean',
          alias: 'del-cur-mig',
          default: true,
        })
        .positional('rename-backup-state', {
          describe: 'rename backup state (default: true)',
          type: 'boolean',
          alias: 'ren-bak-stt',
          default: true,
        })
        .example('sequelize-mig migration:undo').argv,
    (argv) => undo(argv),
  )
  .option('pwd-path', {
    describe: 'Override PWD (or just navigate to specified folder in it) (default to ./)',
    type: 'string',
    alias: 'pwdp',
  })
  .option('ignore-sequelizerc', {
    describe: 'force pwd even on sequelizerc (default to false)',
    type: 'boolean',
    alias: 'ignrc',
  })
  .option('sequelizerc-path', {
    describe: 'The path to the .sequelizerc file (default to ./.sequelizerc)',
    type: 'string',
    alias: 'seqrcp',
  })
  .option('migrations-path', {
    describe: 'The path to the migrations folder (default to ./migrations)',
    type: 'string',
    alias: 'migp',
  })
  .option('models-path', {
    describe: 'The path to the models folder (default to ./models)',
    type: 'string',
    alias: 'modp',
  })
  .option('state-path', {
    describe: 'The path to the state folder where schema is saved (default to migrations-path)',
    type: 'string',
    alias: 'statp',
  })
  .option('index-file-path', {
    describe: 'The path to the index file (default to models-path/index.js)',
    type: 'string',
    alias: 'indxp',
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
