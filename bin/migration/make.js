import { createRequire } from 'module';

import prettier from 'prettier';

import { migrate, updateMigrationState, writeMigration } from '../../lib/migration.js';
import { pathConfig } from '../../lib/helpers.js';
import { setLogLevel, log } from '../../lib/functions.js';

const require = createRequire(import.meta.url);

const make = async (argv) => {
  setLogLevel(argv.logLevel);

  const configOptions = pathConfig(argv);
  log(1, `configOptions:${JSON.stringify(configOptions, null, 2)}`);

  let migrationResult;
  try {
    migrationResult = await migrate(configOptions);
  } catch (e) {
    console.error(e.message);
    return;
  }
  const { previousState, currentState, migration } = migrationResult;

  if (migration.commandsUp.length === 0) {
    log(3, 'No changes found, No new migration needed!');
    return;
  }

  // log migration actions
  migration.consoles.forEach((action, index) =>
    log(3, `[Action #${(index + 1).toString().padStart(2, '0')}] ${action}`),
  );

  if (argv.preview) {
    log(3, 'Migration result:');
    log(
      3,
      prettier.format(`[ \n${migration.commandsUp.join(', \n')} \n];\n`, {
        parser: 'babel',
      }),
    );
    return;
  }

  await updateMigrationState(currentState, previousState);

  // eslint-disable-next-line import/no-dynamic-require
  const { type } = require(configOptions.packageDir);

  argv.es6 = argv.es6 || (type === 'module');
  
  // write migration to file
  const info = writeMigration(
    currentState.revision,
    migration,
    configOptions.migrationsDir,
    argv.name ? argv.name : 'noname',
    argv.comment ? argv.comment : '',
    argv.es6,
  );

  log(
    3,
    `New migration to revision ${currentState.revision} has been saved to file\n'${info.filename}'`,
  );
};

export default make;
