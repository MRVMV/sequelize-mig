import prettier from 'prettier';
import { pathConfig } from '../../lib/helpers.js';
import { migrate, updateMigrationState } from '../../lib/migration.js';

const sync = async (argv) => {
  const configOptions = pathConfig(argv);
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
  migration.consoles.forEach((action, index) => console.log(`[Action #${index}] ${action}`));
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
  console.log('Migrations synced successfully');
};

export default sync;
