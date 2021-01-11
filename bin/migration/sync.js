import prettier from 'prettier';
import { pathConfig } from '../../lib/helpers.js';
import { migrate, updateMigrationState } from '../../lib/migration.js';
import { setLogLevel, log } from '../../lib/functions.js';

const sync = async (argv) => {
  setLogLevel(argv.logLevel);
  const configOptions = pathConfig(argv);

  log(1, `configOptions:${JSON.stringify(configOptions, null, 2)}`);

  let migrationResult;
  try {
    migrationResult = await migrate(configOptions);
  } catch (e) {
    log(4, e.message);
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

  log(3, `State file synced to db successfully`);
};

export default sync;
