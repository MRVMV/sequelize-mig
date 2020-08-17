import yargs from 'yargs';
import make from './migration/make.js';

const argv = yargs
  .usage('Usage: sequelize-mig <command> [options]')
  .command(
    ['migration:make', 'migration:add'],
    'Make a new migration file by your own updates to models',
    (yargs) => {
      yargs
        .positional('name', {
          describe: 'Set migration name (default: "noname")',
          type: 'string',
          demandOption: true,
          alias: 'n',
        })
        .positional('timestamp', {
          describe: 'Add timestamp to migration name (default: true)',
          type: 'boolean',
          alias: 't',
        })
        .positional('es6', {
          describe: 'Force .cjs file extension',
          type: 'boolean',
        })
        .positional('comment', {
          describe: 'Set migration comment',
          type: 'string',
          alias: 'c',
        })
        .positional('models-path', {
          describe: 'The path to the models folder',
          type: 'string',
          alias: 'modp',
        })
        .positional('migrations-path', {
          describe: 'The path to the migrations folder',
          type: 'string',
          alias: 'migp',
        })
        .example('sequelize-mig migration:make --name InitDb').argv;
    },
    (argv) => make.make(argv)
  )
  .help('h')
  .alias('h', 'help')
  .version('v')
  .alias('v', 'version')
  .demandCommand(1, 'Please specify a command')
  .recommendCommands().argv;

// _index.view.teaser();

// .command('init', 'Initializes project', _init.default)
// .command('init:config', 'Initializes configuration', _init.default)
// .command('init:migrations', 'Initializes migrations', _init.default)
// .command('init:models', 'Initializes models', _init.default)
// .command('init:seeders', 'Initializes seeders', _init.default)

// .command(
//   ['migration:generate', 'migration:create'],
//   'Generates a new migration file',
//   _migration_generate.default
// )
// .command(
//   ['model:generate', 'model:create'],
//   'Generates a model and its migration',
//   _model_generate.default
// )
// .command(
//   ['seed:generate', 'seed:create'],
//   'Generates a new seed file',
//   _seed_generate.default
// )
