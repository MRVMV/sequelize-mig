import { createRequire } from 'module';
import prettier from 'prettier';
import { pathConfig } from '../../lib/helpers.js';
import { migrate, updateMigrationState, writeMigration } from '../../lib/migration.js';
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
    console.log('No changes found, No new migration needed!');
    return;
  }

  // log migration actions
  migration.consoles.forEach((action, index) =>
    console.log(`[Action #${(index + 1).toString().padStart(2, '0')}] ${action}`),
  );

  if (argv.preview) {
    console.log('Migration result:');
    console.log(
      prettier.format(`[ \n${migration.commandsUp.join(', \n')} \n];\n`, {
        parser: 'babel',
      }),
    );
    return;
  }

  await updateMigrationState(currentState, previousState);

  // eslint-disable-next-line import/no-dynamic-require
  const { type } = require(configOptions.packageDir);

  // write migration to file
  const info = writeMigration(
    currentState.revision,
    migration,
    configOptions.migrationsDir,
    argv.name ? argv.name : 'noname',
    argv.comment ? argv.comment : '',
    argv.es6 !== null ? argv.es6 : type === 'module',
  );

  console.log(
    `New migration to revision ${currentState.revision} has been saved to file\n'${info.filename}'`,
  );
};

export default make;
