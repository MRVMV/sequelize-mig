var _yargs = require('./core/yargs');
var _migration_add = require('./commands/migration_add');
var _index = require('./helpers/index');

const yargs = (0, _yargs.default)();

_index.default.view.teaser();

yargs
  .help()
  .version()
  .command('init', 'Initializes project', _init.default)
  .command('init:config', 'Initializes configuration', _init.default)
  .command('init:migrations', 'Initializes migrations', _init.default)
  .command('init:models', 'Initializes models', _init.default)
  .command('init:seeders', 'Initializes seeders', _init.default)
  .command(
    ['migration:add', 'migration:make'],
    'Make a new migration file by your own updates to models',
    _migration_add.default
  )
  .command(
    ['migration:generate', 'migration:create'],
    'Generates a new migration file',
    _migration_generate.default
  )
  .command(
    ['model:generate', 'model:create'],
    'Generates a model and its migration',
    _model_generate.default
  )
  .command(
    ['seed:generate', 'seed:create'],
    'Generates a new seed file',
    _seed_generate.default
  )
  .wrap(yargs.terminalWidth())
  .demandCommand(1, 'Please specify a command')
  .help()
  .strict()
  .recommendCommands().argv;
