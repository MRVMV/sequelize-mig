#!/usr/bin/env node

import yargs from 'yargs';
import make from './migration/make.js';

yargs
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
        .positional('pwd-path', {
          describe: 'Override PWD (or just navigate to specified folder in it) (default to ./)',
          type: 'string',
          alias: 'pwdp',
        })
        .positional('sequelizerc-path', {
          describe: 'The path to the .sequelizerc file (default to ./.sequelizerc)',
          type: 'string',
          alias: 'seqrcp',
        })
        .positional('migrations-path', {
          describe: 'The path to the migrations folder (default to ./migrations)',
          type: 'string',
          alias: 'migp',
        })
        .positional('models-path', {
          describe: 'The path to the models folder (default to ./models)',
          type: 'string',
          alias: 'modp',
        })
        .positional('schemas-path', {
          describe: 'The path to the schemas folder (default to migrations-path)',
          type: 'string',
          alias: 'schmp',
        })
        .positional('index-file-path', {
          describe: 'The path to the index file (default to models-path/index.js)',
          type: 'string',
          alias: 'indxp',
        })
        .example('sequelize-mig migration:make --name InitDb -p').argv,
    (argv) => make(argv),
  )
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
